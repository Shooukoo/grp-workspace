import type { Metadata } from 'next'
import { Wrench, CheckCircle2, Clock, Search, Hammer, PackageCheck, XCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

/* ─── Types ───────────────────────────────────────────────────────────────── */
type OrderStatus = 'received' | 'diagnosing' | 'repairing' | 'ready' | 'delivered' | 'cancelled'

interface TrackingOrder {
  id: string
  status: OrderStatus
  device_type: string
  brand: string
  model: string
  reported_failure: string
  estimated_cost: number | null
  advance_payment: number | null
  created_at: string
  updated_at: string | null
  customers: { full_name: string } | { full_name: string }[] | null
}

/* ─── Metadata ────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: 'Seguimiento de Reparación | RepairLab',
  description: 'Consulta el estado actualizado de tu equipo en reparación.',
}

/* ─── Status pipeline ─────────────────────────────────────────────────────── */
const PIPELINE: {
  key: OrderStatus
  label: string
  icon: React.ElementType
  description: string
}[] = [
  { key: 'received',   label: 'Recibido',        icon: PackageCheck, description: 'Tu equipo fue recibido en el taller.' },
  { key: 'diagnosing', label: 'Diagnóstico',      icon: Search,       description: 'Estamos analizando la falla reportada.' },
  { key: 'repairing',  label: 'En reparación',    icon: Hammer,       description: 'Tu equipo está siendo reparado.' },
  { key: 'ready',      label: 'Listo',            icon: CheckCircle2, description: '¡Tu equipo está listo para recoger!' },
  { key: 'delivered',  label: 'Entregado',        icon: CheckCircle2, description: 'Equipo entregado al cliente.' },
]

const STATUS_ORDER: Record<OrderStatus, number> = {
  received: 0, diagnosing: 1, repairing: 2, ready: 3, delivered: 4, cancelled: -1,
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName
}

function resolveCustomer(raw: TrackingOrder['customers']) {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

function formatMoney(amount: number | null) {
  if (!amount) return null
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

/** Tarjeta de datos del equipo */
function DeviceCard({ order }: { order: TrackingOrder }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5 space-y-3">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
        <Wrench size={12} />
        Tu Equipo
      </div>

      <div className="flex items-baseline gap-2">
        <h2 className="text-xl font-bold text-white">
          {order.brand} {order.model}
        </h2>
        <span className="text-xs text-slate-500">{order.device_type}</span>
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">
          Falla reportada
        </p>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {order.reported_failure}
        </p>
      </div>

      <p className="text-xs text-slate-600">
        Ingresó el {formatDate(order.created_at)}
      </p>
    </div>
  )
}

/** Timeline vertical de estado */
function StatusTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIdx = STATUS_ORDER[currentStatus]

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">
        Estado de la reparación
      </p>

      <ol className="relative space-y-0">
        {PIPELINE.map((step, i) => {
          const isDone    = currentIdx > i
          const isCurrent = currentIdx === i
          const isFuture  = currentIdx < i
          const isLast    = i === PIPELINE.length - 1
          const Icon      = step.icon

          return (
            <li key={step.key} className="flex gap-4">
              {/* Eje vertical */}
              <div className="flex flex-col items-center">
                {/* Dot */}
                <div className={`
                  flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                  border-2 transition-all duration-500
                  ${isDone    ? 'border-indigo-500   bg-indigo-500   text-white'         : ''}
                  ${isCurrent ? 'border-violet-400   bg-violet-500/20 text-violet-300 shadow-lg shadow-violet-500/30 ring-4 ring-violet-500/10' : ''}
                  ${isFuture  ? 'border-white/10     bg-white/[0.03] text-slate-600'      : ''}
                `}>
                  {isDone
                    ? <CheckCircle2 size={14} />
                    : <Icon size={14} />
                  }
                </div>
                {/* Línea conectora */}
                {!isLast && (
                  <div className={`
                    w-0.5 flex-1 min-h-[28px] transition-all duration-500
                    ${isDone ? 'bg-indigo-500/50' : 'bg-white/5'}
                  `} />
                )}
              </div>

              {/* Contenido */}
              <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                <p className={`
                  text-sm font-semibold leading-none mb-1
                  ${isDone    ? 'text-slate-400'  : ''}
                  ${isCurrent ? 'text-violet-300' : ''}
                  ${isFuture  ? 'text-slate-600'  : ''}
                `}>
                  {step.label}
                  {isCurrent && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-400 border border-violet-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                      AHORA
                    </span>
                  )}
                </p>
                {isCurrent && (
                  <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Alerta de cancelación */
function CancelledBanner() {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex gap-3 items-start">
      <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-red-300">Orden cancelada</p>
        <p className="text-xs text-red-400/70 mt-0.5">
          Esta orden fue cancelada. Contacta al taller para más información.
        </p>
      </div>
    </div>
  )
}

/** Resumen financiero */
function FinancialSummary({
  estimated_cost,
  advance_payment,
}: {
  estimated_cost: number | null
  advance_payment: number | null
}) {
  const costo    = formatMoney(estimated_cost)
  const anticipo = formatMoney(advance_payment)

  if (!costo && !anticipo) return null

  const pendiente =
    estimated_cost && advance_payment
      ? formatMoney(Math.max(0, estimated_cost - advance_payment))
      : null

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5 space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
        Resumen financiero
      </p>

      <div className="space-y-2">
        {costo && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Costo estimado</span>
            <span className="text-slate-200 font-medium">{costo}</span>
          </div>
        )}
        {anticipo && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Anticipo pagado</span>
            <span className="text-emerald-400 font-medium">{anticipo}</span>
          </div>
        )}
        {pendiente && (
          <>
            <div className="border-t border-white/5 my-1" />
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-slate-400">Por pagar al recoger</span>
              <span className="text-white">{pendiente}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Not Found state ─────────────────────────────────────────────────────── */
function OrderNotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 border border-white/5">
          <Clock size={28} className="text-slate-600" />
        </div>
        <h1 className="text-xl font-bold text-white">Enlace no encontrado</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Este enlace de seguimiento no existe o ha expirado.
          Verifica que la URL sea correcta o contacta al taller.
        </p>
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function SeguimientoPage(
  props: { params: Promise<{ token: string }> }
) {
  const { token } = await props.params
  const supabase  = await createClient()

  // Busca por public_token — columna pública y no sensible
  const { data, error } = await supabase
    .from('repair_orders')
    .select(`
      id, status, device_type, brand, model,
      reported_failure, estimated_cost, advance_payment,
      created_at, updated_at,
      customers ( full_name )
    `)
    .eq('public_token', token)
    .maybeSingle()

  if (error || !data) return <OrderNotFound />

  const order    = data as unknown as TrackingOrder
  const customer = resolveCustomer(order.customers)
  // Solo mostramos el primer nombre — privacidad
  const firstName = customer ? getFirstName(customer.full_name) : null
  const folio     = `#${order.id.slice(-6).toUpperCase()}`

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── Ambient glow ─────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md px-4 py-10 space-y-5">

        {/* ── Cabecera ──────────────────────────────────────────────── */}
        <header className="text-center space-y-2 pb-2">
          {/* Logo / marca */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Wrench size={22} className="text-white" strokeWidth={2} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            RepairLab Enterprise
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Orden{' '}
            <span className="font-mono text-violet-400">{folio}</span>
          </h1>
          {firstName && (
            <p className="text-sm text-slate-500">
              Hola, <span className="text-slate-300 font-medium">{firstName}</span>
            </p>
          )}
        </header>

        {/* ── Cancelada ─────────────────────────────────────────────── */}
        {order.status === 'cancelled' && <CancelledBanner />}

        {/* ── Timeline ──────────────────────────────────────────────── */}
        {order.status !== 'cancelled' && (
          <StatusTimeline currentStatus={order.status} />
        )}

        {/* ── Equipo ────────────────────────────────────────────────── */}
        <DeviceCard order={order} />

        {/* ── Finanzas ──────────────────────────────────────────────── */}
        <FinancialSummary
          estimated_cost={order.estimated_cost}
          advance_payment={order.advance_payment}
        />

        {/* ── Footer ────────────────────────────────────────────────── */}
        <footer className="text-center pt-4 space-y-1">
          <p className="text-xs text-slate-700">
            Página de seguimiento público — información protegida
          </p>
          <p className="text-xs text-slate-700">
            RepairLab Enterprise · {new Date().getFullYear()}
          </p>
        </footer>

      </div>
    </div>
  )
}
