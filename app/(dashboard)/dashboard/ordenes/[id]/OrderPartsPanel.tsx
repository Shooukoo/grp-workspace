'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  Wrench,
  Plus,
  Minus,
  Trash2,
  Search,
  PackageSearch,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import {
  addPartToOrderAction,
  removePartFromOrderAction,
  updateOrderPartQtyAction,
} from '@/app/actions/inventory'

/* ─── Types ───────────────────────────────────────────────────────────────── */
export interface InventoryPart {
  id: string
  name: string
  brand: string | null
  sale_price: number | null
  stock_quantity: number
}

export interface OrderPart {
  id: string            // repair_order_parts.id
  part_id: string
  quantity: number
  unit_price_at_sale: number | null
  parts_inventory: {
    name: string
    brand: string | null
  } | null
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function formatMXN(v: number | null) {
  if (v === null || v === undefined) return '—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2,
  }).format(v)
}

/* ─── Part search combobox ────────────────────────────────────────────────── */
function PartSearchBox({
  parts,
  onAdd,
}: {
  parts: InventoryPart[]
  onAdd: (partId: string, qty: number) => void
}) {
  const [query,      setQuery]      = useState('')
  const [qty,        setQty]        = useState(1)
  const [selected,   setSelected]   = useState<InventoryPart | null>(null)
  const [showList,   setShowList]   = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const filtered = query.length >= 1
    ? parts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.brand ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : parts.slice(0, 8)   // show first 8 when no query

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setShowList(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleSelect = (p: InventoryPart) => {
    setSelected(p)
    setQuery(p.name)
    setShowList(false)
  }

  const handleAdd = () => {
    if (!selected) return
    onAdd(selected.id, qty)
    setSelected(null)
    setQuery('')
    setQty(1)
  }

  return (
    <div className="space-y-3">
      {/* Search + Qty row */}
      <div className="flex gap-2">
        {/* Combobox */}
        <div className="relative flex-1" ref={wrapRef}>
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Search size={13} className="text-slate-500" />
          </span>
          <input
            type="text"
            id="part-search-input"
            placeholder="Buscar refacción…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); setShowList(true) }}
            onFocus={() => setShowList(true)}
            className="
              w-full rounded-xl border border-white/10 bg-white/[0.04]
              pl-9 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-600
              outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20
              transition-all duration-150
            "
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDown size={13} className="text-slate-600" />
          </span>

          {/* Dropdown */}
          {showList && (
            <div className="
              absolute left-0 right-0 top-full mt-1 z-30
              max-h-52 overflow-y-auto
              rounded-xl border border-white/10 bg-slate-900 shadow-xl shadow-black/50
            ">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-500 italic">Sin resultados</p>
              ) : filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => handleSelect(p)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <span className="flex flex-col items-start text-left min-w-0">
                    <span className="font-medium truncate">{p.name}</span>
                    {p.brand && <span className="text-[10px] text-slate-500">{p.brand}</span>}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-semibold text-emerald-400">{formatMXN(p.sale_price)}</span>
                    <span className="block text-[10px] text-slate-600">Stock: {p.stock_quantity}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quantity */}
        <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="px-2.5 py-2 text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            <Minus size={12} strokeWidth={2.5} />
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums text-slate-100 select-none">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty(q => q + 1)}
            className="px-2.5 py-2 text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Add button */}
        <button
          type="button"
          id="add-part-to-order-btn"
          onClick={handleAdd}
          disabled={!selected}
          className="
            flex items-center gap-1.5 rounded-xl
            bg-indigo-600 hover:bg-indigo-500
            px-4 py-2 text-sm font-semibold text-white
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-150 active:scale-95 shrink-0
          "
        >
          <Plus size={14} strokeWidth={2.5} />
          Agregar
        </button>
      </div>

      {/* Selected preview */}
      {selected && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-4 py-2">
          <span className="text-sm text-indigo-300 font-medium">{selected.name}</span>
          <span className="text-sm font-bold text-emerald-400">
            {formatMXN(selected.sale_price)} × {qty} = {formatMXN((selected.sale_price ?? 0) * qty)}
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── OrderPartsPanel ─────────────────────────────────────────────────────── */
interface OrderPartsPanelProps {
  orderId:    string
  orderParts: OrderPart[]
  inventory:  InventoryPart[]
}

export default function OrderPartsPanel({
  orderId,
  orderParts,
  inventory,
}: OrderPartsPanelProps) {
  const [isPendingAdd, startAdd]    = useTransition()
  const [pendingRowId, setPendingRow] = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)

  /* ── Add a part ──────────────────────────────────────────────────────────── */
  const handleAdd = (partId: string, qty: number) => {
    setError(null)
    startAdd(async () => {
      const res = await addPartToOrderAction(orderId, partId, qty)
      if (res.error) setError(res.error)
    })
  }

  /* ── Quantity ±1 ─────────────────────────────────────────────────────────── */
  const handleQtyDelta = (op: OrderPart, delta: number) => {
    setPendingRow(op.id)
    void updateOrderPartQtyAction(orderId, op.id, op.quantity + delta).finally(() =>
      setPendingRow(null),
    )
  }

  /* ── Remove ──────────────────────────────────────────────────────────────── */
  const handleRemove = (op: OrderPart) => {
    setPendingRow(op.id)
    void removePartFromOrderAction(orderId, op.id).finally(() => setPendingRow(null))
  }

  /* ── Totals ──────────────────────────────────────────────────────────────── */
  const subtotal = orderParts.reduce(
    (sum, op) => sum + (op.unit_price_at_sale ?? 0) * op.quantity,
    0,
  )

  return (
    <div className="space-y-4">
      {/* Search + add */}
      <PartSearchBox parts={inventory} onAdd={handleAdd} />

      {/* Loading overlay */}
      {isPendingAdd && (
        <div className="flex items-center gap-2 text-xs text-indigo-400">
          <Loader2 size={12} className="animate-spin" />
          Agregando refacción…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          <AlertTriangle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Parts list */}
      {orderParts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] py-8 text-center">
          <PackageSearch size={26} className="text-slate-600" />
          <p className="text-sm text-slate-500">Sin refacciones asignadas</p>
          <p className="text-xs text-slate-600">Busca y agrega piezas con el buscador.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {['Refacción', 'P. Unitario', 'Cant.', 'Subtotal', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orderParts.map((op) => {
                const isLoading = pendingRowId === op.id
                const name      = op.parts_inventory?.name  ?? '—'
                const brand     = op.parts_inventory?.brand ?? null
                const lineTotal = (op.unit_price_at_sale ?? 0) * op.quantity

                return (
                  <tr key={op.id} className={`transition-colors ${isLoading ? 'opacity-50' : 'hover:bg-white/[0.02]'}`}>
                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200">{name}</p>
                      {brand && <p className="text-[10px] text-slate-500">{brand}</p>}
                    </td>

                    {/* Unit price */}
                    <td className="px-4 py-3 tabular-nums text-slate-400 whitespace-nowrap">
                      {formatMXN(op.unit_price_at_sale)}
                    </td>

                    {/* Qty controls */}
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
                        <button
                          type="button"
                          id={`qty-dec-${op.id}`}
                          onClick={() => handleQtyDelta(op, -1)}
                          disabled={isLoading}
                          className="px-2 py-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                          aria-label="Restar"
                        >
                          <Minus size={10} strokeWidth={2.5} />
                        </button>
                        <span className="px-2.5 text-sm font-bold tabular-nums text-slate-100">
                          {isLoading
                            ? <Loader2 size={12} className="animate-spin" />
                            : op.quantity}
                        </span>
                        <button
                          type="button"
                          id={`qty-inc-${op.id}`}
                          onClick={() => handleQtyDelta(op, +1)}
                          disabled={isLoading}
                          className="px-2 py-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-30"
                          aria-label="Sumar"
                        >
                          <Plus size={10} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>

                    {/* Line total */}
                    <td className="px-4 py-3 tabular-nums font-semibold text-slate-200 whitespace-nowrap">
                      {formatMXN(lineTotal)}
                    </td>

                    {/* Remove */}
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        id={`remove-part-${op.id}`}
                        onClick={() => handleRemove(op)}
                        disabled={isLoading}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-slate-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-30 transition-all"
                        aria-label="Quitar refacción"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Subtotal footer */}
            <tfoot>
              <tr className="border-t border-white/8 bg-white/[0.02]">
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Subtotal refacciones
                </td>
                <td className="px-4 py-3 text-sm font-bold text-white tabular-nums whitespace-nowrap">
                  {formatMXN(subtotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
