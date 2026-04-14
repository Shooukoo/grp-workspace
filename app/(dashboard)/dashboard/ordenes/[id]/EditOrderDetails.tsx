'use client'

import { useActionState, useState, useEffect } from 'react'
import {
  Pencil, X, Loader2, CheckCircle2, AlertCircle, Save,
  UserCog, MessageSquare, Wrench,
} from 'lucide-react'
import { updateOrderDetailsAction, type EditOrderState } from '@/app/actions/orders'

const DEVICE_TYPES = ['Celular', 'Tablet', 'Laptop', 'PC', 'Consola', 'Smartwatch', 'Impresora', 'Otro']

/* ── Types ─────────────────────────────────────────────────────────────────── */
export interface Technician {
  id: string
  full_name: string
  role: string
}

interface EditOrderDetailsProps {
  orderId:          string
  device_type:      string
  brand:            string
  model:            string
  reported_failure: string
  comments:         string | null
  technician_id:    string | null
  technicians:      Technician[]
}

const initial: EditOrderState = { error: null, success: false, message: null }

const inputCls = `
  w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5
  text-sm text-white placeholder-white/25
  transition-all duration-150
  focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
  disabled:opacity-50
`

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function EditOrderDetails({
  orderId,
  device_type,
  brand,
  model,
  reported_failure,
  comments,
  technician_id,
  technicians,
}: EditOrderDetailsProps) {
  const [editing, setEditing] = useState(false)

  const bound = updateOrderDetailsAction.bind(null, orderId)
  const [state, formAction, pending] = useActionState(bound, initial)

  useEffect(() => {
    if (state.success) setEditing(false)
  }, [state])

  // Resolve assigned technician name for the read-only view
  const assignedTech = technicians.find(t => t.id === technician_id) ?? null

  return (
    <div className="space-y-4">
      {/* ── Header row with edit toggle ──────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Datos del Equipo
        </p>
        <button
          type="button"
          onClick={() => setEditing(v => !v)}
          className={`
            inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium
            transition-colors duration-150
            ${editing
              ? 'text-slate-400 hover:text-white border border-white/10 hover:border-white/20'
              : 'text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 bg-indigo-500/5'}
          `}
        >
          {editing ? <><X size={11} /> Cancelar</> : <><Pencil size={11} /> Editar</>}
        </button>
      </div>

      {/* ── View mode ──────────────────────────────────────────────── */}
      {!editing && (
        <dl className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Row label="Tipo de equipo" value={device_type} />
            <Row label="Marca"          value={brand} />
            <Row label="Modelo"         value={model} className="sm:col-span-2" />
          </div>

          {/* Falla reportada */}
          <div className="pt-4 border-t border-white/5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Falla reportada
            </dt>
            <dd className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
              {reported_failure}
            </dd>
          </div>

          {/* Técnico asignado */}
          <div className="pt-4 border-t border-white/5 flex items-center gap-2">
            <UserCog size={13} className="text-indigo-400 shrink-0" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Técnico asignado
              </dt>
              <dd className="text-sm text-slate-200 mt-0.5">
                {assignedTech
                  ? <span className="flex items-center gap-1.5">
                      {assignedTech.full_name}
                      <span className="text-[10px] rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 px-2 py-0.5 capitalize">
                        {assignedTech.role}
                      </span>
                    </span>
                  : <span className="text-slate-500 italic">Sin asignar</span>}
              </dd>
            </div>
          </div>

          {/* Comentarios del técnico */}
          {comments && (
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={13} className="text-amber-400" />
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Comentarios del técnico
                </dt>
              </div>
              <dd className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap rounded-xl bg-amber-500/5 border border-amber-500/10 px-4 py-3">
                {comments}
              </dd>
            </div>
          )}
        </dl>
      )}

      {/* ── Edit mode ──────────────────────────────────────────────── */}
      {editing && (
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wide">
                Tipo de equipo
              </label>
              <select
                name="device_type"
                defaultValue={device_type}
                disabled={pending}
                className={inputCls}
              >
                {DEVICE_TYPES.map(t => (
                  <option key={t} value={t} className="bg-[#1a1d2e]">{t}</option>
                ))}
              </select>
            </div>

            {/* Marca */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wide">
                Marca
              </label>
              <input
                name="brand" type="text" defaultValue={brand} disabled={pending}
                placeholder="Samsung, Apple…" className={inputCls}
              />
            </div>

            {/* Modelo */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wide">
                Modelo
              </label>
              <input
                name="model" type="text" defaultValue={model} disabled={pending}
                placeholder="S22 Ultra, iPhone 14…" className={inputCls}
              />
            </div>

            {/* Técnico asignado */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 uppercase tracking-wide">
                <UserCog size={11} className="text-indigo-400" />
                Técnico asignado
              </label>
              <select
                name="technician_id"
                defaultValue={technician_id ?? ''}
                disabled={pending}
                className={inputCls}
              >
                <option value="" className="bg-[#1a1d2e] text-white/40">— Sin asignar —</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#1a1d2e]">
                    {t.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Falla reportada */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wide">
                Falla reportada
              </label>
              <textarea
                name="reported_failure" rows={3} defaultValue={reported_failure} disabled={pending}
                placeholder="Describe la falla…" className={inputCls}
              />
            </div>

            {/* Comentarios del técnico */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 uppercase tracking-wide">
                <MessageSquare size={11} className="text-amber-400" />
                Comentarios del técnico
              </label>
              <textarea
                name="comments" rows={3} defaultValue={comments ?? ''} disabled={pending}
                placeholder="Diagnóstico, notas internas, piezas usadas…"
                className={inputCls}
              />
            </div>
          </div>

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

          {/* Submit */}
          <button
            type="submit" disabled={pending}
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
              : <><Save size={14} /> Guardar cambios</>}
          </button>
        </form>
      )}
    </div>
  )
}

/* ── Helper sub-component ──────────────────────────────────────────────────── */
function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-0.5 ${className ?? ''}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200">{value || <span className="text-slate-600 italic">—</span>}</dd>
    </div>
  )
}
