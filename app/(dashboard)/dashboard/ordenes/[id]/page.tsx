import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Smartphone, User, Cpu, Printer } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import StatusUpdater from './StatusUpdater'

type OrderStatus = 'received' | 'diagnosing' | 'repairing' | 'ready' | 'delivered' | 'cancelled'

interface RepairOrderDetail {
  id: string
  status: OrderStatus
  device_type: string
  brand: string
  model: string
  reported_failure: string
  created_at: string
  customers: { full_name: string; whatsapp: string | null } | { full_name: string; whatsapp: string | null }[] | null
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params
  return { title: `Orden #${id.slice(-6).toUpperCase()} | GRP Workspace` }
}

/* ─── Status badge ────────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<OrderStatus, { label: string; classes: string }> = {
  received:   { label: 'Recibido',            classes: 'bg-slate-500/10   text-slate-400   border-slate-500/20'   },
  diagnosing: { label: 'En diagnóstico',      classes: 'bg-amber-500/10   text-amber-400   border-amber-500/20'   },
  repairing:  { label: 'En reparación',       classes: 'bg-blue-500/10    text-blue-400    border-blue-500/20'    },
  ready:      { label: 'Listo para entregar', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  delivered:  { label: 'Entregado',           classes: 'bg-purple-500/10  text-purple-400  border-purple-500/20'  },
  cancelled:  { label: 'Cancelado',           classes: 'bg-red-500/10     text-red-400     border-red-500/20'     },
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.received
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2.5">
        <Icon size={15} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200">{value || <span className="text-slate-600 italic">—</span>}</dd>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function resolveCustomer(raw: RepairOrderDetail['customers']) {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

export default async function OrdenDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  // ── Resolve workshop_id for multi-tenant isolation ───────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user?.id ?? '')
    .single()

  const workshopId = profile?.workshop_id ?? ''

  // Scope the order query by both id AND workshop_id to prevent cross-tenant access
  const { data, error } = await supabase
    .from('repair_orders')
    .select('*, customers(*)')
    .eq('id', id)
    .eq('workshop_id', workshopId)
    .single()

  if (error || !data) notFound()

  const order = data as unknown as RepairOrderDetail
  const customer = resolveCustomer(order.customers)
  const folio = order.id.slice(-6).toUpperCase()

  return (
    <div className="space-y-6">
      {/* ── Back + header ───────────────────────────────────────────── */}
      <div className="space-y-4">
        <Link
          href="/dashboard/ordenes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={15} />
          Volver a órdenes
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Orden{' '}
              <span className="font-mono text-indigo-400">#{folio}</span>
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-slate-500 capitalize">{formatDate(order.created_at)}</p>
        </div>
      </div>

      {/* ── Two-column grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: info */}
        <div className="lg:col-span-2 space-y-5">
          <SectionCard title="Datos del Cliente" icon={User}>
            {customer ? (
              <dl className="space-y-4">
                <DetailRow label="Nombre completo" value={customer.full_name} />
                <DetailRow
                  label="Teléfono / WhatsApp"
                  value={
                    customer.whatsapp ? (
                      <a
                        href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                      >
                        <Smartphone size={13} />
                        {customer.whatsapp}
                      </a>
                    ) : null
                  }
                />
              </dl>
            ) : (
              <p className="text-sm text-slate-500 italic">Sin cliente asociado</p>
            )}
          </SectionCard>

          <SectionCard title="Datos del Equipo" icon={Cpu}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <DetailRow label="Tipo de equipo" value={order.device_type} />
              <DetailRow label="Marca"          value={order.brand} />
              <DetailRow label="Modelo"         value={order.model} />
            </dl>
            <div className="pt-5 border-t border-white/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Falla reportada
              </p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
                {order.reported_failure}
              </p>
            </div>
          </SectionCard>
        </div>

        {/* Right: actions */}
        <div className="space-y-5">
          <StatusUpdater orderId={order.id} currentStatus={order.status} />

          {/* Folio card */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Folio de orden</p>
            <p className="font-mono text-3xl font-bold text-indigo-400 tracking-widest">#{folio}</p>
            <p className="text-[10px] text-slate-700 break-all">{order.id}</p>
            <Link
              href={`/ticket/${order.id}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30
                bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-400
                hover:bg-indigo-500/20 transition-colors w-full justify-center"
            >
              <Printer size={13} />
              Imprimir Ticket
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
