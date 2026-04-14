'use server'

import { revalidatePath }  from 'next/cache'
import { createClient }    from '@/utils/supabase/server'

export interface LogEvidenceResult {
  error: string | null
  success: boolean
}

/**
 * Server Action: inserts a photographic evidence log entry in order_logs.
 *
 * Called client-side after every file is confirmed uploaded (R2 → 200 OK).
 *
 * @param orderId   - UUID of the repair order
 * @param imageUrls - Array of public R2 URLs that were successfully uploaded
 */
export async function logEvidenceAction(
  orderId: string,
  imageUrls: string[],
): Promise<LogEvidenceResult> {
  if (!orderId)           return { error: 'orderId es requerido.',    success: false }
  if (!imageUrls.length)  return { error: 'No hay imágenes que registrar.', success: false }

  const supabase = await createClient()

  // ── Auth ─────────────────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Sesión inválida. Por favor inicia sesión de nuevo.', success: false }
  }

  // ── Insert log row ────────────────────────────────────────────────────────
  const { error: insertError } = await supabase
    .from('order_logs')
    .insert({
      order_id:    orderId,
      created_by:  user.id,
      description: 'Evidencia fotográfica agregada al recibir el equipo',
      image_urls:  imageUrls,
    })

  if (insertError) {
    console.error('[logEvidenceAction] insert failed:', insertError)
    return { error: 'No se pudo registrar la evidencia. Inténtalo de nuevo.', success: false }
  }

  // ── Revalidate detail page so the timeline shows new photos immediately ──
  revalidatePath(`/dashboard/ordenes/${orderId}`)

  return { error: null, success: true }
}
