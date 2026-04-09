'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

export type TenantActionState = {
  error: string | null
  success: boolean
}

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? ''

/**
 * Server Action: creates a new tenant (workshop + owner user).
 *
 * Only callable by the super-admin. Enforced server-side so no client
 * manipulation can bypass the guard.
 *
 * Flow:
 *  1. Verify the invoking user is the super-admin.
 *  2. INSERT into `workshops` → get the new workshop UUID.
 *  3. Create the owner via supabaseAdmin.auth.admin.createUser() with
 *     user_metadata containing workshop_id, role, and full_name so the
 *     DB trigger can auto-populate `profiles`.
 */
export async function createTenantAction(
  prevState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  // ── 1. Validate inputs ────────────────────────────────────────────────
  const workshop_name  = (formData.get('workshop_name')  as string | null)?.trim()
  const workshop_phone = (formData.get('workshop_phone') as string | null)?.trim() || null
  const workshop_addr  = (formData.get('workshop_addr')  as string | null)?.trim() || null
  const subscription_plan = (['basic', 'pro', 'enterprise'].includes(
    formData.get('subscription_plan') as string
  ) ? formData.get('subscription_plan') : 'basic') as string
  const initial_duration = (formData.get('initial_duration') as string | null) ?? 'trial_7'
  const owner_name     = (formData.get('owner_name')     as string | null)?.trim()
  const owner_email    = (formData.get('owner_email')    as string | null)?.trim().toLowerCase()
  const owner_password = (formData.get('owner_password') as string | null)?.trim()

  if (!workshop_name)  return { error: 'El nombre del taller es obligatorio.',      success: false }
  if (!owner_name)     return { error: 'El nombre del dueño es obligatorio.',        success: false }
  if (!owner_email)    return { error: 'El correo del dueño es obligatorio.',        success: false }
  if (!owner_password || owner_password.length < 8) {
    return { error: 'La contraseña temporal debe tener al menos 8 caracteres.',      success: false }
  }

  // ── Calculate subscription dates from initial_duration ──────────────────────
  const DURATION_MAP: Record<string, { days: number; status: string; isTrial: boolean }> = {
    trial_7:  { days: 7,   status: 'trialing', isTrial: true  },
    trial_14: { days: 14,  status: 'trialing', isTrial: true  },
    month_1:  { days: 30,  status: 'active',   isTrial: false },
    year_1:   { days: 365, status: 'active',   isTrial: false },
  }
  const durationCfg = DURATION_MAP[initial_duration] ?? DURATION_MAP['trial_7']

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + durationCfg.days)
  const expiresISO = expiresAt.toISOString()

  const subscription_status    = durationCfg.status
  const subscription_end_date  = expiresISO
  const trial_ends_at          = durationCfg.isTrial ? expiresISO : null

  // ── 2. Guard: only the super-admin can invoke this action ─────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Sesión inválida.', success: false }
  }
  if (user.email !== SUPER_ADMIN_EMAIL) {
    return { error: 'Acceso denegado.', success: false }
  }

  // ── 3. Create the workshop ────────────────────────────────────────────
  // Derive a URL-safe slug from the workshop name
  const slug = workshop_name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics (tildes, etc.)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    + '-' + Date.now()               // suffix to guarantee uniqueness

  const { data: workshop, error: workshopError } = await supabaseAdmin
    .from('workshops')
    .insert({
      name: workshop_name,
      slug,
      phone: workshop_phone,
      address: workshop_addr,
      subscription_plan,
      subscription_status,
      subscription_end_date,
      ...(trial_ends_at && { trial_ends_at }),
    })
    .select('id')
    .single()

  if (workshopError || !workshop?.id) {
    console.error('[createTenantAction] workshops insert failed:', workshopError)
    return { error: 'No se pudo crear el taller. Inténtalo de nuevo.', success: false }
  }

  const workshopId = workshop.id

  // ── 4. Create the owner user via Admin API ────────────────────────────
  // user_metadata is picked up by the DB trigger to auto-populate `profiles`.
  const { error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: owner_email,
    password: owner_password,
    email_confirm: true, // skip email confirmation for white-glove onboarding
    user_metadata: {
      full_name:   owner_name,
      role:        'admin',
      workshop_id: workshopId,
    },
  })

  if (userError) {
    // Rollback: remove the workshop we just created to avoid orphaned rows
    await supabaseAdmin.from('workshops').delete().eq('id', workshopId)
    console.error('[createTenantAction] createUser failed:', userError)
    return { error: `No se pudo crear el usuario: ${userError.message}`, success: false }
  }

  // ── 5. Revalidate the admin page so the workshop table refreshes ──────
  revalidatePath('/admin-core')

  return { error: null, success: true }
}


