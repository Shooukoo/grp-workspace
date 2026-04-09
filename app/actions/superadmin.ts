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
  const owner_name     = (formData.get('owner_name')     as string | null)?.trim()
  const owner_email    = (formData.get('owner_email')    as string | null)?.trim().toLowerCase()
  const owner_password = (formData.get('owner_password') as string | null)?.trim()

  if (!workshop_name)  return { error: 'El nombre del taller es obligatorio.',      success: false }
  if (!owner_name)     return { error: 'El nombre del dueño es obligatorio.',        success: false }
  if (!owner_email)    return { error: 'El correo del dueño es obligatorio.',        success: false }
  if (!owner_password || owner_password.length < 8) {
    return { error: 'La contraseña temporal debe tener al menos 8 caracteres.',      success: false }
  }

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
    .insert({ name: workshop_name, slug, phone: workshop_phone, address: workshop_addr })
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
