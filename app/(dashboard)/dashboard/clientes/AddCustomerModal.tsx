'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createCustomerAction, type CustomerActionState } from '@/app/actions/customers'

const initialState: CustomerActionState = {
  error: null,
  success: false,
}

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddCustomerModal({ isOpen, onClose }: AddCustomerModalProps) {
  const [state, formAction, pending] = useActionState(createCustomerAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  // Close & reset form on successful submission
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      onClose()
    }
  }, [state.success, onClose])

  // Trap focus: close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    /* ── Backdrop ─────────────────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Modal panel ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0f111a]/90 backdrop-blur-xl shadow-2xl shadow-black/60 p-8 animate-modal-in">
        {/* Gradient accent top bar */}
        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2
              id="modal-title"
              className="text-xl font-semibold text-white tracking-tight"
            >
              Nuevo Cliente
            </h2>
            <p className="mt-0.5 text-sm text-white/40">
              Completa los datos para registrar al cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={formAction} className="space-y-5" noValidate>
          {/* Full name */}
          <div className="space-y-1.5">
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-white/70"
            >
              Nombre completo <span className="text-pink-400">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoFocus
              placeholder="Ej. María García López"
              className="
                w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3
                text-sm text-white placeholder-white/25
                transition-all duration-200
                focus:border-indigo-500/70 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                disabled:opacity-50
              "
              disabled={pending}
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <label
              htmlFor="whatsapp"
              className="block text-sm font-medium text-white/70"
            >
              Teléfono / WhatsApp{' '}
              <span className="text-white/30 text-xs font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-white/30 select-none text-sm">
                📱
              </span>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                placeholder="Ej. +52 55 1234 5678"
                className="
                  w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3
                  text-sm text-white placeholder-white/25
                  transition-all duration-200
                  focus:border-indigo-500/70 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                  disabled:opacity-50
                "
                disabled={pending}
              />
            </div>
          </div>

          {/* Error banner */}
          {state.error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 7a1 1 0 012 0v4a1 1 0 01-2 0V7zm1 7a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{state.error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3
                text-sm font-medium text-white/60
                transition-all duration-200 hover:bg-white/10 hover:text-white
                disabled:opacity-50
              "
              disabled={pending}
            >
              Cancelar
            </button>

            <button
              id="save-customer-btn"
              type="submit"
              className="
                flex-1 rounded-xl
                bg-gradient-to-r from-indigo-600 to-purple-600
                px-4 py-3 text-sm font-semibold text-white
                shadow-lg shadow-indigo-500/25
                transition-all duration-200
                hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40
                disabled:cursor-not-allowed disabled:opacity-60
                flex items-center justify-center gap-2
              "
              disabled={pending}
            >
              {pending ? (
                <>
                  {/* Spinner */}
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Guardando…
                </>
              ) : (
                'Guardar cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