/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Server Action: updates an existing workshop's profile and subscription data.
 * Only callable by the super-admin.
 */
export async function updateTenantAction(
  prevState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  // ── 1. Parse inputs ───────────────────────────────────────────────────
  const workshop_id   = (formData.get('workshop_id')   as string | null)?.trim()
  const name          = (formData.get('workshop_name') as string | null)?.trim()
  const phone         = (formData.get('workshop_phone') as string | null)?.trim() || null
  const address       = (formData.get('workshop_addr')  as string | null)?.trim() || null
  const subscription_plan = (['basic', 'pro', 'enterprise'].includes(
    formData.get('subscription_plan') as string
  ) ? formData.get('subscription_plan') : 'basic') as string
  const subscription_status = (['active', 'trialing', 'canceled'].includes(
    formData.get('subscription_status') as string
  ) ? formData.get('subscription_status') : 'active') as string
  // end_date comes as an ISO date string from a date input (YYYY-MM-DD).
  // We convert to full ISO with time so Postgres timestamptz is happy.
  const endDateRaw    = (formData.get('subscription_end_date') as string | null)?.trim()
  const subscription_end_date = endDateRaw ? new Date(endDateRaw).toISOString() : null

  if (!workshop_id) return { error: 'ID de taller inválido.', success: false }
  if (!name)        return { error: 'El nombre del taller es obligatorio.', success: false }

  // ── 2. Guard ──────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Sesión inválida.', success: false }
  if (user.email !== SUPER_ADMIN_EMAIL) return { error: 'Acceso denegado.', success: false }

  // ── 3. Update workshop ────────────────────────────────────────────────
  const { error: updateError } = await supabaseAdmin
    .from('workshops')
    .update({
      name,
      phone,
      address,
      subscription_plan,
      subscription_status,
      subscription_end_date,
    })
    .eq('id', workshop_id)

  if (updateError) {
    console.error('[updateTenantAction] update failed:', updateError)
    return { error: 'No se pudo actualizar el taller. Inténtalo de nuevo.', success: false }
  }

  revalidatePath('/admin-core')
  return { error: null, success: true }
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Blocks a workshop: sets subscription_status = 'canceled'.
 * The dashboard guardian immediately shows ExpiredScreen to all its users.
 */
export async function blockTenantAction(
  _prevState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const workshop_id = (formData.get('workshop_id') as string | null)?.trim()
  if (!workshop_id) return { error: 'ID de taller inválido.', success: false }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Sesión inválida.', success: false }
  if (user.email !== SUPER_ADMIN_EMAIL) return { error: 'Acceso denegado.', success: false }

  const { error } = await supabaseAdmin
    .from('workshops')
    .update({ subscription_status: 'canceled' })
    .eq('id', workshop_id)

  if (error) {
    console.error('[blockTenantAction] failed:', error)
    return { error: 'No se pudo bloquear el taller.', success: false }
  }

  revalidatePath('/admin-core')
  return { error: null, success: true }
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Permanently deletes a workshop row.
 * NOTE: Supabase Auth users tied to this workshop are NOT deleted automatically.
 */
export async function deleteTenantAction(
  _prevState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const workshop_id = (formData.get('workshop_id') as string | null)?.trim()
  if (!workshop_id) return { error: 'ID de taller inválido.', success: false }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Sesión inválida.', success: false }
  if (user.email !== SUPER_ADMIN_EMAIL) return { error: 'Acceso denegado.', success: false }

  const { error } = await supabaseAdmin
    .from('workshops')
    .delete()
    .eq('id', workshop_id)

  if (error) {
    console.error('[deleteTenantAction] failed:', error)
    return { error: 'No se pudo eliminar el taller.', success: false }
  }

  revalidatePath('/admin-core')
  return { error: null, success: true }
}
