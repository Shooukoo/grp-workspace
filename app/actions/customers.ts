'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type CustomerActionState = {
  error: string | null
  success: boolean
}

/**
 * Server Action: inserts a new customer tied to the authenticated user's workshop.
 *
 * Multi-tenant safety:
 *  1. Retrieve the authenticated user from Supabase Auth.
 *  2. Look up their `workshop_id` from the `profiles` table.
 *  3. Insert into `customers` with that `workshop_id` — RLS provides a second
 *     layer of protection, but we always set it explicitly here.
 *
 * On success → revalidates /dashboard/clientes so the table refreshes without
 * a full page reload, and returns { success: true, error: null }.
 * On failure → returns a user-friendly error message.
 */
export async function createCustomerAction(
  prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const full_name = (formData.get('full_name') as string | null)?.trim()
  const whatsapp = (formData.get('whatsapp') as string | null)?.trim() || null

  if (!full_name) {
    return { error: 'El nombre completo es obligatorio.', success: false }
  }

  const supabase = await createClient()

  // 1. Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Sesión inválida. Por favor inicia sesión de nuevo.', success: false }
  }

  // 2. Get workshop_id from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.workshop_id) {
    console.error('[createCustomerAction] profiles query failed:', profileError)
    return {
      error: 'No se encontró el taller asociado a tu cuenta.',
      success: false,
    }
  }

  // 3. Insert the new customer
  const { error: insertError } = await supabase.from('customers').insert({
    full_name,
    whatsapp,
    workshop_id: profile.workshop_id,
  })

  if (insertError) {
    console.error('[createCustomerAction]', insertError)
    return {
      error: 'No se pudo registrar el cliente. Inténtalo de nuevo.',
      success: false,
    }
  }

  // 4. Revalidate the customers page so the Server Component re-fetches
  revalidatePath('/dashboard/clientes')

  return { error: null, success: true }
}
