'use client'

import { useActionState, useEffect } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import type { TenantActionState } from '@/app/actions/superadmin'

interface Props {
  title: string
  description: string
  confirmLabel: string
  confirmClass?: string      // Tailwind classes for the confirm button
  workshopId: string
  workshopName: string
  action: (state: TenantActionState, formData: FormData) => Promise<TenantActionState>
  onClose: () => void
  onSuccess?: () => void
}

const INITIAL: TenantActionState = { error: null, success: false }

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClass = 'bg-red-600 hover:bg-red-500',
  workshopId,
  workshopName,
  action,
  onClose,
  onSuccess,
}: Props) {
  const [state, formAction, pending] = useActionState(action, INITIAL)

  useEffect(() => {
    if (state.success) {
      onSuccess?.()
      const t = setTimeout(onClose, 600)
      return () => clearTimeout(t)
    }
  }, [state.success, onClose, onSuccess])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{description}</p>
          </div>
          <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors shrink-0">
            <X size={13} />
          </button>
        </div>

        {/* Workshop name chip */}
        <div className="mx-5 mb-4 rounded-xl bg-white/[0.03] border border-white/8 px-3 py-2.5">
          <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-0.5">Taller</p>
          <p className="text-sm font-semibold text-white truncate">{workshopName}</p>
        </div>

        {/* Error */}
        {state.error && (
          <div className="mx-5 mb-3 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-400">
            {state.error}
          </div>
        )}

        {/* Actions */}
        <form action={formAction} className="flex gap-2 px-5 pb-5">
          <input type="hidden" name="workshop_id" value={workshopId} />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-4 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors ${confirmClass}`}
          >
            {pending ? <><Loader2 size={13} className="animate-spin" /> Procesando…</> : confirmLabel}
          </button>
        </form>
      </div>
    </div>
  )
}
