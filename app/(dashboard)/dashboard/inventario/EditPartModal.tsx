'use client'

import { useEffect, useRef, useState, useActionState } from 'react'
import { X, Pencil, AlertTriangle, CheckCircle2, Loader2, Save } from 'lucide-react'
import { updatePartAction, type InventoryActionState } from '@/app/actions/inventory'
import PartFormFields, { type PartFormDefaultValues } from './PartFormFields'

const INITIAL: InventoryActionState = { error: null, success: false, message: null }

interface EditPartModalProps {
  part: PartFormDefaultValues & { id: string; name: string }
  /** Controlled: parent opens/closes */
  open: boolean
  onClose: () => void
}

export default function EditPartModal({ part, open, onClose }: EditPartModalProps) {
  const formRef = useRef<HTMLFormElement>(null)

  // Bind the partId so the action receives it as first arg
  const boundAction = updatePartAction.bind(null, part.id)
  const [state, formAction, isPending] = useActionState(boundAction, INITIAL)

  // Auto-close on success
  useEffect(() => {
    if (!state.success) return
    const t = setTimeout(onClose, 1000)
    return () => clearTimeout(t)
  }, [state.success, onClose])

  // Escape key
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(5,8,18,0.82)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="relative w-full md:max-w-2xl max-h-screen md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl border border-white/8 bg-slate-900 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20">
              <Pencil size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 id="edit-modal-title" className="text-base font-bold text-white">
                Editar Refacción
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-[260px]">{part.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={formAction} className="p-6 space-y-5">
          {/* Pass defaults (hideStock=true — stock is managed via StockMovementDialog) */}
          <PartFormFields defaults={{ ...part, hideStock: true }} />

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
              onClick={onClose}
              className="rounded-xl border border-white/8 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id={`submit-edit-${part.id}`}
              disabled={isPending}
              className="
                inline-flex items-center gap-2 rounded-xl
                bg-gradient-to-r from-amber-600 to-orange-600
                px-6 py-2.5 text-sm font-semibold text-white
                shadow-md shadow-amber-500/20
                hover:from-amber-500 hover:to-orange-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150 active:scale-95
              "
            >
              {isPending
                ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
                : <><Save size={14} /> Guardar Cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
