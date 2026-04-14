import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Smartphone, User, Cpu, Images, Printer, Wrench } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { getUserContext } from '@/utils/supabase/queries'
import StatusUpdater from './StatusUpdater'
import EvidenceUploader from './EvidenceUploader'
import EditOrderDetails, { type Technician } from './EditOrderDetails'
import FinancialEditor from './FinancialEditor'
import OrderPartsPanel, { type InventoryPart, type OrderPart } from './OrderPartsPanel'

type OrderStatus = 'received' | 'diagnosing' | 'repairing' | 'ready' | 'delivered' | 'cancelled'

interface RepairOrderDetail {
  id: string
  status: OrderStatus
  device_type: string
  brand: string
  model: string
  reported_failure: string
  comments: string | null
  technician_id: string | null
  created_at: string
  estimated_cost:  number | null
  advance_payment: number | null
  workshop_id: string
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

function formatMXN(amount: number | null) {
  if (amount === null || amount === undefined) return null
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

function resolveCustomer(raw: RepairOrderDetail['customers']) {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

/* ─── Financial summary card ─────────────────────────────────────────────── */
function FinanceCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | null
  accent: string
}) {
  return (
    <div className={`rounded-xl border ${accent} bg-white/[0.03] p-4 flex items-start gap-3`}>
      <div className={`mt-0.5 rounded-lg p-2 ${accent} bg-white/[0.05]`}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{label}</p>
        <p className="text-lg font-bold text-white truncate">
          {value ?? <span className="text-white/25 text-sm font-normal italic">Sin definir</span>}
        </p>
      </div>
    </div>
  )
}

/* ─── Evidence Gallery (server component) ────────────────────────────────── */
interface OrderLog {
  id: string
  created_at: string
  description: string | null
  image_urls:  string[] | null
}

function EvidenceGallery({ logs }: { logs: OrderLog[] }) {
  const allImages = logs.flatMap(l => l.image_urls ?? [])
  if (!allImages.length) return null

  return (
    <SectionCard title="Evidencia Fotográfica" icon={Images}>
      <div className={`grid gap-3 ${allImages.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {allImages.map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block rounded-xl overflow-hidden border border-white/10 bg-black/40 hover:border-violet-500/40 transition-all duration-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Evidencia ${i + 1}`}
              loading="lazy"
              className="block w-full"
              style={{
                maxHeight: '360px',
                objectFit: 'contain',
                objectPosition: 'center',
                background: 'transparent',
              }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[10px] font-medium text-white/80 bg-black/60 px-2 py-0.5 rounded-full">
                Ver original ↗
              </span>
            </div>
          </a>
        ))}
      </div>
      <p className="mt-3 text-xs text-white/25 text-right">{allImages.length} foto(s) registrada(s)</p>
    </SectionCard>
  )
}



export default async function OrdenDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  // ── Auth + workshop_id (cached — shared with layout) ────────────────────
  const { workshopId } = await getUserContext()

  // Scope la query por id + workshop_id (aislamiento multi-tenant)
  const { data, error } = await supabase
    .from('repair_orders')
    .select('*, customers(*)')
    .eq('id', id)
    .eq('workshop_id', workshopId)
    .single()

  if (error || !data) notFound()

  // ── Fetch evidence logs ──────────────────────────────────────────────────
  const { data: logsData } = await supabase
    .from('order_logs')
    .select('id, created_at, description, image_urls')
    .eq('order_id', id)
    .not('image_urls', 'is', null)
    .order('created_at', { ascending: true })

  // ── Fetch parts assigned to this order ──────────────────────────────────
  const { data: orderPartsData } = await supabase
    .from('repair_order_parts')
    .select('id, part_id, quantity, unit_price_at_sale, parts_inventory(name, brand)')
    .eq('order_id', id)
    .order('assigned_at', { ascending: true })

  // ── Fetch this workshop's inventory (for the search picker) ─────────────
  const { data: inventoryData } = await supabase
    .from('parts_inventory')
    .select('id, name, brand, sale_price, stock_quantity')
    .eq('workshop_id', workshopId)
    .order('name', { ascending: true })

  // ── Fetch technicians for this workshop (bypass RLS — profiles may not have auth.users) ─
  const { data: techData } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role')
    .eq('workshop_id', workshopId)
    .eq('role', 'technician')
    .order('full_name', { ascending: true })

  const logs: OrderLog[]            = (logsData      ?? []) as OrderLog[]
  const orderParts: OrderPart[]     = (orderPartsData ?? []) as unknown as OrderPart[]
  const inventory:  InventoryPart[] = (inventoryData  ?? []) as InventoryPart[]
  const technicians: Technician[]   = (techData       ?? []) as Technician[]

  // Pre-compute parts subtotal for FinancialEditor
  const partsSubtotal = orderParts.reduce(
    (sum, op) => sum + (op.unit_price_at_sale ?? 0) * op.quantity,
    0,
  )

  const order    = data as unknown as RepairOrderDetail
  const customer = resolveCustomer(order.customers)
  const folio    = order.id.slice(-6).toUpperCase()

  const estimatedCost  = order.estimated_cost  ?? null
  const advancePayment = order.advance_payment ?? null
  // Total = mano de obra + refacciones asignadas
  const totalCost      = estimatedCost !== null ? estimatedCost + partsSubtotal : null
  const balance        = totalCost !== null ? totalCost - (advancePayment ?? 0) : null

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

      {/* ── Financial summary cards ──────────────────────── */}
      <FinancialEditor
        orderId={order.id}
        estimatedCost={estimatedCost}
        advancePayment={advancePayment}
        partsSubtotal={partsSubtotal}
      />

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

          {/* Equipment — now editable */}
          <SectionCard title="Datos del Equipo" icon={Cpu}>
            <EditOrderDetails
              orderId={order.id}
              device_type={order.device_type}
              brand={order.brand}
              model={order.model}
              reported_failure={order.reported_failure}
              comments={order.comments}
              technician_id={order.technician_id}
              technicians={technicians}
            />
          </SectionCard>

          {/* Refacciones asignadas */}
          <SectionCard title="Refacciones Asignadas" icon={Wrench}>
            <OrderPartsPanel
              orderId={order.id}
              orderParts={orderParts}
              inventory={inventory}
            />
          </SectionCard>

          {/* Evidence gallery — persistent across refreshes */}
          <EvidenceGallery logs={logs} />
        </div>

        {/* Right: actions */}
        <div className="space-y-5">
          <StatusUpdater
            orderId={order.id}
            currentStatus={order.status}
            balance={balance}
            estimatedCost={estimatedCost}
            advancePayment={advancePayment}
          />

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

          {/* Evidence uploader */}
          <EvidenceUploader orderId={order.id} workshopId={workshopId} />
        </div>
      </div>
    </div>
  )
}
