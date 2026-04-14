'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { parseCompatibility } from '@/utils/inventory'

/* ─── Shared state type ───────────────────────────────────────────────────── */

export type InventoryActionState = {
  error: string | null
  success: boolean
  message: string | null
}

/* parseCompatibility lives in utils/inventory.ts (not exported here to avoid
   the 'use server' constraint that all exports must be async functions) */

/* ─── Helper: resolve workshopId + supabase client from session ───────────── */

async function getSessionContext(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>
  workshopId: string | null
  userId: string | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase, workshopId: null, userId: null, error: 'Sesión inválida. Por favor inicia sesión de nuevo.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.workshop_id) {
    console.error('[inventory] profiles query failed:', profileError)
    return { supabase, workshopId: null, userId: user.id, error: 'No se encontró el taller asociado a tu cuenta.' }
  }

  return { supabase, workshopId: profile.workshop_id, userId: user.id, error: null }
}

/* ─── createPartAction ────────────────────────────────────────────────────── */

/**
 * Inserts a new part into `parts_inventory`.
 * workshop_id is always resolved from the server session (never trusted from client).
 */
export async function createPartAction(
  prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const name                 = (formData.get('name')                as string | null)?.trim()
  const brand                = (formData.get('brand')               as string | null)?.trim()
  const model_compat_raw     = (formData.get('model_compatibility') as string | null) ?? ''
  const cost_price_raw       = formData.get('cost_price')
  const sale_price_raw       = formData.get('sale_price')
  const stock_quantity_raw   = formData.get('stock_quantity')
  const min_stock_alert_raw  = formData.get('min_stock_alert')
  const location_in_workshop = (formData.get('location_in_workshop') as string | null)?.trim() || null

  if (!name)  return { error: 'El nombre de la pieza es obligatorio.', success: false, message: null }
  if (!brand) return { error: 'La marca es obligatoria.', success: false, message: null }

  const cost_price      = cost_price_raw      ? Number(cost_price_raw)                     : null
  const sale_price      = sale_price_raw      ? Number(sale_price_raw)                     : null
  const stock_quantity  = stock_quantity_raw  ? parseInt(String(stock_quantity_raw),  10)  : 0
  const min_stock_alert = min_stock_alert_raw ? parseInt(String(min_stock_alert_raw), 10)  : 0

  const model_compatibility = parseCompatibility(model_compat_raw)

  const { supabase, workshopId, error: authError } = await getSessionContext()
  if (authError || !workshopId) {
    return { error: authError ?? 'Error de autenticación.', success: false, message: null }
  }

  const { error: insertError } = await supabase.from('parts_inventory').insert({
    workshop_id: workshopId,
    name,
    brand,
    model_compatibility,
    cost_price,
    sale_price,
    stock_quantity,
    min_stock_alert,
    location_in_workshop,
  })

  if (insertError) {
    console.error('[createPartAction] insert failed:', insertError)
    return { error: 'No se pudo guardar la refacción. Inténtalo de nuevo.', success: false, message: null }
  }

  revalidatePath('/dashboard/inventario')
  return { error: null, success: true, message: `Refacción "${name}" registrada correctamente.` }
}

/* ─── updatePartAction ────────────────────────────────────────────────────── */

/**
 * Updates master data fields of an existing part (does NOT touch stock_quantity).
 * Multi-tenant safe: WHERE includes workshop_id so foreign workshops can't edit.
 */
export async function updatePartAction(
  partId: string,
  prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const name                 = (formData.get('name')                as string | null)?.trim()
  const brand                = (formData.get('brand')               as string | null)?.trim()
  const model_compat_raw     = (formData.get('model_compatibility') as string | null) ?? ''
  const cost_price_raw       = formData.get('cost_price')
  const sale_price_raw       = formData.get('sale_price')
  const min_stock_alert_raw  = formData.get('min_stock_alert')
  const location_in_workshop = (formData.get('location_in_workshop') as string | null)?.trim() || null

  if (!name)  return { error: 'El nombre de la pieza es obligatorio.', success: false, message: null }
  if (!brand) return { error: 'La marca es obligatoria.', success: false, message: null }

  const cost_price      = cost_price_raw      ? Number(cost_price_raw)                     : null
  const sale_price      = sale_price_raw      ? Number(sale_price_raw)                     : null
  const min_stock_alert = min_stock_alert_raw ? parseInt(String(min_stock_alert_raw), 10)  : 0

  const model_compatibility = parseCompatibility(model_compat_raw)

  const { supabase, workshopId, error: authError } = await getSessionContext()
  if (authError || !workshopId) {
    return { error: authError ?? 'Error de autenticación.', success: false, message: null }
  }

  const { error: updateError } = await supabase
    .from('parts_inventory')
    .update({
      name,
      brand,
      model_compatibility,
      cost_price,
      sale_price,
      min_stock_alert,
      location_in_workshop,
    })
    .eq('id', partId)
    .eq('workshop_id', workshopId)

  if (updateError) {
    console.error('[updatePartAction] update failed:', updateError)
    return { error: 'No se pudo actualizar la refacción. Inténtalo de nuevo.', success: false, message: null }
  }

  revalidatePath('/dashboard/inventario')
  return { error: null, success: true, message: `Refacción "${name}" actualizada.` }
}

