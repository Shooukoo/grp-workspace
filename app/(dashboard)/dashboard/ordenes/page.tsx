import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wrench, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { getUserContext } from '@/utils/supabase/queries'
import QRScanner from './QRScanner'

export const metadata: Metadata = {
  title: 'Órdenes de Reparación | GRP Workspace',
  description: 'Gestiona las órdenes de reparación de tu taller.',
}

/* ─── Types ───────────────────────────────────────────────────────────────── */
type OrderStatus = 'received' | 'diagnosing' | 'repairing' | 'ready' | 'delivered' | 'cancelled'

interface RepairOrder {
  id: string
  status: OrderStatus
  device_type: string
  brand: string
  model: string
  reported_failure: string
  created_at: string
  customers: { full_name: string }[] | { full_name: string } | null
}

/* ─── Status display config (ordered for display) ────────────────────────── */
const STATUS_CONFIG: Record<OrderStatus, {
  label: string
  badge: string
  dot: string
  accent: string
  header: string
}> = {
  received:   {
    label:  'Recibidos',
    badge:  'bg-slate-500/10   text-slate-400   border-slate-500/20',
    dot:    'bg-slate-400',
    accent: 'border-l-slate-500/50',
    header: 'text-slate-400',
  },
  diagnosing: {
    label:  'En Diagnóstico',
    badge:  'bg-amber-500/10   text-amber-400   border-amber-500/20',
    dot:    'bg-amber-400',
    accent: 'border-l-amber-500/50',
    header: 'text-amber-400',
  },
  repairing:  {
    label:  'En Reparación',
    badge:  'bg-blue-500/10    text-blue-400    border-blue-500/20',
    dot:    'bg-blue-400',
    accent: 'border-l-blue-500/50',
    header: 'text-blue-400',
  },
  ready:      {
    label:  'Listos para Entregar',
    badge:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot:    'bg-emerald-400',
    accent: 'border-l-emerald-500/50',
    header: 'text-emerald-400',
  },
  delivered:  {
    label:  'Entregados',
    badge:  'bg-purple-500/10  text-purple-400  border-purple-500/20',
    dot:    'bg-purple-400',
    accent: 'border-l-purple-500/50',
    header: 'text-purple-400',
  },
  cancelled:  {
    label:  'Cancelados',
    badge:  'bg-red-500/10     text-red-400     border-red-500/20',
    dot:    'bg-red-400',
    accent: 'border-l-red-500/50',
    header: 'text-red-400',
  },
}

// Display order (most actionable first)
const STATUS_ORDER: OrderStatus[] = [
  'ready', 'repairing', 'diagnosing', 'received', 'delivered', 'cancelled',
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function resolveCustomerName(customers: RepairOrder['customers']): string {
  if (!customers) return '—'
  return Array.isArray(customers) ? (customers[0]?.full_name ?? '—') : customers.full_name
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function OrdenesPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const supabase = await createClient()
  const { workshopId } = await getUserContext()

  // ── Redirect desde escáner QR ─────────────────────────────────────────
  const params = await props.searchParams
  const token = typeof params.token === 'string' ? decodeURIComponent(params.token.trim()) : null

  if (token) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (uuidPattern.test(token)) {
      const { data: byId } = await supabase
        .from('repair_orders')
        .select('id')
        .eq('id', token)
        .eq('workshop_id', workshopId)
        .maybeSingle()
      if (byId?.id) redirect(`/dashboard/ordenes/${byId.id}`)
    }

    const { data: byToken } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('public_token', token)
      .eq('workshop_id', workshopId)
      .maybeSingle()
    if (byToken?.id) redirect(`/dashboard/ordenes/${byToken.id}`)
  }

  // ── Fetch all orders ──────────────────────────────────────────────────
  const { data: orders, error } = await supabase
    .from('repair_orders')
    .select('id, status, device_type, brand, model, reported_failure, created_at, customers(full_name)')
    .eq('workshop_id', workshopId)
    .order('created_at', { ascending: false })

  const rows: RepairOrder[] = (orders as unknown as RepairOrder[]) ?? []

  // ── Group by status ───────────────────────────────────────────────────
  const grouped = STATUS_ORDER.reduce<Record<OrderStatus, RepairOrder[]>>(
    (acc, status) => {
      acc[status] = rows.filter(o => o.status === status)
      return acc
    },
    {} as Record<OrderStatus, RepairOrder[]>,
  )

  // Only render sections that have at least 1 order
  const activeSections = STATUS_ORDER.filter(s => grouped[s].length > 0)

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Wrench size={22} className="text-indigo-400" />
            Órdenes de Reparación
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {rows.length > 0
              ? `${rows.length} orden${rows.length !== 1 ? 'es' : ''} en ${activeSections.length} estado${activeSections.length !== 1 ? 's' : ''}`
              : 'Aún no hay órdenes registradas.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <QRScanner />
          <Link
            id="new-order-btn"
            href="/dashboard/ordenes/nueva"
            className="
              inline-flex items-center gap-2 rounded-xl
              bg-gradient-to-r from-indigo-600 to-purple-600
              px-5 py-2.5 text-sm font-semibold text-white
              shadow-lg shadow-indigo-500/30
              transition-all duration-200
              hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.02] hover:shadow-indigo-500/50
              active:scale-95 whitespace-nowrap
            "
          >
            <Plus size={16} strokeWidth={2.5} />
            Nueva Orden
          </Link>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <strong>Error al cargar órdenes:</strong> {error.message}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {rows.length === 0 && !error && (
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Wrench size={28} className="text-indigo-400" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-white">Sin órdenes todavía</p>
            <p className="text-sm text-slate-500 max-w-xs">
              Crea tu primera orden con el botón{' '}
              <strong className="text-indigo-400">Nueva Orden</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Grouped sections ────────────────────────────────────────── */}
      {activeSections.map(status => {
        const cfg   = STATUS_CONFIG[status]
        const group = grouped[status]

        return (
          <section key={status} aria-label={cfg.label}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`h-2 w-2 rounded-full ${cfg.dot} shrink-0`} />
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${cfg.header}`}>
                {cfg.label}
              </h2>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold border ${cfg.badge}`}>
                {group.length}
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Orders table */}
            <div className={`rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden border-l-2 ${cfg.accent}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Folio</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Equipo</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Falla</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {group.map((order) => (
                      <tr key={order.id} className="group transition-colors hover:bg-white/[0.03]">
                        {/* Folio */}
                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/ordenes/${order.id}`}
                            className="font-mono text-xs font-semibold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-2 py-1 hover:bg-indigo-500/20 transition-colors"
                          >
                            #{order.id.slice(-6).toUpperCase()}
                          </Link>
                        </td>

                        {/* Cliente */}
                        <td className="px-5 py-4 font-medium text-slate-100">
                          {resolveCustomerName(order.customers)}
                        </td>

                        {/* Equipo */}
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-200">{order.brand} {order.model}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{order.device_type}</div>
                        </td>

                        {/* Falla — oculta en móvil */}
                        <td className="px-5 py-4 text-slate-400 max-w-[220px] hidden md:table-cell">
                          <p className="truncate">{order.reported_failure}</p>
                        </td>

                        {/* Fecha — oculta en móvil */}
                        <td className="px-5 py-4 text-slate-500 tabular-nums text-xs whitespace-nowrap hidden md:table-cell">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
