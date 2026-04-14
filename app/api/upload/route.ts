/**
 * POST /api/upload
 *
 * Accepts a multipart/form-data request with:
 *   - file:        the image blob
 *   - workshopId:  tenant ID
 *   - orderId:     repair order UUID
 *
 * Uploads directly from the server to Cloudflare R2 (no CORS issues),
 * then returns { publicUrl, key }.
 */
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient }     from '@/utils/supabase/server'
import { r2Client, R2_BUCKET_NAME } from '@/lib/cloudflare-r2'
import { randomUUID }       from 'crypto'

export async function POST(request: Request) {
  // ── Auth guard ──────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse multipart body ────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file        = formData.get('file')
  const workshopId  = formData.get('workshopId')?.toString()
  const orderId     = formData.get('orderId')?.toString()

  if (!(file instanceof Blob)) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!workshopId || !orderId) {
    return Response.json({ error: 'Missing workshopId or orderId' }, { status: 400 })
  }

  // ── Build object key (per-tenant path) ──────────────────────────────────
  const uuid        = randomUUID()
  const timestamp   = Date.now()
  const contentType = file.type || 'image/jpeg'
  const key         = `workshops/${workshopId}/orders/${orderId}/${uuid}-${timestamp}.jpg`

  // ── Upload to R2 from the server (no CORS) ──────────────────────────────
  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    await r2Client.send(
      new PutObjectCommand({
        Bucket:      R2_BUCKET_NAME,
        Key:         key,
        Body:        buffer,
        ContentType: contentType,
      })
    )

    const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
    if (!publicBase) {
      console.error('[POST /api/upload] NEXT_PUBLIC_R2_PUBLIC_URL is not set')
      return Response.json({ error: 'Public URL not configured' }, { status: 500 })
    }
    const publicUrl = `${publicBase}/${key}`

    return Response.json({ publicUrl, key })
  } catch (err) {
    console.error('[POST /api/upload] R2 upload failed:', err)
    return Response.json({ error: 'Upload to storage failed' }, { status: 500 })
  }
}
