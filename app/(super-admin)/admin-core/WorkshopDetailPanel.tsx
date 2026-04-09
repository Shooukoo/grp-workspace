'use client'

import { X, Building2, Phone, MapPin, Zap, Sparkles, Crown, Calendar, ShieldCheck, Hash, Clock, AlertTriangle, CheckCircle2, Pause } from 'lucide-react'
import type { WorkshopForEdit } from './EditTenantModal'

interface Props {
  workshop: WorkshopForEdit
  onClose: () => void
  onEdit: () => void
}

/* ─── Plan config ────────────────────────────────────────────────────────── */
type Plan = 'basic' | 'pro' | 'enterprise'

const PLAN_CONFIG: Record<Plan, { label: string; desc: string; icon: React.ElementType; badge: string; glow: string; features: string[] }> = {
  basic: {
    label: 'Básico', desc: '1 sucursal',
    icon: Zap,
    badge: 'bg-slate-500/15 border-slate-400/30 text-slate-300',
    glow: 'shadow-slate-500/10',
    features: ['1 sucursal', 'Órdenes ilimitadas', 'Clientes ilimitados'],
  },
  pro: {
    label: 'Pro', desc: 'Multi-sucursal + WhatsApp',
    icon: Sparkles,
    badge: 'bg-violet-500/15 border-violet-400/30 text-violet-300',
    glow: 'shadow-violet-500/20',
    features: ['Múltiples sucursales', 'API de WhatsApp', 'Reportes avanzados'],
  },
  enterprise: {
    label: 'Enterprise', desc: 'Sucursales ilimitadas',
    icon: Crown,
    badge: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300',
    glow: 'shadow-indigo-500/20',
    features: ['Sucursales ilimitadas', 'Soporte prioritario', 'SLA personalizado'],
  },
}

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  active:   { label: 'Activo',    icon: CheckCircle2,    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  trialing: { label: 'En prueba', icon: Clock,           color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'     },
  canceled: { label: 'Cancelado', icon: Pause,           color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatDateLong(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

/**
 * Returns days remaining (positive = future, negative = past) and a
 * descriptive string + color class.
 */
function getDaysRemaining(endDate: string | null): {
  days: number | null
  label: string
  color: string
  barColor: string
  pct: number
} {
  if (!endDate) return { days: null, label: 'Sin fecha de vencimiento', color: 'text-white/30', barColor: 'bg-white/10', pct: 100 }

  const now   = new Date()
  const end   = new Date(endDate)
  const msLeft = end.getTime() - now.getTime()
  const days   = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

  if (days < 0)  return { days, label: `Venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`, color: 'text-red-400',     barColor: 'bg-red-500',     pct: 0   }
  if (days === 0) return { days, label: 'Vence hoy',                                                            color: 'text-red-400',     barColor: 'bg-red-500',     pct: 2   }
  if (days <= 7)  return { days, label: `${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`, color: 'text-amber-400',  barColor: 'bg-amber-500',   pct: Math.min(100, Math.round((days / 365) * 100)) }
  if (days <= 30) return { days, label: `${days} días restantes`,                                               color: 'text-amber-400',   barColor: 'bg-amber-500',   pct: Math.min(100, Math.round((days / 365) * 100)) }
  return              { days, label: `${days} días restantes`,                                                  color: 'text-emerald-400', barColor: 'bg-emerald-500', pct: Math.min(100, Math.round((days / 365) * 100)) }
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function WorkshopDetailPanel({ workshop, onClose, onEdit }: Props) {
  const planKey   = (workshop.subscription_plan ?? 'basic') as Plan
  const plan      = PLAN_CONFIG[planKey] ?? PLAN_CONFIG.basic
  const PlanIcon  = plan.icon
  const statusKey = workshop.subscription_status ?? 'active'
  const status    = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.active
  const StatusIcon = status.icon
  const remaining  = getDaysRemaining(workshop.subscription_end_date)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Side panel */}
      <div className="relative h-full w-full max-w-sm bg-[#080808] border-l border-white/8 shadow-2xl overflow-y-auto flex flex-col">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-white/8 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 size={18} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white leading-snug truncate">{workshop.name}</h2>
            <p className="text-[11px] text-white/30 font-mono mt-0.5 truncate">{workshop.id}</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* ── Content ───────────────────────────────────────────────── */}
        <div className="flex-1 px-6 py-5 space-y-5">

          {/* ── Plan card ─────────────────────────────────────────── */}
          <div className={`rounded-2xl border p-4 ${plan.badge} shadow-lg ${plan.glow}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
                <PlanIcon size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest opacity-60">Plan actual</p>
                <p className="text-base font-bold leading-none">{plan.label}</p>
              </div>
            </div>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs opacity-70">
                  <span className="h-1 w-1 rounded-full bg-current shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Status pill ───────────────────────────────────────── */}
          <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 ${status.bg}`}>
            <StatusIcon size={15} className={status.color} />
            <div>
              <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Estado</p>
              <p className={`text-sm font-semibold ${status.color}`}>{status.label}</p>
            </div>
          </div>

          {/* ── Time remaining ────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/30 flex items-center gap-1">
                <Clock size={10} /> Vigencia
              </p>
              <span className={`text-xs font-bold ${remaining.color}`}>
                {remaining.days !== null
                  ? (remaining.days < 0 ? `${Math.abs(remaining.days)}d vencida` : `${remaining.days}d`)
                  : '∞'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${remaining.barColor}`}
                style={{ width: `${remaining.pct}%` }}
              />
            </div>
            <p className={`text-xs ${remaining.color}`}>{remaining.label}</p>
          </div>

          {/* ── Dates ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/30 flex items-center gap-1">
              <Calendar size={10} /> Fechas
            </p>
            <div className="space-y-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-white/25 font-mono">VENCE EL</span>
                <span className="text-xs text-white/70 capitalize">
                  {formatDateLong(workshop.subscription_end_date)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Contact info ──────────────────────────────────────── */}
          {(workshop.phone || workshop.address) && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/30 flex items-center gap-1">
                <Phone size={10} /> Contacto
              </p>
              {workshop.phone && (
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Phone size={12} className="shrink-0 text-white/25" />
                  <a href={`https://wa.me/${workshop.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                    {workshop.phone}
                  </a>
                </div>
              )}
              {workshop.address && (
                <div className="flex items-start gap-2 text-xs text-white/60">
                  <MapPin size={12} className="shrink-0 text-white/25 mt-0.5" />
                  <span className="whitespace-pre-wrap">{workshop.address}</span>
                </div>
              )}
            </div>
          )}

          {/* ── UUID ──────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/30 flex items-center gap-1">
              <Hash size={10} /> ID del Taller
            </p>
            <p className="font-mono text-[11px] text-white/30 break-all select-all bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
              {workshop.id}
            </p>
          </div>

          {/* ── Warning if expired ────────────────────────────────── */}
          {remaining.days !== null && remaining.days < 0 && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed">
                Este taller tiene la suscripción <strong>vencida</strong>. El propietario no puede acceder al dashboard.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer action ──────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-white/8 shrink-0">
          <button
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 px-4 py-2.5 text-sm font-semibold text-white transition-all"
          >
            Editar este taller
          </button>
        </div>
      </div>
    </div>
  )
}
