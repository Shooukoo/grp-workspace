'use client'

import { useEffect, useRef, useState, useActionState } from 'react'
import { X, Plus, Package, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { createPartAction, type InventoryActionState } from '@/app/actions/inventory'
import PartFormFields from './PartFormFields'

const INITIAL: InventoryActionState = { error: null, success: false, message: null }

export default function CreatePartModal() {
  const [open, setOpen]                      = useState(false)
  const formRef                              = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending]       = useActionState(createPartAction, INITIAL)

  // Auto-close 1.2 s after success
  useEffect(() => {
    if (!state.success) return
    formRef.current?.reset()
    const t = setTimeout(() => setOpen(false), 1200)
    return () => clearTimeout(t)
  }, [state.success])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open])

  return (
    <>
      {/* Trigger */}
      <button
        id="create-part-btn"
        type="button"
        onClick={() => setOpen(true)}
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
        Nueva Refacción
      </button>

      {/* Backdrop + Panel */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          style={{ background: 'rgba(5,8,18,0.82)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
        >
          <div className="relative w-full md:max-w-2xl max-h-screen md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl border border-white/8 bg-slate-900 shadow-2xl shadow-black/60">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/20">
                  <Package size={17} className="text-indigo-400" />
                </div>
                <div>
                  <h2 id="create-modal-title" className="text-base font-bold text-white">Agregar Refacción</h2>
                  <p className="text-xs text-slate-500">Completa los datos del inventario</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form ref={formRef} action={formAction} className="p-6 space-y-5">
              <PartFormFields />

              {/* Feedback */}
              {state.error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  {state.error}
                </div>
              )}
              {state.success && state.message && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  <CheckCircle2 size={15} className="shrink-0" />
                  {state.message}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/8 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="submit-create-part-btn"
                  disabled={isPending}
                  className="
                    inline-flex items-center gap-2 rounded-xl
                    bg-gradient-to-r from-indigo-600 to-purple-600
                    px-6 py-2.5 text-sm font-semibold text-white
                    shadow-md shadow-indigo-500/25
                    hover:from-indigo-500 hover:to-purple-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-150 active:scale-95
                  "
                >
                  {isPending
                    ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
                    : <><Plus size={14} strokeWidth={2.5} /> Guardar Refacción</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
