'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createTenantAction, type TenantActionState } from '@/app/actions/superadmin'
import { X, Building2, User, Mail, Lock, Loader2, CheckCircle2, Phone, MapPin } from 'lucide-react'

interface Props {
  onClose: () => void
}

const INITIAL: TenantActionState = { error: null, success: false }

export default function CreateTenantModal({ onClose }: Props) {
  const [state, formAction, pending] = useActionState(createTenantAction, INITIAL)
  const formRef = useRef<HTMLFormElement>(null)
  const [showPassword, setShowPassword] = useState(false)

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

            {/* Owner name */}
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
