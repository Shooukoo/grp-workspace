'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

export type EmployeeActionState = {
  error: string | null
  success: boolean
}

const VALID_ROLES = ['technician', 'receptionist'] as const
type EmployeeRole = (typeof VALID_ROLES)[number]

/**
 * Server Action: creates a new employee Auth account for the current admin's workshop.
 *
 * Security flow:
 *  1. Verify the caller is authenticated.
 *  2. Confirm they have role === 'admin' in the profiles table.
 *  3. Use supabaseAdmin (service_role) to call auth.admin.createUser()
 *     with email_confirm: true so the employee can log in immediately.
 *  4. Pass full_name, role, workshop_id in user_metadata — the Postgres
 *     trigger on auth.users will auto-insert the profiles row.
 *  5. Revalidate /dashboard/empleados so the table refreshes.
 */
export async function createEmployeeAction(
  prevState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  // ── 1. Extract + validate fields ─────────────────────────────────────
  const full_name = (formData.get('full_name') as string | null)?.trim()
  const email     = (formData.get('email')     as string | null)?.trim()
  const password  = (formData.get('password')  as string | null)
  const role      = (formData.get('role')      as string | null)?.trim() as EmployeeRole | null

  if (!full_name) return { error: 'El nombre completo es obligatorio.', success: false }
  if (!email)     return { error: 'El correo electrónico es obligatorio.', success: false }
  if (!password || password.length < 6)
    return { error: 'La contraseña temporal debe tener al menos 6 caracteres.', success: false }
  if (!role || !VALID_ROLES.includes(role))
    return { error: 'Selecciona un rol válido.', success: false }

  // ── 2. Auth — verify caller is a logged-in admin ─────────────────────
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Sesión inválida. Por favor inicia sesión de nuevo.', success: false }
  }

  // ── 3. Profile — resolve workshop_id + confirm admin role ─────────────
  const { data: adminProfile, error: profileError } = await supabase
    .from('profiles')
    .select('workshop_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !adminProfile?.workshop_id) {
    console.error('[createEmployeeAction] profiles query failed:', profileError)
    return { error: 'No se encontró el taller asociado a tu cuenta.', success: false }
  }

  if (adminProfile.role !== 'admin') {
    return { error: 'Solo los administradores pueden crear empleados.', success: false }
  }

  // ── 4. Create the Auth user via Admin client (bypasses RLS) ──────────
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,          // employee can log in immediately
    user_metadata: {
      full_name,
      role,
      workshop_id: adminProfile.workshop_id,
    },
  })

  if (createError) {
    console.error('[createEmployeeAction] admin.createUser failed:', createError)

    // Translate common Supabase Auth errors
    if (createError.message.toLowerCase().includes('already registered') ||
        createError.message.toLowerCase().includes('already been registered') ||
        createError.message.toLowerCase().includes('unique')) {
      return { error: 'Ya existe una cuenta con ese correo electrónico.', success: false }
    }

    return { error: `No se pudo crear el empleado: ${createError.message}`, success: false }
  }

  console.log('[createEmployeeAction] created user:', newUser?.user?.id)

  // ── 5. Revalidate employees page ─────────────────────────────────────
  revalidatePath('/dashboard/empleados')

  return { error: null, success: true }
}
