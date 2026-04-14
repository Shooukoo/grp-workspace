'use client'

import { useTransition } from 'react'
import { Minus, Plus, Loader2 } from 'lucide-react'
import { updateStockAction } from '@/app/actions/inventory'

interface StockControlsProps {
  partId: string
  currentStock: number
}

export default function StockControls({ partId, currentStock }: StockControlsProps) {
  const [isPendingDec, startDec] = useTransition()
  const [isPendingInc, startInc] = useTransition()

  const handleDecrement = () => {
    if (currentStock <= 0) return
    startDec(() => { void updateStockAction(partId, -1) })
  }

  const handleIncrement = () => {
    startInc(() => { void updateStockAction(partId, +1) })
  }

  return (
    <div className="inline-flex items-center gap-1">
      {/* Decrement */}
      <button
        id={`stock-dec-${partId}`}
        type="button"
        onClick={handleDecrement}
        disabled={isPendingDec || isPendingInc || currentStock <= 0}
        aria-label="Restar 1 unidad"
        className="
          flex h-6 w-6 items-center justify-center rounded-lg
          border border-white/10 bg-white/[0.04]
          text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-100 active:scale-90
        "
      >
        {isPendingDec ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          <Minus size={10} strokeWidth={2.5} />
        )}
      </button>

      {/* Increment */}
      <button
        id={`stock-inc-${partId}`}
        type="button"
        onClick={handleIncrement}
        disabled={isPendingDec || isPendingInc}
        aria-label="Sumar 1 unidad"
        className="
          flex h-6 w-6 items-center justify-center rounded-lg
          border border-white/10 bg-white/[0.04]
          text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-100 active:scale-90
        "
      >
        {isPendingInc ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          <Plus size={10} strokeWidth={2.5} />
        )}
      </button>
    </div>
  )
}
