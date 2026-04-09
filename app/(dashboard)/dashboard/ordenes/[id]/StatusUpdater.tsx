'use client'

import { useActionState } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { updateOrderStatusAction, type UpdateStatusState } from '@/app/actions/orders'

/* ─── Types ───────────────────────────────────────────────────────────────── */
type OrderStatus = 'received' | 'diagnosing' | 'repairing' | 'ready' | 'delivered' | 'cancelled'

interface StatusUpdaterProps {
  orderId: string
  currentStatus: OrderStatus
}

/* ─── Status options ──────────────────────────────────────────────────────── */
const STATUS_OPTIONS: { value: OrderStatus; label: string; dot: string }[] = [
  { value: 'received',   label: 'Recibido',        dot: 'bg-slate-400'   },
  { value: 'diagnosing', label: 'En diagnóstico',  dot: 'bg-amber-400'   },
  { value: 'repairing',  label: 'En reparación',   dot: 'bg-blue-400'    },
  { value: 'ready',      label: 'Listo para entregar', dot: 'bg-emerald-400' },
  { value: 'delivered',  label: 'Entregado',        dot: 'bg-purple-400'  },
  { value: 'cancelled',  label: 'Cancelado',        dot: 'bg-red-400'     },
]

const initialState: UpdateStatusState = { error: null, success: false, message: null }

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function StatusUpdater({ orderId, currentStatus }: StatusUpdaterProps) {
  // Bind orderId as first argument so the action signature matches useActionState
  const boundAction = updateOrderStatusAction.bind(null, orderId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f111a]/90 backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Gradient accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">Gestión de Estado</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Cambia el estado actual de la orden.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {/* Status select */}
          <div className="space-y-1.5">
            <label htmlFor="status-select" className="block text-xs font-medium text-white/50 uppercase tracking-wide">
              Nuevo estado
            </label>
            <select
              id="status-select"
              name="status"
              defaultValue={currentStatus}
              disabled={pending}
              className="
                w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3
                text-sm text-white appearance-none cursor-pointer
                transition-all duration-200
                focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                disabled:opacity-50
              "
            >
              {STATUS_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-[#1a1d2e] text-white"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit button */}
          <button
            id="update-status-btn"
            type="submit"
            disabled={pending}
            className="
              w-full rounded-xl
              bg-gradient-to-r from-indigo-600 to-purple-600
              px-4 py-3 text-sm font-semibold text-white
              shadow-lg shadow-indigo-500/25
              transition-all duration-200
              hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.02]
              active:scale-95
              disabled:cursor-not-allowed disabled:opacity-60
              flex items-center justify-center gap-2
            "
          >
            {pending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Actualizando…
              </>
            ) : (
              'Actualizar Estado'
            )}
          </button>
        </form>

        {/* Feedback messages */}
        {state.success && state.message && (
          <div role="status" aria-live="polite" className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={15} className="shrink-0" />
            {state.message}
          </div>
        )}

        {state.error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <XCircle size={15} className="mt-0.5 shrink-0" />
            {state.error}
          </div>
        )}

        {/* Status timeline dots */}
        <div className="pt-2 border-t border-white/5">
          <p className="text-xs text-white/30 uppercase tracking-wide mb-3">Flujo de estados</p>
          <div className="flex flex-col gap-2">
            {STATUS_OPTIONS.filter(o => o.value !== 'cancelled').map((opt) => {
              const isActive = opt.value === currentStatus
              return (
                <div key={opt.value} className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${isActive ? opt.dot : 'bg-white/10'}`} />
                  <span className={`text-xs ${isActive ? 'text-white font-medium' : 'text-white/30'}`}>
                    {opt.label}
                    {isActive && <span className="ml-1.5 text-white/40 font-normal">(actual)</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
