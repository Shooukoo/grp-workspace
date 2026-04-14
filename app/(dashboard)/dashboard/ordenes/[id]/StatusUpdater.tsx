'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ReceiptText } from 'lucide-react'
import { updateOrderStatusAction, updateOrderFinancialsAction, type UpdateStatusState, type FinancialsState } from '@/app/actions/orders'

/* ─── Types ───────────────────────────────────────────────────────────────── */
type OrderStatus = 'received' | 'diagnosing' | 'repairing' | 'ready' | 'delivered' | 'cancelled'

interface StatusUpdaterProps {
  orderId:        string
  currentStatus:  OrderStatus
  balance:        number | null
  estimatedCost:  number | null
  advancePayment: number | null
}

/* ─── Status options ──────────────────────────────────────────────────────── */
const STATUS_OPTIONS: { value: OrderStatus; label: string; dot: string }[] = [
  { value: 'received',   label: 'Recibido',            dot: 'bg-slate-400'   },
  { value: 'diagnosing', label: 'En diagnóstico',      dot: 'bg-amber-400'   },
  { value: 'repairing',  label: 'En reparación',       dot: 'bg-blue-400'    },
  { value: 'ready',      label: 'Listo para entregar', dot: 'bg-emerald-400' },
  { value: 'delivered',  label: 'Entregado',           dot: 'bg-purple-400'  },
  { value: 'cancelled',  label: 'Cancelado',           dot: 'bg-red-400'     },
]

function fmt(n: number | null) {
  if (n === null) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

const initialStatus: UpdateStatusState  = { error: null, success: false, message: null }
const initialFin:    FinancialsState    = { error: null, success: false, message: null }

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function StatusUpdater({
  orderId, currentStatus, balance, estimatedCost, advancePayment,
}: StatusUpdaterProps) {
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false)
  const [selectedStatus,    setSelectedStatus]    = useState<OrderStatus>(currentStatus)
  const formRef = useRef<HTMLFormElement>(null)

  const statusAction  = updateOrderStatusAction.bind(null, orderId)
  const finAction     = updateOrderFinancialsAction.bind(null, orderId)

  const [statusState, submitStatus, pendingStatus] = useActionState(statusAction, initialStatus)
  const [finState,    submitFin,    pendingFin]    = useActionState(finAction,    initialFin)

  const hasPendingBalance = balance !== null && balance > 0

  // Cierra el prompt cuando el pago se registra exitosamente
  useEffect(() => {
    if (finState.success) setShowPaymentPrompt(false)
  }, [finState])

  // Called when "Actualizar Estado" is clicked
  function handleSubmitAttempt(e: React.FormEvent) {
    if (selectedStatus === 'delivered' && hasPendingBalance) {
      e.preventDefault()
      setShowPaymentPrompt(true)
    }
    // else let the native form submit happen
  }

  // "Entregar sin registrar pago" — just submit status form
  function deliverWithoutPayment() {
    setShowPaymentPrompt(false)
    formRef.current?.requestSubmit()
  }

  const pending = pendingStatus || pendingFin

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f111a]/90 backdrop-blur-xl shadow-xl overflow-hidden">
      <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">Gestión de Estado</h2>
          <p className="text-xs text-white/40 mt-0.5">Cambia el estado actual de la orden.</p>
        </div>

        {/* ── Status form ──────────────────────────────────────── */}
        <form ref={formRef} action={submitStatus} className="space-y-4" onSubmit={handleSubmitAttempt}>
          <div className="space-y-1.5">
            <label htmlFor="status-select" className="block text-xs font-medium text-white/50 uppercase tracking-wide">
              Nuevo estado
            </label>
            <select
              id="status-select"
              name="status"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as OrderStatus)}
              disabled={pending}
              className="
                w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3
                text-sm text-white appearance-none cursor-pointer
                transition-all duration-200
                focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                disabled:opacity-50
              "
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#1a1d2e] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            id="update-status-btn"
            type="submit"
            disabled={pending}
            className="
              w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600
              px-4 py-3 text-sm font-semibold text-white
              shadow-lg shadow-indigo-500/25 transition-all duration-200
              hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.02]
              active:scale-95 disabled:cursor-not-allowed disabled:opacity-60
              flex items-center justify-center gap-2
            "
          >
            {pendingStatus
              ? <><Loader2 size={15} className="animate-spin" /> Actualizando…</>
              : 'Actualizar Estado'
            }
          </button>
        </form>

        {/* ── Payment prompt (shown when delivering with balance) ── */}
        {showPaymentPrompt && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Hay saldo pendiente</p>
                <p className="text-xs text-white/50 mt-0.5">
                  Esta orden tiene un saldo de <strong className="text-amber-300">{fmt(balance)}</strong>. ¿Se liquidó antes de entregar?
                </p>
              </div>
            </div>

            {/* Option A: Register payment + deliver */}
            <form action={submitFin} className="space-y-3">
              <input type="hidden" name="register_payment"  value="true" />
              <input type="hidden" name="new_status"        value="delivered" />
              <input type="hidden" name="estimated_cost"    value={estimatedCost  ?? ''} />
              <input type="hidden" name="advance_payment"   value={advancePayment ?? ''} />

              <p className="text-xs text-white/40">O ingresa el monto exacto recibido:</p>
              <input
                type="number"
                name="payment_amount"
                min="0"
                step="0.01"
                defaultValue={balance ?? ''}
                disabled={pendingFin}
                className="
                  w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5
                  text-sm text-white placeholder-white/25
                  focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none
                "
              />

              <button
                type="submit"
                disabled={pendingFin}
                className="
                  w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600
                  px-4 py-2.5 text-sm font-semibold text-white
                  shadow-lg shadow-emerald-500/20 transition-all duration-200
                  hover:from-emerald-500 hover:to-teal-500 active:scale-95
                  disabled:opacity-60 flex items-center justify-center gap-2
                "
              >
                {pendingFin
                  ? <><Loader2 size={14} className="animate-spin" /> Registrando…</>
                  : <><ReceiptText size={14} /> Sí, registrar pago y entregar</>
                }
              </button>
            </form>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={deliverWithoutPayment}
                disabled={pending}
                className="
                  flex-1 rounded-xl border border-white/10 px-4 py-2 text-xs
                  text-slate-400 hover:text-white hover:border-white/20
                  transition-colors disabled:opacity-50
                "
              >
                Entregar sin registrar pago
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentPrompt(false)}
                disabled={pending}
                className="
                  flex-1 rounded-xl border border-white/10 px-4 py-2 text-xs
                  text-slate-400 hover:text-white hover:border-white/20
                  transition-colors disabled:opacity-50
                "
              >
                Cancelar
              </button>
            </div>

            {finState.error && (
              <p className="text-xs text-red-300 flex items-center gap-1.5">
                <XCircle size={12} /> {finState.error}
              </p>
            )}
          </div>
        )}

        {/* Feedback */}
        {statusState.success && statusState.message && (
          <div role="status" className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={15} className="shrink-0" />
            {statusState.message}
          </div>
        )}
        {statusState.error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <XCircle size={15} className="mt-0.5 shrink-0" />
            {statusState.error}
          </div>
        )}

        {/* Status timeline */}
        <div className="pt-2 border-t border-white/5">
          <p className="text-xs text-white/30 uppercase tracking-wide mb-3">Flujo de estados</p>
          <div className="flex flex-col gap-2">
            {STATUS_OPTIONS.filter(o => o.value !== 'cancelled').map(opt => {
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
