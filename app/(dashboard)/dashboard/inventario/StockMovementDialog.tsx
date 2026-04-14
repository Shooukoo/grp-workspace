'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  PackagePlus,
  PackageMinus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { adjustStockAction } from '@/app/actions/inventory'

interface StockMovementDialogProps {
  part: { id: string; name: string; stock_quantity: number }
  open: boolean
  onClose: () => void
}

export default function StockMovementDialog({ part, open, onClose }: StockMovementDialogProps) {
  const [type,    setType]    = useState<'entry' | 'exit'>('entry')
  const [amount,  setAmount]  = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset local state every time the modal opens
  useEffect(() => {
    if (!open) return
    setType('entry')
    setAmount('')
    setError(null)
    setSuccess(null)
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  // Auto-close 1.2 s after success
  useEffect(() => {
    if (!success) return
    const t = setTimeout(onClose, 1200)
    return () => clearTimeout(t)
  }, [success, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(amount, 10)
    if (!qty || qty <= 0) {
      setError('Ingresa una cantidad válida mayor a 0.')
      return
    }
    setError(null)

    startTransition(async () => {
      const result = await adjustStockAction(part.id, qty, type)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(result.message ?? 'Movimiento registrado.')
      }
    })
  }

  if (!open) return null

  const isEntry = type === 'entry'
  const preview = amount
    ? isEntry
      ? part.stock_quantity + parseInt(amount || '0', 10)
      : Math.max(0, part.stock_quantity - parseInt(amount || '0', 10))
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,18,0.84)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-move-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-slate-900 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              isEntry
                ? 'bg-emerald-500/15 border-emerald-500/20'
                : 'bg-orange-500/15 border-orange-500/20'
            }`}>
              {isEntry
                ? <PackagePlus  size={17} className="text-emerald-400" />
                : <PackageMinus size={17} className="text-orange-400" />}
            </div>
            <div>
              <h2 id="stock-move-title" className="text-sm font-bold text-white">Ajustar Stock</h2>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{part.name}</p>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current stock */}
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
            <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Stock actual</span>
            <span className="text-lg font-bold tabular-nums text-white">{part.stock_quantity}</span>
          </div>

          {/* Entry / Exit toggle */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tipo de movimiento
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="movement-entry-btn"
                onClick={() => setType('entry')}
                className={`
                  flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold
                  transition-all duration-150
                  ${type === 'entry'
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/8 bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'}
                `}
              >
                <ArrowDownToLine size={15} />
                Entrada
              </button>
              <button
                type="button"
                id="movement-exit-btn"
                onClick={() => setType('exit')}
                className={`
                  flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold
                  transition-all duration-150
                  ${type === 'exit'
                    ? 'border-orange-500/40 bg-orange-500/15 text-orange-300'
                    : 'border-white/8 bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'}
                `}
              >
                <ArrowUpFromLine size={15} />
                Salida
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="move-amount" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cantidad
            </label>
            <input
              ref={inputRef}
              id="move-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej: 10"
              className="
                w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5
                text-sm text-slate-100 placeholder:text-slate-600
                outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20
                transition-all duration-150 tabular-nums
              "
            />
          </div>

          {/* Preview */}
          {preview !== null && (
            <div className={`
              flex items-center justify-between rounded-xl border px-4 py-3
              ${isEntry
                ? 'border-emerald-500/20 bg-emerald-500/8'
                : 'border-orange-500/20 bg-orange-500/8'}
            `}>
              <span className="text-xs text-slate-400">Stock resultante</span>
              <span className={`text-lg font-bold tabular-nums ${isEntry ? 'text-emerald-400' : 'text-orange-400'}`}>
                {preview}
              </span>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle2 size={14} className="shrink-0" />
              {success}
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
              id="confirm-movement-btn"
              disabled={isPending || !amount}
              className={`
                inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white
                shadow-md transition-all duration-150 active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed
                ${isEntry
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'}
              `}
            >
              {isPending
                ? <><Loader2 size={14} className="animate-spin" /> Procesando…</>
                : isEntry
                  ? <><ArrowDownToLine size={14} /> Registrar Entrada</>
                  : <><ArrowUpFromLine size={14} /> Registrar Salida</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
