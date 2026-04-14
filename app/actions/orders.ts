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
  // updated_at se establece explícitamente porque Supabase no tiene
  // un trigger de auto-update en esta tabla.
  const { error: updateError } = await supabase
    .from('repair_orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('workshop_id', profile.workshop_id)

  if (updateError) {
    console.error('[updateOrderStatusAction] update failed:', updateError)
    return { error: 'No se pudo actualizar el estado. Inténtalo de nuevo.', success: false, message: null }
  }

  // Revalidate listing, detail, and home dashboard (KPI counters)
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/ordenes')
  revalidatePath(`/dashboard/ordenes/${orderId}`)

  return { error: null, success: true, message: 'Estado actualizado correctamente.' }
}


/* ─────────────────────────────────────────────────────────────────────────── */

export type EditOrderState = {
  error: string | null
  success: boolean
  message: string | null
}

/**
 * Server Action: updates the editable fields of a repair order
 * (device data + reported failure).
 *
 * Multi-tenant safe: WHERE clause includes workshop_id.
 */
export async function updateOrderDetailsAction(
  orderId: string,
  prevState: EditOrderState,
  formData: FormData,
): Promise<EditOrderState> {
  const device_type      = (formData.get('device_type')      as string | null)?.trim()
  const brand            = (formData.get('brand')            as string | null)?.trim()
  const model            = (formData.get('model')            as string | null)?.trim()
  const reported_failure = (formData.get('reported_failure') as string | null)?.trim()
  const technician_id    = (formData.get('technician_id')    as string | null)?.trim() || null
  const comments         = (formData.get('comments')         as string | null)?.trim()  || null

  if (!device_type)      return { error: 'El tipo de equipo es obligatorio.',  success: false, message: null }
  if (!brand)            return { error: 'La marca es obligatoria.',            success: false, message: null }
  if (!model)            return { error: 'El modelo es obligatorio.',           success: false, message: null }
  if (!reported_failure) return { error: 'La falla reportada es obligatoria.', success: false, message: null }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Sesión inválida.', success: false, message: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) return { error: 'Taller no encontrado.', success: false, message: null }

  const { error: updateError } = await supabase
    .from('repair_orders')
    .update({
      device_type,
      brand,
      model,
      reported_failure,
      technician_id,
      comments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('workshop_id', profile.workshop_id)

  if (updateError) {
    console.error('[updateOrderDetailsAction]', updateError)
    return { error: 'No se pudo guardar. Inténtalo de nuevo.', success: false, message: null }
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/dashboard/ordenes/${orderId}`)

  return { error: null, success: true, message: 'Datos actualizados correctamente.' }
}


/* ─────────────────────────────────────────────────────────────────────────── */

export type FinancialsState = {
  error: string | null
  success: boolean
  message: string | null
}

/**
 * Server Action: updates financial fields and optionally logs a payment
 * (cierre de cuentas).
 *
 * If `register_payment` is 'true' in formData, inserts a row in order_logs
 * describing the payment and the amounts.
 */
export async function updateOrderFinancialsAction(
  orderId: string,
  prevState: FinancialsState,
  formData: FormData,
): Promise<FinancialsState> {
  const estimated_cost    = formData.get('estimated_cost')    ? Number(formData.get('estimated_cost'))    : null
  const advance_payment   = formData.get('advance_payment')   ? Number(formData.get('advance_payment'))   : null
  const register_payment  = formData.get('register_payment') === 'true'
  const payment_amount    = formData.get('payment_amount')    ? Number(formData.get('payment_amount'))    : null
  const new_status        = (formData.get('new_status') as string | null) ?? null

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Sesión inválida.', success: false, message: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) return { error: 'Taller no encontrado.', success: false, message: null }

  // ── Update financial fields (+ optional status change) ─────────────────
  const { error: updateError } = await supabase
    .from('repair_orders')
    .update({
      ...(estimated_cost  !== null && { estimated_cost }),
      ...(advance_payment !== null && { advance_payment }),
      ...(new_status               && { status: new_status }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('workshop_id', profile.workshop_id)

  if (updateError) {
    console.error('[updateOrderFinancialsAction]', updateError)
    return { error: 'No se pudo guardar. Inténtalo de nuevo.', success: false, message: null }
  }

  // ── Log payment + update advance_payment if registering payment ──────
  if (register_payment && payment_amount !== null && payment_amount > 0) {
    const totalCost    = estimated_cost ?? 0
    const prevAdvance  = advance_payment ?? 0
    const totalPaid    = prevAdvance + payment_amount
    const balance      = totalCost - totalPaid

    const description = [
      `Pago registrado al cierre de orden.`,
      `Costo total: $${totalCost.toFixed(2)} MXN.`,
      `Anticipo previo: $${prevAdvance.toFixed(2)} MXN.`,
      `Pago final: $${payment_amount.toFixed(2)} MXN.`,
      balance <= 0 ? 'Saldo: LIQUIDADO ✓' : `Saldo pendiente: $${balance.toFixed(2)} MXN.`,
    ].join(' ')

    // Update advance_payment to total paid so the balance card shows correctly
    await supabase
      .from('repair_orders')
      .update({ advance_payment: totalPaid })
      .eq('id', orderId)
      .eq('workshop_id', profile.workshop_id)

    await supabase.from('order_logs').insert({
      order_id:    orderId,
      created_by:  user.id,
      description,
    })
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/ordenes')
  revalidatePath(`/dashboard/ordenes/${orderId}`)

  return {
    error:   null,
    success: true,
    message: new_status && register_payment
      ? 'Pago registrado. Orden marcada como Entregada.'
      : register_payment
        ? 'Pago registrado y datos guardados.'
        : 'Datos financieros actualizados.',
  }
}

