'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createTenantAction, type TenantActionState } from '@/app/actions/superadmin'
import { X, Building2, User, Mail, Lock, Loader2, CheckCircle2, Phone, MapPin, Zap, Sparkles, Crown, Clock } from 'lucide-react'

interface Props {
  onClose: () => void
}

const INITIAL: TenantActionState = { error: null, success: false }

const PLANS = [
  {
    value: 'basic',
    label: 'Básico',
    desc: '1 sucursal',
    icon: Zap,
    ring: 'ring-slate-500/50',
    active: 'bg-slate-500/15 border-slate-400/40',
    inactive: 'border-white/8 hover:border-white/15',
    iconColor: 'text-slate-400',
  },
  {
    value: 'pro',
    label: 'Pro',
    desc: 'Multi-sucursal + WhatsApp',
    icon: Sparkles,
    ring: 'ring-violet-500/50',
    active: 'bg-violet-500/15 border-violet-400/40',
    inactive: 'border-white/8 hover:border-violet-500/30',
    iconColor: 'text-violet-400',
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    desc: 'Sucursales ilimitadas',
    icon: Crown,
    ring: 'ring-indigo-500/50',
    active: 'bg-indigo-500/15 border-indigo-400/40',
    inactive: 'border-white/8 hover:border-indigo-500/30',
    iconColor: 'text-indigo-400',
  },
] as const

type PlanValue = typeof PLANS[number]['value']

export default function CreateTenantModal({ onClose }: Props) {
  const [state, formAction, pending] = useActionState(createTenantAction, INITIAL)
  const formRef = useRef<HTMLFormElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanValue>('basic')

  // Close modal on success after a brief flash of the success state
  useEffect(() => {
    if (state.success) {
      const t = setTimeout(onClose, 1200)
      return () => clearTimeout(t)
    }
  }, [state.success, onClose])

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/8">
          <div className="h-8 w-8 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
            <Building2 size={15} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Nuevo Taller</p>
            <p className="text-[11px] text-white/30">Crea el taller y su cuenta de administrador</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto h-7 w-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Success flash */}
        {state.success && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <CheckCircle2 size={40} className="text-emerald-400" />
            <p className="text-sm font-semibold text-white">¡Taller creado exitosamente!</p>
            <p className="text-xs text-white/40">Cerrando…</p>
          </div>
        )}

        {/* Form */}
        {!state.success && (
          <form ref={formRef} action={formAction} className="px-6 py-5 space-y-4">

            {/* Error banner */}
            {state.error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-xs text-red-400">
                {state.error}
              </div>
            )}

            {/* Workshop name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Nombre del Taller
              </label>
              <div className="relative">
                <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  id="workshop_name"
                  name="workshop_name"
                  type="text"
                  required
                  placeholder="Tech Repair Monterrey"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Teléfono <span className="text-white/20 normal-case">(opcional)</span>
              </label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  id="workshop_phone"
                  name="workshop_phone"
                  type="tel"
                  placeholder="3310001234"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Dirección <span className="text-white/20 normal-case">(opcional)</span>
              </label>
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-3 text-white/25 pointer-events-none" />
                <textarea
                  id="workshop_addr"
                  name="workshop_addr"
                  rows={2}
                  placeholder="Calle Ejemplo 123, Col. Centro"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors resize-none"
                />
              </div>
            </div>

            {/* ── Plan selector ──────────────────────────────────────────── */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Plan de Suscripción
              </label>
              {/* Hidden input carries the value through FormData */}
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
                      className={`
                        flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center
                        transition-all duration-150
                        ${isActive ? p.active + ' ring-1 ' + p.ring : p.inactive + ' bg-white/[0.03]'}
                      `}
                    >
                      <Icon size={16} className={isActive ? p.iconColor : 'text-white/25'} strokeWidth={2} />
                      <span className={`text-[11px] font-bold leading-none ${isActive ? 'text-white' : 'text-white/40'}`}>
                        {p.label}
                      </span>
                      <span className={`text-[9px] leading-tight ${isActive ? 'text-white/50' : 'text-white/20'}`}>
                        {p.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Duration selector ────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label htmlFor="initial_duration" className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Duración Inicial
              </label>
              <div className="relative">
                <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <select
                  id="initial_duration"
                  name="initial_duration"
                  defaultValue="trial_7"
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors cursor-pointer"
                >
                  <option value="trial_7"  className="bg-[#111]">Prueba — 7 días</option>
                  <option value="trial_14" className="bg-[#111]">Prueba — 14 días</option>
                  <option value="month_1"  className="bg-[#111]">1 Mes (30 días)</option>
                  <option value="year_1"   className="bg-[#111]">1 Año (365 días)</option>
                </select>
                {/* Custom chevron */}
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* ── Divider: datos del dueño ───────────────────────────────── */}
            <div className="flex items-center gap-2 pt-1">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Dueño</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Nombre del Dueño
              </label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  id="owner_name"
                  name="owner_name"
                  type="text"
                  required
                  placeholder="Carlos Hernández"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Owner email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Correo del Dueño
              </label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  id="owner_email"
                  name="owner_email"
                  type="email"
                  required
                  placeholder="carlos@taller.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Temp password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Contraseña Temporal
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  id="owner_password"
                  name="owner_password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Mín. 8 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-16 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 hover:text-white/60 transition-colors font-mono"
                >
                  {showPassword ? 'OCULTAR' : 'VER'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {pending
                ? <><Loader2 size={14} className="animate-spin" /> Creando taller…</>
                : 'Crear Taller'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
