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

interface TicketPart {
  id: string
  quantity: number
  unit_price_at_sale: number | null
  parts_inventory: { name: string } | { name: string }[] | null
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
  const { data: workshopData } = await supabaseAdmin
    .from('workshops')
    .select('name, slug, phone, address')
    .eq('id', order.workshop_id)
    .single()

  // ── Query 3: refacciones usadas en la orden ────────────────────────────
  const { data: partsData } = await supabase
    .from('repair_order_parts')
    .select('id, quantity, unit_price_at_sale, parts_inventory(name)')
    .eq('order_id', id)
    .order('assigned_at', { ascending: true })

  const ticketParts: TicketPart[] = (partsData ?? []) as unknown as TicketPart[]

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
          font-size: 8pt;
          font-weight: 700;
          line-height: 1.3;
          padding: 2.5mm;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        }

        .t-center { text-align: center; }
        .t-bold   { font-weight: 700; }
        .t-sm     { font-size: 7pt; }
        .t-xs     { font-size: 5.5pt; }

        .t-hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 1.5mm 0;
        }

        .t-lbl {
          font-size: 7pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #000;
          margin: 1.5mm 0 0.3mm;
        }

        .t-val    { margin: 0; font-size: 8pt; color: #000; }
        .t-val-lg { margin: 0; font-size: 10pt; font-weight: 700; color: #000; }

        .t-row { display: flex; justify-content: space-between; gap: 3mm; }
        .t-col { flex: 1; }

        .t-qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 1mm 0;
          gap: 0.5mm;
        }

        .t-footer {
          font-size: 6.5pt;
          color: #000;
          text-align: center;
          margin-top: 0.5mm;
        }

        /* ── Separador de corte ── */
        .cut-line {
          width: 72mm;
          display: flex;
          align-items: center;
          gap: 2mm;
          margin: 5mm 0;
          color: #888;
          font-size: 7px;
          letter-spacing: 0.12em;
          font-family: 'Courier New', Courier, monospace;
        }
        .cut-line::before,
        .cut-line::after {
          content: '';
          flex: 1;
          border-top: 1px dashed #888;
        }

        /* ── Etiqueta de teléfono (5 cm) ── */
        .phone-tag {
          width: 72mm;
          background: #fff;
          color: #000;
          font-family: 'Courier New', Courier, monospace;
          font-weight: 700;
          font-size: 8pt;
          line-height: 1.3;
          padding: 2.5mm;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        }

        .t-folio-xl {
          font-size: 20pt;
          font-weight: 900;
          text-align: center;
          margin: 0;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #000;
          padding-bottom: 1.5mm;
          margin-bottom: 1.5mm;
        }

        /* ── IMPRESIÓN ── */
        @media print {
          @page { margin: 0; size: 72mm 150mm; }

          body {
            background: white !important;
            padding: 0 !important;
            display: block !important;
            min-height: unset !important;
          }

          .ticket, .phone-tag {
            box-shadow: none !important;
            width: 72mm !important;
            padding: 2mm !important;
          }

          /* Forzar negro puro en todo — impresoras térmicas no imprimen grises */
          .ticket *, .phone-tag * {
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Línea de corte en impresión */
          .cut-line {
            color: #000 !important;
            margin: 2mm 0 !important;
          }
          .cut-line::before,
          .cut-line::after {
            border-color: #000 !important;
          }

          .no-print { display: none !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════
          TICKET ÚNICO — CLIENTE
      ══════════════════════════════════════════ */}
      <div className="ticket">

        {/* Cabecera taller */}
        <p className="t-center t-bold" style={{ fontSize: '10pt', letterSpacing: '0.04em', margin: '0 0 0.5mm' }}>
          {workshopName.toUpperCase()}
        </p>
        {workshopTagline && (
          <p className="t-center t-sm" style={{ color: '#000', margin: '0 0 1mm' }}>
            {workshopTagline}
          </p>
        )}

        <hr className="t-hr" />

        {/* Folio + Fecha en la misma fila */}
        <div className="t-row" style={{ marginTop: '0.5mm' }}>
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

        <hr className="t-hr" />

        {/* Cliente */}
        <p className="t-lbl" style={{ marginTop: 0 }}>Cliente</p>
        <p className="t-val t-bold" style={{ margin: 0 }}>{customer?.full_name ?? '—'}</p>

        {/* Equipo */}
        <p className="t-lbl">Equipo</p>
        <p className="t-val" style={{ margin: 0 }}>{order.brand} {order.model}</p>

        {/* Falla */}
        <p className="t-lbl">Falla reportada</p>
        <p className="t-val" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{order.reported_failure}</p>

        {/* Refacciones usadas — solo si hay piezas */}
        {ticketParts.length > 0 && (
          <>
            <hr className="t-hr" />
            <p className="t-lbl" style={{ marginTop: 0 }}>Refacciones utilizadas</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #000' }}>
                  <td style={{ paddingBottom: '0.5mm', fontWeight: 700 }}>Pieza</td>
                  <td style={{ textAlign: 'center', paddingBottom: '0.5mm', fontWeight: 700 }}>Cant</td>
                  <td style={{ textAlign: 'right', paddingBottom: '0.5mm', fontWeight: 700 }}>Precio</td>
                </tr>
              </thead>
              <tbody>
                {ticketParts.map((tp) => {
                  const pName = Array.isArray(tp.parts_inventory)
                    ? (tp.parts_inventory[0]?.name ?? '—')
                    : (tp.parts_inventory?.name ?? '—')
                  const lineTotal = (tp.unit_price_at_sale ?? 0) * tp.quantity
                  return (
                    <tr key={tp.id}>
                      <td style={{ paddingTop: '0.5mm', maxWidth: '38mm', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pName}</td>
                      <td style={{ textAlign: 'center', paddingTop: '0.5mm' }}>{tp.quantity}</td>
                      <td style={{ textAlign: 'right', paddingTop: '0.5mm' }}>{formatMoney(lineTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}

        {/* Financiero — solo si existen */}
        {(costo || anticipo) && <hr className="t-hr" />}
        {costo && <>
          <p className="t-lbl" style={{ marginTop: 0 }}>Costo estimado</p>
          <p className="t-val" style={{ margin: 0 }}>{costo}</p>
        </>}
        {anticipo && <>
          <p className="t-lbl">Anticipo</p>
          <p className="t-val t-bold" style={{ margin: 0 }}>{anticipo}</p>
        </>}

        {/* QR compacto */}
        <hr className="t-hr" />
        <div className="t-qr">
          <p className="t-lbl" style={{ marginTop: 0, textAlign: 'center' }}>
            Escanea para rastrear tu equipo
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR seguimiento" width={80} height={80}
            style={{ imageRendering: 'pixelated' }} />
        </div>

        <hr className="t-hr" />
        <p className="t-footer" style={{ fontStyle: 'italic' }}>
          Conserva este ticket · {workshopName}
        </p>
        {workshopPhone && (
          <p className="t-footer">Tel: {workshopPhone}</p>
        )}
      </div>

      {/* ── Separador de corte ── */}
      <div className="cut-line">✂ CORTAR</div>

      {/* ══════════════════════════════════════════
          ETIQUETA DEL TELÉFONO (5 cm)
      ══════════════════════════════════════════ */}
      <div className="phone-tag">

        {/* Folio grande */}
        <p className="t-folio-xl">{folio}</p>

        {/* Equipo */}
        <p className="t-lbl" style={{ marginTop: 0 }}>Equipo</p>
        <p className="t-val" style={{ margin: 0 }}>{order.brand} {order.model}</p>

        {/* Cliente */}
        <p className="t-lbl">Cliente</p>
        <p className="t-val" style={{ margin: 0 }}>{customer?.full_name ?? '—'}</p>

        <hr className="t-hr" style={{ marginTop: '2mm' }} />
        <p className="t-footer" style={{ margin: 0 }}>{fecha} · {workshopName}</p>

      </div>
    </>
  )
}
