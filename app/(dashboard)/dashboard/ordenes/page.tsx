import type { Metadata } from 'next'
import Link from 'next/link'
import { Wrench, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

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

/* ─── Status badge ─────────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<OrderStatus, { label: string; classes: string }> = {
  received:   { label: 'Recibido',        classes: 'bg-slate-500/10   text-slate-400  border-slate-500/20'   },
  diagnosing: { label: 'Diagnóstico',     classes: 'bg-amber-500/10   text-amber-400  border-amber-500/20'   },
  repairing:  { label: 'En reparación',   classes: 'bg-blue-500/10    text-blue-400   border-blue-500/20'    },
  ready:      { label: 'Listo',           classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  delivered:  { label: 'Entregado',       classes: 'bg-purple-500/10  text-purple-400  border-purple-500/20'  },
  cancelled:  { label: 'Cancelado',       classes: 'bg-red-500/10     text-red-400    border-red-500/20'     },
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.received
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function OrdenesPage() {
  const supabase = await createClient()

  // ── 1. Auth + workshop_id ──────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user?.id ?? '')
    .single()

  const workshopId = profile?.workshop_id ?? ''

  // ── 2. Orders scoped to this workshop ─────────────────────────────────
  const { data: orders, error } = await supabase
    .from('repair_orders')
    .select('id, status, device_type, brand, model, reported_failure, created_at, customers(full_name)')
    .eq('workshop_id', workshopId)
    .order('created_at', { ascending: false })

  const rows: RepairOrder[] = (orders as unknown as RepairOrder[]) ?? []

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
              ? `${rows.length} orden${rows.length !== 1 ? 'es' : ''} registrada${rows.length !== 1 ? 's' : ''}`
              : 'Aún no hay órdenes registradas.'}
          </p>
        </div>

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

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <strong>Error al cargar órdenes:</strong> {error.message}
        </div>
      )}

      {/* ── Table card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {['Folio', 'Cliente', 'Equipo', 'Falla', 'Estado', 'Fecha'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((order) => (
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
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-100">
                        {(() => {
                          const c = order.customers
                          if (!c) return <span className="text-slate-600 italic text-xs">Sin cliente</span>
                          return Array.isArray(c) ? c[0]?.full_name : c.full_name
                        })()}
                      </span>
                    </td>

                    {/* Equipo */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-200">{order.brand} {order.model}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{order.device_type}</div>
                    </td>

                    {/* Falla */}
                    <td className="px-5 py-4 text-slate-400 max-w-[200px]">
                      <p className="truncate">{order.reported_failure}</p>
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>

                    {/* Fecha */}
                    <td className="px-5 py-4 text-slate-500 tabular-nums text-xs whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
