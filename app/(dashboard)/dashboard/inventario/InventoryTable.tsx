'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  SlidersHorizontal,
  Trash2,
  Loader2,
} from 'lucide-react'
import StockControls from './StockControls'
import EditPartModal from './EditPartModal'
import StockMovementDialog from './StockMovementDialog'
import { deletePartAction } from '@/app/actions/inventory'

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface Part {
  id: string
  name: string
  brand: string | null
  model_compatibility: string[] | null
  cost_price: number | null
  sale_price: number | null
  stock_quantity: number
  min_stock_alert: number
  location_in_workshop: string | null
}

/* ─── Currency formatter ─────────────────────────────────────────────────── */
function formatMXN(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2,
  }).format(value)
}

/* ─── Row Actions Dropdown (rendered via portal to escape overflow) ────────── */
function RowActions({ part, onEdit, onAdjust }: {
  part: Part
  onEdit:   () => void
  onAdjust: () => void
}) {
  const [open, setOpen]              = useState(false)
  const [confirmDelete, setConfirm]  = useState(false)
  const [isPending, startTransition] = useTransition()
  const btnRef  = useRef<HTMLButtonElement>(null)

  // Position state for the portal menu
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})

  /* Recalculate position every time the menu opens */
  useEffect(() => {
    if (!open || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setMenuStyle({
      position: 'fixed',
      top:  rect.bottom + 6,
      right: window.innerWidth - rect.right,
      zIndex: 9999,
    })
  }, [open])

  /* Close on outside click or scroll */
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [open])

  const handleDelete = () => {
    startTransition(async () => {
      await deletePartAction(part.id)
      setOpen(false)
    })
  }

  const menu = open ? (
    /* stopPropagation so the document mousedown close handler ignores clicks inside */
    <div
      style={menuStyle}
      onMouseDown={(e) => e.stopPropagation()}
      className="
        min-w-[180px] rounded-xl border border-white/10 bg-slate-900
        shadow-xl shadow-black/60 overflow-hidden
      "
    >
      {/* Editar */}
      <button
        type="button"
        id={`edit-part-${part.id}`}
        onClick={() => { setOpen(false); onEdit() }}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
      >
        <Pencil size={13} className="text-amber-400" />
        Editar datos
      </button>

      {/* Ajustar stock */}
      <button
        type="button"
        id={`adjust-stock-${part.id}`}
        onClick={() => { setOpen(false); onAdjust() }}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
      >
        <SlidersHorizontal size={13} className="text-indigo-400" />
        Ajustar stock
      </button>

      {/* Divider */}
      <div className="my-1 border-t border-white/5" />

      {/* Eliminar con confirmación */}
      {!confirmDelete ? (
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setConfirm(true)}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <Trash2 size={13} />
          Eliminar
        </button>
      ) : (
        <div className="px-4 py-3 space-y-2" onMouseDown={(e) => e.stopPropagation()}>
          <p className="text-xs text-red-400 leading-snug">¿Confirmar eliminación?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              No
            </button>
            <button
              type="button"
              id={`confirm-delete-${part.id}`}
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 py-1 text-xs text-white font-semibold disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 size={11} className="animate-spin mx-auto" /> : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        id={`row-menu-${part.id}`}
        type="button"
        onClick={() => { setOpen(v => !v); setConfirm(false) }}
        className="
          flex h-7 w-7 items-center justify-center rounded-lg
          border border-white/8 bg-white/[0.03]
          text-slate-500 hover:text-slate-200 hover:bg-white/[0.08]
          transition-all duration-100
        "
        aria-label="Acciones"
        aria-expanded={open}
      >
        {isPending
          ? <Loader2 size={14} className="animate-spin" />
          : <MoreHorizontal size={14} />}
      </button>

      {/* Render dropdown outside the overflow container via portal */}
      {typeof document !== 'undefined' && open && createPortal(menu, document.body)}
    </>
  )
}

/* ─── InventoryTable ─────────────────────────────────────────────────────── */
export default function InventoryTable({ parts }: { parts: Part[] }) {
  const [editPart,   setEditPart]   = useState<Part | null>(null)
  const [adjustPart, setAdjustPart] = useState<Part | null>(null)

  if (parts.length === 0) return null

  return (
    <>
      {/*
        Outer div: NO overflow-hidden — that was clipping the portal-less dropdown.
        Border-radius is preserved via the table's thead first/last-child selectors.
      */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-sm text-left">
            {/* Head */}
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Refacción</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap hidden md:table-cell">Compatibilidad</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Costo</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap hidden md:table-cell">Precio Venta</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap hidden md:table-cell">Ubicación</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Stock</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-white/5">
              {parts.map((part) => {
                const isLowStock = part.stock_quantity <= part.min_stock_alert

                return (
                  <tr key={part.id} className="group transition-colors hover:bg-white/[0.025]">
                    {/* Refacción */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-100">{part.name}</p>
                      {part.brand && <p className="text-xs text-slate-500 mt-0.5">{part.brand}</p>}
                    </td>

                    {/* Compatibilidad — oculta en móvil */}
                    <td className="px-5 py-4 max-w-[200px] hidden md:table-cell">
                      {part.model_compatibility && part.model_compatibility.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {part.model_compatibility.slice(0, 3).map((m) => (
                            <span
                              key={m}
                              className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-slate-400"
                            >
                              {m}
                            </span>
                          ))}
                          {part.model_compatibility.length > 3 && (
                            <span className="inline-flex items-center rounded-md border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
                              +{part.model_compatibility.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>

                    {/* Costo */}
                    <td className="px-5 py-4 tabular-nums text-slate-300 whitespace-nowrap">
                      {formatMXN(part.cost_price)}
                    </td>

                    {/* Precio Venta — oculta en móvil */}
                    <td className="px-5 py-4 tabular-nums text-slate-300 whitespace-nowrap hidden md:table-cell">
                      {formatMXN(part.sale_price)}
                    </td>

                    {/* Ubicación — oculta en móvil */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      {part.location_in_workshop ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400">
                          {part.location_in_workshop}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>

                    {/* Stock + ±1 controls */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`
                            inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums
                            ${isLowStock
                              ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                              : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'}
                          `}
                        >
                          {isLowStock && <AlertTriangle size={12} strokeWidth={2.5} />}
                          {part.stock_quantity}
                        </span>
                        <StockControls partId={part.id} currentStock={part.stock_quantity} />
                      </div>
                      {isLowStock && (
                        <p className="mt-1 text-[10px] text-red-500/80">Mín. {part.min_stock_alert} u.</p>
                      )}
                    </td>

                    {/* Actions column */}
                    <td className="px-4 py-4">
                      <RowActions
                        part={part}
                        onEdit={()    => setEditPart(part)}
                        onAdjust={()  => setAdjustPart(part)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editPart && (
        <EditPartModal
          part={editPart}
          open={true}
          onClose={() => setEditPart(null)}
        />
      )}

      {/* Movement dialog */}
      {adjustPart && (
        <StockMovementDialog
          part={adjustPart}
          open={true}
          onClose={() => setAdjustPart(null)}
        />
      )}
    </>
  )
}
