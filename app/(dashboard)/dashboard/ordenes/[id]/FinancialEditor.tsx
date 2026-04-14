'use client'

import { useActionState, useState, useEffect } from 'react'
import { DollarSign, CreditCard, Wallet, Pencil, X, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react'
import { updateOrderFinancialsAction, type FinancialsState } from '@/app/actions/orders'

interface FinancialEditorProps {
  orderId:        string
  estimatedCost:  number | null
  advancePayment: number | null
  partsSubtotal?: number   // read-only reference — sum of repair_order_parts line totals
}

const initial: FinancialsState = { error: null, success: false, message: null }

function fmt(n: number | null) {
  if (n === null || n === undefined) return null
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

export default function FinancialEditor({ orderId, estimatedCost, advancePayment, partsSubtotal }: FinancialEditorProps) {
  const [editing, setEditing] = useState(false)

  const bound = updateOrderFinancialsAction.bind(null, orderId)
  const [state, formAction, pending] = useActionState(bound, initial)

  // Cierra el panel solo cuando llega una respuesta exitosa nueva del servidor
  useEffect(() => {
    if (state.success) setEditing(false)
  }, [state])

  // Total = mano de obra (estimated_cost) + refacciones asignadas
  const parts         = partsSubtotal ?? 0
  const totalCost     = estimatedCost !== null ? estimatedCost + parts : null
  const advance       = advancePayment ?? 0
  const balance       = totalCost !== null ? totalCost - advance : null
  const isLiquidated  = balance !== null && balance <= 0

  const balanceColor = isLiquidated
    ? 'text-emerald-400'
    : balance !== null && balance > 0
      ? 'text-amber-400'
      : 'text-slate-400'

  return (
    <div className="space-y-3">
      {/* ── 3 summary cards ─────────────────────────────────────────────── */}
      <div className={`grid gap-3 ${partsSubtotal !== undefined ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
        <FinCard icon={DollarSign} label="Costo estimado"    value={fmt(estimatedCost)}  accent="border-indigo-500/20 text-indigo-400" />
        <FinCard icon={CreditCard} label="Anticipo recibido" value={fmt(advancePayment)} accent="border-emerald-500/20 text-emerald-400" />
        {partsSubtotal !== undefined && (
          <FinCard icon={Wallet} label="Refacciones" value={fmt(partsSubtotal)} accent="border-purple-500/20 text-purple-400" />
        )}
        <FinCard
          icon={Wallet}
          label="Saldo pendiente"
          value={totalCost !== null ? fmt(balance) : null}
          accent={
            isLiquidated
              ? 'border-emerald-500/20 text-emerald-400'
              : balance !== null && balance > 0
                ? 'border-amber-500/20 text-amber-400'
                : 'border-slate-500/20 text-slate-400'
          }
          badge={isLiquidated ? 'LIQUIDADO ✓' : undefined}
        />
      </div>

      {/* ─── Editar costos toggle ────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(v => !v)}
          className={`
            inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium
            border transition-all duration-150
            ${editing
              ? 'text-slate-400 border-white/10 hover:text-white'
              : 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50'
            }
          `}
        >
          {editing ? <><X size={11} /> Cancelar</> : <><Pencil size={11} /> Editar costos</>}
        </button>
      </div>

      {/* ─── Edit form — keyed so React remounts with fresh defaultValues after save ── */}
      {editing && (
        <div className="rounded-2xl border border-white/10 bg-[#0f111a]/80 p-5 space-y-4">
          <form
            key={`${estimatedCost}-${advancePayment}`}
            action={formAction}
            className="space-y-4"
          >
            <input type="hidden" name="register_payment" value="false" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberField icon={DollarSign} label="Costo estimado" name="estimated_cost" color="text-indigo-400" defaultValue={estimatedCost} disabled={pending} />
              <NumberField icon={CreditCard} label="Anticipo"       name="advance_payment" color="text-emerald-400" defaultValue={advancePayment} disabled={pending} />
            </div>

            {/* Live balance preview */}
            <p className="text-xs text-white/30 text-right">
              Saldo resultante:{' '}
              <span className={`font-semibold ${balanceColor}`}>
                {estimatedCost !== null ? fmt(balance) : '—'}
              </span>
            </p>

            {/* Feedback */}
            {state.error && (
              <div className="flex items-center gap-2 text-sm text-red-300 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5">
                <AlertCircle size={14} className="shrink-0" />{state.error}
              </div>
            )}
            {state.success && state.message && (
              <div className="flex items-center gap-2 text-sm text-emerald-300 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5">
                <CheckCircle2 size={14} className="shrink-0" />{state.message}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="
                w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600
                px-4 py-2.5 text-sm font-semibold text-white
                shadow-lg shadow-indigo-500/20 transition-all duration-200
                hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.01]
                active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {pending
                ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
                : <><Save size={14} /> Guardar costos</>
              }
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────────────────────── */
function FinCard({
  icon: Icon, label, value, accent, badge,
}: {
  icon: React.ElementType
  label: string
  value: string | null
  accent: string
  badge?: string
}) {
  return (
    <div className={`rounded-2xl border ${accent.split(' ')[0]} bg-[#0f111a]/70 backdrop-blur p-5 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/30">{label}</p>
        <Icon size={14} className={accent.split(' ')[1]} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className={`text-xl font-bold ${accent.split(' ')[1]}`}>
          {value ?? <span className="text-sm font-normal text-white/20 italic">Sin definir</span>}
        </p>
        {badge && (
          <span className={`text-[10px] font-bold ${accent.split(' ')[1]} border ${accent.split(' ')[0]} rounded-full px-2 py-0.5 whitespace-nowrap`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

function NumberField({
  icon: Icon, label, name, defaultValue, color, disabled,
}: {
  icon: React.ElementType
  label: string
  name: string
  defaultValue: number | null
  color: string
  disabled: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 uppercase tracking-wide">
        <Icon size={10} className={color} />
        {label}
      </label>
      <input
        type="number"
        name={name}
        min="0"
        step="0.01"
        defaultValue={defaultValue ?? ''}
        placeholder="0.00"
        disabled={disabled}
        className="
          w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5
          text-sm text-white placeholder-white/25
          transition-all duration-150
          focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
          disabled:opacity-50
          [appearance:textfield]
          [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none
        "
      />
    </div>
  )
}
