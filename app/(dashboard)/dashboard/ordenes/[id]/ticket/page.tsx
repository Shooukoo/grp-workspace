import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { createClient } from '@/utils/supabase/server'
import PrintButton from './PrintButton'
import './ticket.css'

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
  status: string
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
  if (amount === null || amount === 0) return null
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function TicketPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('repair_orders')
    .select('*, customers(*)')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const order = data as unknown as RepairOrder
  const customer = resolveCustomer(order.customers)
  const folio = `#${order.id.slice(-6).toUpperCase()}`
  const fecha = formatDate(order.created_at)
  const hora  = formatTime(order.created_at)

  // ── QR: apunta a la página de seguimiento pública ──────────────────────
  const baseUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://grp-workspace.vercel.app'
  const trackUrl  = order.public_token
    ? `${baseUrl}/seguimiento/${order.public_token}`
    : `${baseUrl}/seguimiento/${order.id}`

  // Genera el QR como data URI SVG (sin canvas, compatible con Server Components)
  const qrDataUrl = await QRCode.toDataURL(trackUrl, {
    width: 140,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })

  const anticipo = formatMoney(order.advance_payment)
  const costo    = formatMoney(order.estimated_cost)

  return (
    <>
      <PrintButton />

      <main className="ticket-root">

        {/* ════════════════════════════════════════════════════════════════
            PARTE 1: CLIENTE — Lleva a casa
        ════════════════════════════════════════════════════════════════ */}
        <p className="ticket-label">Parte del Cliente — Lleva a Casa</p>

        <div className="ticket-paper">

          {/* Cabecera del taller */}
          <p className="t-center t-bold" style={{ fontSize: '11pt', letterSpacing: '0.05em' }}>
            TECHREPAIR ZAMORA
          </p>
          <p className="t-center t-sm" style={{ color: '#444' }}>
            Reparacion de equipos electronicos
          </p>

          <hr className="t-divider" />

          {/* Folio + Fecha */}
          <div className="t-row" style={{ marginTop: '2mm' }}>
            <div className="t-col">
              <p className="t-label">Folio</p>
              <p className="t-value-lg">{folio}</p>
            </div>
            <div className="t-col t-center">
              <p className="t-label">Fecha</p>
              <p className="t-value t-sm">{fecha}</p>
              <p className="t-value t-sm">{hora}</p>
            </div>
          </div>

          {/* Cliente */}
          <p className="t-label">Cliente</p>
          <p className="t-value t-bold">{customer?.full_name ?? '—'}</p>

          {/* Equipo */}
          <p className="t-label">Equipo</p>
          <p className="t-value">{order.brand} {order.model}</p>

          {/* Falla */}
          <p className="t-label">Falla Reportada</p>
          <p className="t-value" style={{ whiteSpace: 'pre-wrap' }}>{order.reported_failure}</p>

          <hr className="t-divider" />

          {/* Financiero */}
          {costo && (
            <>
              <p className="t-label">Costo Estimado</p>
              <p className="t-value">{costo}</p>
            </>
          )}

          {anticipo && (
            <>
              <p className="t-label">Anticipo</p>
              <p className="t-value t-bold">{anticipo}</p>
            </>
          )}

          {/* QR de seguimiento */}
          <div className="t-qr-wrap" style={{ marginTop: '3mm' }}>
            <p className="t-label" style={{ textAlign: 'center', marginTop: 0 }}>
              Escanea para ver tu estado
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR seguimiento"
              width={140}
              height={140}
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="t-xs t-center" style={{ color: '#555', wordBreak: 'break-all' }}>
              {trackUrl}
            </p>
            <p className="t-xs t-center" style={{ color: '#666', marginTop: '1mm' }}>
              Consulta el avance de tu reparacion<br />
              en cualquier momento, sin registrarte.
            </p>
          </div>

          <hr className="t-divider" style={{ marginTop: '3mm' }} />

          {/* Footer del cliente */}
          <p className="t-footer-note" style={{ fontStyle: 'italic' }}>
            Conserva este ticket para recoger tu equipo
          </p>
          {customer?.whatsapp && (
            <p className="t-footer-note">
              Tel: {customer.whatsapp} · WhatsApp disponible
            </p>
          )}

        </div>{/* /ticket-paper parte 1 */}

        {/* ════════════════════════════════════════════════════════════════
            SEPARADOR DE CORTE
        ════════════════════════════════════════════════════════════════ */}
        <div className="cut-separator">✂ cortar aquí</div>

        {/* ════════════════════════════════════════════════════════════════
            PARTE 2: TALLER — Pegar al equipo
        ════════════════════════════════════════════════════════════════ */}
        <p className="ticket-label">Parte del Taller — Pegar al Equipo</p>

        <div className="ticket-paper cut-paper">

          {/* Header negro */}
          <div className="t-part2-header">Equipo en Reparacion</div>

          {/* Folio gigante */}
          <p className="t-xxl t-center" style={{ margin: '2mm 0', borderBottom: '2px solid #000', paddingBottom: '2mm' }}>
            {folio}
          </p>

          {/* Datos clave */}
          <p className="t-label">Cliente</p>
          <p className="t-value t-bold">{customer?.full_name ?? '—'}</p>

          <p className="t-label">Equipo</p>
          <p className="t-value">{order.brand} {order.model}</p>

          <p className="t-label">Falla</p>
          <p className="t-value">{order.reported_failure}</p>

          <hr className="t-divider" />

          {/* Técnico asignado */}
          <p className="t-label">Tecnico asignado</p>
          <div className="t-blank-line" />

          <hr className="t-divider" />

          {/* Pie operativo */}
          <p className="t-footer-note">
            {fecha} · {hora} · TechRepair Zamora
          </p>

        </div>{/* /ticket-paper parte 2 */}

        {/* Nota informativa en pantalla */}
        <p className="no-print" style={{
          marginTop: '2rem',
          fontSize: '13px',
          color: '#6b7280',
          textAlign: 'center',
          maxWidth: '72mm',
        }}>
          Ticket de 78mm de ancho — la parte superior va al cliente con QR de seguimiento, la inferior se pega al equipo en el taller.
        </p>

      </main>
    </>
  )
}
