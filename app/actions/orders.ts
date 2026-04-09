'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type OrderActionState = {
  error: string | null
  success: boolean
}

/**
 * Server Action: creates a new repair order for the authenticated user's workshop.
 *
 * Multi-tenant flow:
 *  1. Verify auth session.
 *  2. Resolve `workshop_id` from `profiles`.
 *  3. Insert into `repair_orders` with status = 'received'.
 *  4. Redirect to /dashboard/ordenes — redirect() throws internally so it must
 *     be called outside any try/catch.
 */
export async function createOrderAction(
  prevState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  // ── 1. Shared fields ─────────────────────────────────────────────────
  const is_new_customer  = formData.get('is_new_customer') === 'true'
  const device_type      = (formData.get('device_type')      as string | null)?.trim()
  const brand            = (formData.get('brand')            as string | null)?.trim()
  const model            = (formData.get('model')            as string | null)?.trim()
  const reported_failure = (formData.get('reported_failure') as string | null)?.trim()
  const estimated_cost   = formData.get('estimated_cost')   ? Number(formData.get('estimated_cost'))   : null
  const advance_payment  = formData.get('advance_payment')  ? Number(formData.get('advance_payment'))  : null

  if (!device_type)      return { error: 'Selecciona el tipo de equipo.', success: false }
  if (!brand)            return { error: 'La marca es obligatoria.', success: false }
  if (!model)            return { error: 'El modelo es obligatorio.', success: false }
  if (!reported_failure) return { error: 'Describe la falla reportada.', success: false }

  const supabase = await createClient()

  // ── 2. Auth ──────────────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Sesión inválida. Por favor inicia sesión de nuevo.', success: false }
  }

  // ── 3. Workshop ID from profiles ─────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.workshop_id) {
    console.error('[createOrderAction] profiles query failed:', profileError)
    return { error: 'No se encontró el taller asociado a tu cuenta.', success: false }
  }

  const workshopId = profile.workshop_id

  // ── 4. Resolve customer_id ───────────────────────────────────────────
  let customer_id: string

  if (is_new_customer) {
    // 4a. Crear cliente nuevo inline
    const new_customer_name      = (formData.get('new_customer_name')      as string | null)?.trim()
    const new_customer_whatsapp  = (formData.get('new_customer_whatsapp')  as string | null)?.trim() || null

    if (!new_customer_name) {
      return { error: 'El nombre del nuevo cliente es obligatorio.', success: false }
    }

    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        workshop_id: workshopId,
        full_name:   new_customer_name,
        whatsapp:    new_customer_whatsapp,
      })
      .select('id')
      .single()

    if (customerError || !newCustomer?.id) {
      console.error('[createOrderAction] customer insert failed:', customerError)
      return { error: 'No se pudo crear el cliente. Inténtalo de nuevo.', success: false }
    }

    customer_id = newCustomer.id
  } else {
    // 4b. Usar cliente existente del select
    const selected = (formData.get('customer_id') as string | null)?.trim()
    if (!selected) return { error: 'Selecciona un cliente.', success: false }
    customer_id = selected
  }

  // ── 5. Insert repair order ───────────────────────────────────────────
  const { error: insertError } = await supabase.from('repair_orders').insert({
    workshop_id: workshopId,
    customer_id,
    device_type,
    brand,
    model,
    reported_failure,
    status: 'received',
    ...(estimated_cost  !== null && { estimated_cost }),
    ...(advance_payment !== null && { advance_payment }),
  })

  if (insertError) {
    console.error('[createOrderAction] insert failed:', insertError)
    return { error: 'No se pudo crear la orden. Inténtalo de nuevo.', success: false }
  }

  // ── 6. Redirect — must be outside try/catch ──────────────────────────
  redirect('/dashboard/ordenes')
}


/* ─────────────────────────────────────────────────────────────────────────── */

export type UpdateStatusState = {
  error: string | null
  success: boolean
  message: string | null
}

/**
 * Server Action: updates the status of a repair order.
 *
 * Called via .bind(null, orderId) so that `orderId` arrives as the first
 * argument before `prevState` and `formData` when used with useActionState.
 *
 * Multi-tenant safety: the UPDATE WHERE clause includes workshop_id so a user
 * from another workshop cannot affect orders they don't own, even if they
 * somehow know the order UUID.
 */
export async function updateOrderStatusAction(
  orderId: string,
  prevState: UpdateStatusState,
  formData: FormData,
): Promise<UpdateStatusState> {
  const newStatus = (formData.get('status') as string | null)?.trim()

  if (!newStatus) {
    return { error: 'Selecciona un estado válido.', success: false, message: null }
  }

  const supabase = await createClient()

  // Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Sesión inválida.', success: false, message: null }
  }

  // Workshop ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.workshop_id) {
    console.error('[updateOrderStatusAction] profiles query failed:', profileError)
    return { error: 'No se encontró el taller asociado a tu cuenta.', success: false, message: null }
  }

  // UPDATE — scoped to this workshop for multi-tenant safety
  const { error: updateError } = await supabase
    .from('repair_orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .eq('workshop_id', profile.workshop_id)

  if (updateError) {
    console.error('[updateOrderStatusAction] update failed:', updateError)
    return { error: 'No se pudo actualizar el estado. Inténtalo de nuevo.', success: false, message: null }
  }

  // Revalidate both listing and detail pages
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/dashboard/ordenes')
  revalidatePath(`/dashboard/ordenes/${orderId}`)

  return { error: null, success: true, message: 'Estado actualizado correctamente.' }
}
