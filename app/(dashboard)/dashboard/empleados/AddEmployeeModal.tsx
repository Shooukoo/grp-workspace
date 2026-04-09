'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createEmployeeAction, type EmployeeActionState } from '@/app/actions/employees'

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface AddEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
}

const ROLES = [
  { value: 'technician',  label: 'Técnico'       },
  { value: 'receptionist', label: 'Recepcionista' },
]

const initialState: EmployeeActionState = { error: null, success: false }

/* ─── Shared input class ──────────────────────────────────────────────────── */
const inputCls = `
  w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3
  text-sm text-white placeholder-white/25
  transition-all duration-200
  focus:border-indigo-500/70 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
  disabled:opacity-50
`

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
  const [state, formAction, pending] = useActionState(createEmployeeAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  // Close on success
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      onClose()
    }
  }, [state.success, onClose])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="employee-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0f111a]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden animate-modal-in">
        {/* Accent bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 id="employee-modal-title" className="text-xl font-semibold text-white tracking-tight">
                Nuevo Empleado
              </h2>
              <p className="mt-0.5 text-sm text-white/40">
                Se creará una cuenta inmediatamente activa.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white shrink-0"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form ref={formRef} action={formAction} className="space-y-4" noValidate>

            {/* Nombre */}
            <div className="space-y-1.5">
              <label htmlFor="emp-full-name" className="block text-sm font-medium text-white/70">
                Nombre completo <span className="text-pink-400">*</span>
              </label>
              <input
                id="emp-full-name"
                name="full_name"
                type="text"
                required
                autoFocus
                placeholder="Ej. Carlos Ramírez"
                className={inputCls}
                disabled={pending}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="emp-email" className="block text-sm font-medium text-white/70">
                Correo electrónico <span className="text-pink-400">*</span>
              </label>
              <input
                id="emp-email"
                name="email"
                type="email"
                required
                placeholder="empleado@taller.com"
                className={inputCls}
                disabled={pending}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="emp-password" className="block text-sm font-medium text-white/70">
                Contraseña temporal <span className="text-pink-400">*</span>
              </label>
              <input
                id="emp-password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className={inputCls}
                disabled={pending}
              />
              <p className="text-xs text-white/25">
                El empleado podrá cambiarla después de iniciar sesión.
              </p>
            </div>

            {/* Rol */}
            <div className="space-y-1.5">
              <label htmlFor="emp-role" className="block text-sm font-medium text-white/70">
                Rol <span className="text-pink-400">*</span>
              </label>
              <select
                id="emp-role"
                name="role"
                required
                defaultValue=""
                className={`${inputCls} appearance-none cursor-pointer`}
                disabled={pending}
              >
                <option value="" disabled className="bg-[#1a1d2e] text-white/40">
                  — Selecciona un rol —
                </option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#1a1d2e] text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error banner */}
            {state.error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 7a1 1 0 012 0v4a1 1 0 01-2 0V7zm1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{state.error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                id="save-employee-btn"
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {pending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creando cuenta…
                  </>
                ) : (
                  'Crear empleado'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
