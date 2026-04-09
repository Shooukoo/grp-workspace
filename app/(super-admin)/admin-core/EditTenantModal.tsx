'use client'

import { useActionState, useEffect, useState } from 'react'
import { updateTenantAction, type TenantActionState } from '@/app/actions/superadmin'
import {
  X, Building2, Phone, MapPin, Zap, Sparkles, Crown,
  Loader2, CheckCircle2, Calendar, ShieldCheck,
} from 'lucide-react'

export interface WorkshopForEdit {
  id: string
  name: string
  phone: string | null
  address: string | null
  subscription_plan: string | null
  subscription_status: string | null
  subscription_end_date: string | null
}

interface Props {
  workshop: WorkshopForEdit
  onClose: () => void
}

const INITIAL: TenantActionState = { error: null, success: false }

const PLANS = [
  { value: 'basic',      label: 'Básico',     desc: '1 sucursal',              icon: Zap,      ring: 'ring-slate-500/50',  active: 'bg-slate-500/15 border-slate-400/40',  inactive: 'border-white/8 hover:border-white/15',      iconColor: 'text-slate-400'  },
  { value: 'pro',        label: 'Pro',        desc: 'Multi-sucursal + WhatsApp', icon: Sparkles, ring: 'ring-violet-500/50', active: 'bg-violet-500/15 border-violet-400/40', inactive: 'border-white/8 hover:border-violet-500/30', iconColor: 'text-violet-400' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Sucursales ilimitadas',    icon: Crown,    ring: 'ring-indigo-500/50', active: 'bg-indigo-500/15 border-indigo-400/40', inactive: 'border-white/8 hover:border-indigo-500/30', iconColor: 'text-indigo-400' },
] as const

type PlanValue = typeof PLANS[number]['value']

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Activo',   color: 'text-emerald-400' },
  { value: 'trialing',  label: 'En prueba', color: 'text-amber-400'   },
  { value: 'canceled',  label: 'Cancelado', color: 'text-red-400'     },
]

/** Convert a full ISO string (or null) to the YYYY-MM-DD format needed by <input type="date"> */
function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

export default function EditTenantModal({ workshop, onClose }: Props) {
  const [state, formAction, pending] = useActionState(updateTenantAction, INITIAL)
  const [selectedPlan, setSelectedPlan] = useState<PlanValue>(
    (workshop.subscription_plan as PlanValue) ?? 'basic'
  )

  // Auto-close after success flash
  useEffect(() => {
    if (state.success) {
      const t = setTimeout(onClose, 1200)
      return () => clearTimeout(t)
    }
  }, [state.success, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/8">
          <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <Building2 size={15} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Editar Taller</p>
            <p className="text-[11px] text-white/30 truncate max-w-[200px]">{workshop.name}</p>
          </div>
          <button onClick={onClose} className="ml-auto h-7 w-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Success flash */}
        {state.success && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <CheckCircle2 size={40} className="text-emerald-400" />
            <p className="text-sm font-semibold text-white">¡Taller actualizado!</p>
            <p className="text-xs text-white/40">Cerrando…</p>
          </div>
        )}

        {/* Form */}
        {!state.success && (
          <form action={formAction} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">

            {/* workshop_id hidden */}
            <input type="hidden" name="workshop_id" value={workshop.id} />

            {/* Error banner */}
            {state.error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-xs text-red-400">
                {state.error}
              </div>
            )}

            {/* ── Workshop name ─────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Nombre del Taller</label>
              <div className="relative">
                <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  name="workshop_name"
                  type="text"
                  required
                  defaultValue={workshop.name}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>
            </div>

            {/* ── Phone ────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Teléfono <span className="text-white/20 normal-case">(opcional)</span></label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  name="workshop_phone"
                  type="tel"
                  defaultValue={workshop.phone ?? ''}
                  placeholder="3310001234"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>
            </div>

            {/* ── Address ──────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Dirección <span className="text-white/20 normal-case">(opcional)</span></label>
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-3 text-white/25 pointer-events-none" />
                <textarea
                  name="workshop_addr"
                  rows={2}
                  defaultValue={workshop.address ?? ''}
                  placeholder="Calle Ejemplo 123, Col. Centro"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors resize-none"
                />
              </div>
            </div>

            {/* ── Plan selector ────────────────────────────────────── */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Plan de Suscripción</label>
              <input type="hidden" name="subscription_plan" value={selectedPlan} />
              <div className="grid grid-cols-3 gap-2">
                {PLANS.map((p) => {
                  const Icon = p.icon
                  const isActive = selectedPlan === p.value
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setSelectedPlan(p.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-150 ${isActive ? p.active + ' ring-1 ' + p.ring : p.inactive + ' bg-white/[0.03]'}`}
                    >
                      <Icon size={16} className={isActive ? p.iconColor : 'text-white/25'} strokeWidth={2} />
                      <span className={`text-[11px] font-bold leading-none ${isActive ? 'text-white' : 'text-white/40'}`}>{p.label}</span>
                      <span className={`text-[9px] leading-tight ${isActive ? 'text-white/50' : 'text-white/20'}`}>{p.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Status + End date (side by side) ─────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40 flex items-center gap-1">
                  <ShieldCheck size={10} /> Estado
                </label>
                <div className="relative">
                  <select
                    name="subscription_status"
                    defaultValue={workshop.subscription_status ?? 'active'}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 pr-7 py-2.5 text-sm text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value} className="bg-[#111]">{s.label}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* End date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40 flex items-center gap-1">
                  <Calendar size={10} /> Vence el
                </label>
                <input
                  name="subscription_end_date"
                  type="date"
                  defaultValue={toDateInputValue(workshop.subscription_end_date)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {pending
                ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
                : 'Guardar Cambios'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
