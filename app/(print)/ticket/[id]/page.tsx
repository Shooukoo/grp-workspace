import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import TicketActions from './TicketActions'

/* ─── Metadata ────────────────────────────────────────────────────────────── */
export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params
  return { title: `Ticket #${id.slice(-6).toUpperCase()} | GRP Workspace` }
}

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface RepairOrder {
  id: string
  workshop_id: string
  device_type: string
  brand: string
  model: string
  reported_failure: string
  estimated_cost: number | null
  advance_payment: number | null
  public_token: string | null
  created_at: string
  customers:
    | { full_name: string; whatsapp: string | null }
    | { full_name: string; whatsapp: string | null }[]
    | null
}

interface Workshop {
  name: string
  slug: string | null
  phone: string | null
  address: string | null
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function resolveCustomer(raw: RepairOrder['customers']) {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  })
}

function formatMoney(amount: number | null) {
  if (!amount) return null
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function TicketPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params
  const supabase = await createClient()

  // ── Query 1: orden + cliente ──────────────────────────────────────────
  const { data, error } = await supabase
    .from('repair_orders')
    .select('*, customers(*)')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const order    = data as unknown as RepairOrder
  const customer = resolveCustomer(order.customers)

  // ── Query 2: taller por workshop_id (admin — bypass RLS) ──────────────
  const { data: workshopData, error: wsError } = await supabaseAdmin
    .from('workshops')
    .select('name, slug, phone, address')
    .eq('id', order.workshop_id)
    .single()

  const ws = workshopData as Workshop | null
  const workshopName    = ws?.name    ?? 'GRP Workspace'
  const workshopTagline = ws?.address ?? ''
  const workshopPhone   = ws?.phone   ?? customer?.whatsapp ?? null
  const folio    = `#${order.id.slice(-6).toUpperCase()}`
  const fecha    = formatDate(order.created_at)
  const hora     = formatTime(order.created_at)

  const baseUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://grp-workspace.vercel.app'
  const trackUrl = order.public_token
    ? `${baseUrl}/seguimiento/${order.public_token}`
    : `${baseUrl}/seguimiento/${order.id}`

  const qrDataUrl = await QRCode.toDataURL(trackUrl, {
    width: 130,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })

  const anticipo = formatMoney(order.advance_payment)
  const costo    = formatMoney(order.estimated_cost)

  return (
    <>
      {/* Botones solo visibles en pantalla */}
      <TicketActions orderId={id} />

      <style>{`
        /* ── Pantalla: fondo oscuro, ticket centrado ── */
        body {
          background: #0d0f1a;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 5rem 1rem 3rem;
          min-height: 100vh;
          font-family: 'Courier New', Courier, monospace;
        }

        .ticket {
          width: 72mm;
          background: #fff;
          color: #000;
          font-family: 'Courier New', Courier, monospace;
          font-size: 9pt;
          line-height: 1.4;
          padding: 4mm;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        }

        .t-center { text-align: center; }
        .t-bold   { font-weight: 700; }
        .t-sm     { font-size: 7.5pt; }
        .t-xs     { font-size: 6pt; }
        .t-xxl    { font-size: 22pt; font-weight: 900; }

        .t-hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 2.5mm 0;
        }

        .t-lbl {
          font-size: 6pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #555;
          margin: 2mm 0 0.5mm;
        }

        .t-val    { margin: 0; font-size: 9pt; }
        .t-val-lg { margin: 0; font-size: 11pt; font-weight: 700; }

        .t-row { display: flex; justify-content: space-between; gap: 4mm; }
        .t-col { flex: 1; }

        .t-qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 2mm 0;
          gap: 1mm;
        }

        .t-footer {
          font-size: 6.5pt;
          color: #555;
          text-align: center;
          margin-top: 1mm;
        }

        /* Separador visual entre parte 1 y parte 2 — solo en pantalla */
        .cut-line {
          width: 72mm;
          display: flex;
          align-items: center;
          gap: 2mm;
          margin: 4mm 0;
          color: #444;
          font-size: 7px;
          letter-spacing: 0.1em;
        }
        .cut-line::before,
        .cut-line::after {
          content: '';
          flex: 1;
          border-top: 1px dashed #444;
        }

        .t-part2-hdr {
          background: #000;
          color: #fff;
          text-align: center;
          padding: 2mm 4mm;
          font-size: 7.5pt;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin: -4mm -4mm 3mm -4mm;
        }

        .t-blank {
          border-bottom: 1px solid #000;
          height: 5mm;
          margin-top: 1mm;
          margin-bottom: 2mm;
        }

        /* ── IMPRESIÓN ── */
        @media print {
          @page { margin: 0; size: 72mm auto; }

          body {
            background: white !important;
            padding: 2mm !important;
            display: block !important;
            min-height: unset !important;
          }

          .ticket {
            box-shadow: none !important;
            width: 72mm !important;
            padding: 3mm !important;
          }

          /* Separador se convierte en page-break para impresoras con cutter */
          .cut-line { display: none !important; }
          .ticket-part2 { page-break-before: always; }

          .no-print { display: none !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════
          PARTE 1: CLIENTE
      ══════════════════════════════════════════ */}
      <div className="ticket">

        {/* Cabecera taller */}
        <p className="t-center t-bold" style={{ fontSize: '11pt', letterSpacing: '0.04em' }}>
          {workshopName.toUpperCase()}
        </p>
        <p className="t-center t-sm" style={{ color: '#555' }}>
          {workshopTagline}
        </p>

        <hr className="t-hr" />

        {/* Folio + Fecha */}
        <div className="t-row" style={{ marginTop: '1mm' }}>
          <div className="t-col">
            <p className="t-lbl" style={{ marginTop: 0 }}>Folio</p>
            <p className="t-val-lg">{folio}</p>
          </div>
          <div className="t-col t-center">
            <p className="t-lbl" style={{ marginTop: 0 }}>Fecha</p>
            <p className="t-val t-sm">{fecha}</p>
            <p className="t-val t-sm">{hora}</p>
          </div>
        </div>

        {/* Cliente */}
        <p className="t-lbl">Cliente</p>
        <p className="t-val t-bold">{customer?.full_name ?? '—'}</p>

        {/* Equipo */}
        <p className="t-lbl">Equipo</p>
        <p className="t-val">{order.brand} {order.model}</p>

        {/* Falla */}
        <p className="t-lbl">Falla reportada</p>
        <p className="t-val" style={{ whiteSpace: 'pre-wrap' }}>{order.reported_failure}</p>

        {/* Financiero — solo si existen */}
        {(costo || anticipo) && <hr className="t-hr" />}
        {costo && <>
          <p className="t-lbl" style={{ marginTop: 0 }}>Costo estimado</p>
          <p className="t-val">{costo}</p>
        </>}
        {anticipo && <>
          <p className="t-lbl">Anticipo</p>
          <p className="t-val t-bold">{anticipo}</p>
        </>}

        {/* QR */}
        <hr className="t-hr" />
        <div className="t-qr">
          <p className="t-lbl" style={{ marginTop: 0, textAlign: 'center' }}>
            Escanea para ver tu estado
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR seguimiento" width={130} height={130}
            style={{ imageRendering: 'pixelated' }} />
          <p className="t-xs t-center" style={{ color: '#666', wordBreak: 'break-all' }}>
            {trackUrl}
          </p>
        </div>

        <hr className="t-hr" />
        <p className="t-footer" style={{ fontStyle: 'italic' }}>
          Conserva este ticket para recoger tu equipo
        </p>
        {workshopPhone && (
          <p className="t-footer">Tel: {workshopPhone} · WhatsApp disponible</p>
        )}
      </div>

      {/* Separador visual — pantalla */}
      <div className="cut-line no-print" />

      {/* ══════════════════════════════════════════
          PARTE 2: TALLER
      ══════════════════════════════════════════ */}
      <div className="ticket ticket-part2">
        <div className="t-part2-hdr">Equipo en Reparacion</div>

        <p className="t-xxl t-center" style={{
          margin: '1mm 0 2mm',
          borderBottom: '2px solid #000',
          paddingBottom: '2mm',
        }}>
          {folio}
        </p>

        <p className="t-lbl" style={{ marginTop: 0 }}>Cliente</p>
        <p className="t-val t-bold">{customer?.full_name ?? '—'}</p>

        <p className="t-lbl">Equipo</p>
        <p className="t-val">{order.brand} {order.model}</p>

        <p className="t-lbl">Falla</p>
        <p className="t-val">{order.reported_failure}</p>

        <hr className="t-hr" />

        <p className="t-lbl">Tecnico asignado</p>
        <div className="t-blank" />

        <hr className="t-hr" />

        <p className="t-footer">{fecha} · {hora} · {workshopName}</p>
      </div>
    </>
  )
}
