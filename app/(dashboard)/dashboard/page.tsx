import type { Metadata } from 'next'
import Link from 'next/link'
import { Wrench, Users, CheckCircle2, Plus, ArrowRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export const metadata: Metadata = {
  title: 'Panel Principal | GRP Workspace',
  description: 'Vista general del estado del taller y órdenes activas.',
}

/* ─── Types ───────────────────────────────────────────────────────────────── */
type OrderStatus = 'received' | 'diagnosing' | 'repairing' | 'ready' | 'delivered' | 'cancelled'

interface ActiveOrder {
  id: string
  status: OrderStatus
  brand: string
  model: string
  created_at: string
  customers: { full_name: string } | { full_name: string }[] | null
}

/* ─── Status badge ────────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<OrderStatus, { label: string; classes: string }> = {
  received:   { label: 'Recibido',        classes: 'bg-slate-500/10   text-slate-400   border-slate-500/20'   },
  diagnosing: { label: 'Diagnóstico',     classes: 'bg-amber-500/10   text-amber-400   border-amber-500/20'   },
  repairing:  { label: 'En reparación',   classes: 'bg-blue-500/10    text-blue-400    border-blue-500/20'    },
  ready:      { label: 'Listo',           classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  delivered:  { label: 'Entregado',       classes: 'bg-purple-500/10  text-purple-400  border-purple-500/20'  },
  cancelled:  { label: 'Cancelado',       classes: 'bg-red-500/10     text-red-400     border-red-500/20'     },
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.received
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const supabase = await createClient()

  /* ── 1. Auth + workshop_id ─────────────────────────────────────────── */
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user?.id ?? '')
    .single()

  const workshopId = profile?.workshop_id ?? ''

  /* ── 2. Concurrent queries ─────────────────────────────────────────── */
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayISO = todayStart.toISOString()

  const [
    { count: activeCount },
    { count: customerCount },
    { count: deliveredTodayCount },
    { data: latestOrders },
  ] = await Promise.all([
    // Órdenes activas (not delivered/cancelled)
    supabase
      .from('repair_orders')
      .select('*', { count: 'exact', head: true })
      .eq('workshop_id', workshopId)
      .not('status', 'in', '("delivered","cancelled")'),

    // Clientes totales
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('workshop_id', workshopId),

    // Entregadas hoy — usa updated_at si existe, fallback a created_at
    supabase
      .from('repair_orders')
      .select('*', { count: 'exact', head: true })
      .eq('workshop_id', workshopId)
      .eq('status', 'delivered')
      .gte('updated_at', todayISO),

    // Últimas 5 órdenes activas con cliente
    supabase
      .from('repair_orders')
      .select('id, status, brand, model, created_at, customers(full_name)')
      .eq('workshop_id', workshopId)
      .not('status', 'in', '("delivered","cancelled")')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const orders = (latestOrders as unknown as ActiveOrder[]) ?? []

  /* ── KPI config ────────────────────────────────────────────────────── */
  const kpis = [
    {
      label:  'Órdenes activas',
      value:  activeCount ?? 0,
      icon:   Wrench,
      color:  'from-indigo-500 to-purple-600',
      glow:   'shadow-indigo-500/20',
      textColor: 'text-indigo-400',
    },
    {
      label:  'Clientes registrados',
      value:  customerCount ?? 0,
      icon:   Users,
      color:  'from-purple-500 to-pink-600',
      glow:   'shadow-purple-500/20',
      textColor: 'text-purple-400',
    },
    {
      label:  'Entregadas hoy',
      value:  deliveredTodayCount ?? 0,
      icon:   CheckCircle2,
      color:  'from-emerald-500 to-teal-600',
      glow:   'shadow-emerald-500/20',
      textColor: 'text-emerald-400',
    },
  ]

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Panel principal
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Resumen en tiempo real de la actividad de tu taller.
        </p>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, glow, textColor }) => (
          <div
            key={label}
            className="relative rounded-2xl border border-white/5 bg-slate-900/50 p-6 overflow-hidden group hover:border-white/10 transition-all duration-200"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  {label}
                </p>
                <p className={`text-4xl font-bold ${textColor}`}>
                  {value}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${glow}`}>
                <Icon size={18} className="text-white" strokeWidth={2} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Latest Active Orders ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white">Órdenes de Atención Prioritaria</h2>
          </div>
          <Link
            href="/dashboard/ordenes"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
          >
            Ver todas
            <ArrowRight size={12} />
          </Link>
        </div>

        {orders.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-white">Sin órdenes pendientes</p>
              <p className="text-sm text-slate-500">
                No hay órdenes activas en este momento.
              </p>
            </div>
            <Link
              href="/dashboard/ordenes/nueva"
              className="
                inline-flex items-center gap-2 rounded-xl
                bg-gradient-to-r from-indigo-600 to-purple-600
                px-4 py-2 text-sm font-semibold text-white
                shadow-lg shadow-indigo-500/25
                transition-all duration-200
                hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.02]
                active:scale-95
              "
            >
              <Plus size={15} />
              Crear Nueva Orden
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {['Folio', 'Cliente', 'Equipo', 'Estado'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => {
                  const customer = order.customers
                  const customerName = !customer
                    ? '—'
                    : Array.isArray(customer)
                    ? (customer[0]?.full_name ?? '—')
                    : customer.full_name

                  return (
                    <tr key={order.id} className="group transition-colors hover:bg-white/[0.03]">
                      {/* Folio */}
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/ordenes/${order.id}`}
                          className="font-mono text-xs font-semibold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-2 py-1 hover:bg-indigo-500/20 transition-colors"
                        >
                          #{order.id.slice(-6).toUpperCase()}
                        </Link>
                      </td>

                      {/* Cliente */}
                      <td className="px-5 py-3.5 font-medium text-slate-200">
                        {customerName}
                      </td>

                      {/* Equipo */}
                      <td className="px-5 py-3.5 text-slate-400">
                        {order.brand} {order.model}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