/* ─── updateStockAction  (quick ±1 buttons) ───────────────────────────────── */

/**
 * Adjusts stock by a signed delta of 1 or -1.
 * Stock is clamped to 0 — never goes negative.
 */
export async function updateStockAction(
  part_id: string,
  delta: number,
): Promise<InventoryActionState> {
  const { supabase, workshopId, error: authError } = await getSessionContext()
  if (authError || !workshopId) {
    return { error: authError ?? 'Error de autenticación.', success: false, message: null }
  }

  const { data: part, error: fetchError } = await supabase
    .from('parts_inventory')
    .select('stock_quantity')
    .eq('id', part_id)
    .eq('workshop_id', workshopId)
    .single()

  if (fetchError || !part) {
    return { error: 'Refacción no encontrada.', success: false, message: null }
  }

  const newQty = Math.max(0, (part.stock_quantity ?? 0) + delta)

  const { error: updateError } = await supabase
    .from('parts_inventory')
    .update({ stock_quantity: newQty })
    .eq('id', part_id)
    .eq('workshop_id', workshopId)

  if (updateError) {
    console.error('[updateStockAction] update failed:', updateError)
    return { error: 'No se pudo actualizar el stock.', success: false, message: null }
  }

  revalidatePath('/dashboard/inventario')
  return { error: null, success: true, message: `Stock actualizado a ${newQty}.` }
}

/* ─── adjustStockAction  (bulk entry / exit) ──────────────────────────────── */

/**
 * Records a stock movement: entry adds, exit subtracts.
 * On exit, stock is clamped to 0.
 *
 * Atomic pattern: fetch current → compute newQty → update with WHERE id + workshop_id.
 */
export async function adjustStockAction(
  part_id: string,
  amount: number,
  type: 'entry' | 'exit',
): Promise<InventoryActionState> {
  if (!amount || amount <= 0) {
    return { error: 'La cantidad debe ser mayor a 0.', success: false, message: null }
  }

  const { supabase, workshopId, error: authError } = await getSessionContext()
  if (authError || !workshopId) {
    return { error: authError ?? 'Error de autenticación.', success: false, message: null }
  }

  const { data: part, error: fetchError } = await supabase
    .from('parts_inventory')
    .select('stock_quantity, name')
    .eq('id', part_id)
    .eq('workshop_id', workshopId)
    .single()

  if (fetchError || !part) {
    return { error: 'Refacción no encontrada.', success: false, message: null }
  }

  const current = part.stock_quantity ?? 0
  const newQty  = type === 'entry'
    ? current + amount
    : Math.max(0, current - amount)

  const { error: updateError } = await supabase
    .from('parts_inventory')
    .update({ stock_quantity: newQty })
    .eq('id', part_id)
    .eq('workshop_id', workshopId)

  if (updateError) {
    console.error('[adjustStockAction] update failed:', updateError)
    return { error: 'No se pudo registrar el movimiento.', success: false, message: null }
  }

  revalidatePath('/dashboard/inventario')

  const label = type === 'entry' ? 'Entrada' : 'Salida'
  return {
    error:   null,
    success: true,
    message: `${label} de ${amount} u. registrada. Stock: ${newQty}.`,
  }
}

/* ─── deletePartAction ────────────────────────────────────────────────────── */

/**
 * Permanently deletes a part from parts_inventory.
 * Multi-tenant safe: scoped to workshop_id.
 */
export async function deletePartAction(part_id: string): Promise<InventoryActionState> {
  const { supabase, workshopId, error: authError } = await getSessionContext()
  if (authError || !workshopId) {
    return { error: authError ?? 'Error de autenticación.', success: false, message: null }
  }

  const { error: deleteError } = await supabase
    .from('parts_inventory')
    .delete()
    .eq('id', part_id)
    .eq('workshop_id', workshopId)

  if (deleteError) {
    console.error('[deletePartAction] delete failed:', deleteError)
    return { error: 'No se pudo eliminar la refacción.', success: false, message: null }
  }

  revalidatePath('/dashboard/inventario')
  return { error: null, success: true, message: 'Refacción eliminada.' }
}

/* ─── repair_order_parts actions ─────────────────────────────────────────── */

/**
 * Adds a part from parts_inventory to a repair order.
 *
 * - Validates that the part belongs to the same workshop (multi-tenant).
 * - Snapshots sale_price as unit_price at the moment of assignment so future
 *   price changes don't affect existing orders.
 * - If the same part is already on the order, increments quantity instead of
 *   creating a duplicate row.
 * - Does NOT decrement stock here; the technician manages stock separately.
 */
export async function addPartToOrderAction(
  orderId:  string,
  partId:   string,
  quantity: number,
): Promise<InventoryActionState> {
  if (quantity <= 0) {
    return { error: 'La cantidad debe ser mayor a 0.', success: false, message: null }
  }

  const { supabase, workshopId, userId, error: authError } = await getSessionContext()
  if (authError || !workshopId) {
    return { error: authError ?? 'Error de autenticación.', success: false, message: null }
  }

  // Verify the part belongs to this workshop and fetch snapshot price
  const { data: part, error: partError } = await supabase
    .from('parts_inventory')
    .select('id, name, sale_price')
    .eq('id', partId)
    .eq('workshop_id', workshopId)
    .single()

  if (partError || !part) {
    return { error: 'Refacción no encontrada en tu inventario.', success: false, message: null }
  }

  // Upsert: increment if row already exists, otherwise insert
  const { data: existing } = await supabase
    .from('repair_order_parts')
    .select('id, quantity')
    .eq('order_id', orderId)
    .eq('part_id', partId)
    .maybeSingle()

  if (existing) {
    const { error: updErr } = await supabase
      .from('repair_order_parts')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)

    if (updErr) {
      console.error('[addPartToOrderAction] update failed:', updErr)
      return { error: `Error al actualizar cantidad: ${updErr.message}`, success: false, message: null }
    }
  } else {
    const { error: insErr } = await supabase
      .from('repair_order_parts')
      .insert({
        order_id:           orderId,
        part_id:            partId,
        quantity,
        unit_price_at_sale: part.sale_price,
        assigned_by:        userId,
      })

    if (insErr) {
      console.error('[addPartToOrderAction] insert failed:', insErr)
      return { error: `Error al insertar: ${insErr.message} (code: ${insErr.code})`, success: false, message: null }
    }
  }

  revalidatePath(`/dashboard/ordenes/${orderId}`)
  return { error: null, success: true, message: `"${part.name}" agregada a la orden.` }
}

/**
 * Removes a part row from repair_order_parts.
 */
export async function removePartFromOrderAction(
  orderId:       string,
  orderPartId:   string,
): Promise<InventoryActionState> {
  const { supabase, error: authError } = await getSessionContext()
  if (authError) {
    return { error: authError, success: false, message: null }
  }

  const { error: delErr } = await supabase
    .from('repair_order_parts')
    .delete()
    .eq('id', orderPartId)

  if (delErr) {
    console.error('[removePartFromOrderAction] delete failed:', delErr)
    return { error: 'No se pudo quitar la refacción.', success: false, message: null }
  }

  revalidatePath(`/dashboard/ordenes/${orderId}`)
  return { error: null, success: true, message: 'Refacción eliminada de la orden.' }
}

/**
 * Updates the quantity of an already-added part on the order.
 * If quantity reaches 0, removes the row entirely.
 */
export async function updateOrderPartQtyAction(
  orderId:     string,
  orderPartId: string,
  newQty:      number,
): Promise<InventoryActionState> {
  const { supabase, error: authError } = await getSessionContext()
  if (authError) {
    return { error: authError, success: false, message: null }
  }

  if (newQty <= 0) {
    return removePartFromOrderAction(orderId, orderPartId)
  }

  const { error: updErr } = await supabase
    .from('repair_order_parts')
    .update({ quantity: newQty })
    .eq('id', orderPartId)

  if (updErr) {
    console.error('[updateOrderPartQtyAction] update failed:', updErr)
    return { error: 'No se pudo actualizar la cantidad.', success: false, message: null }
  }

  revalidatePath(`/dashboard/ordenes/${orderId}`)
  return { error: null, success: true, message: 'Cantidad actualizada.' }
}
