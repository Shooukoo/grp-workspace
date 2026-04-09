'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { createOrderAction, type OrderActionState } from '@/app/actions/orders'
import { UserPlus, UserCheck, DollarSign, Wallet, Search, CheckCircle2, ChevronDown, X } from 'lucide-react'

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface Customer {
  id: string
  full_name: string
}

interface CreateOrderFormProps {
  customers: Customer[]
}

/* ─── Constants ───────────────────────────────────────────────────────────── */
const DEVICE_TYPES = ['Celular', 'Laptop', 'Tablet', 'Computadora de escritorio', 'Otro']

const initialState: OrderActionState = { error: null, success: false }

/* ─── Style helpers ───────────────────────────────────────────────────────── */
const inputBase = `
  w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3
  text-sm text-white
  placeholder:text-white/25 placeholder:transition-opacity placeholder:duration-200
  focus:placeholder-transparent
  transition-all duration-200
  focus:border-indigo-500/70 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
  disabled:opacity-50
`

const labelBase = 'block text-sm font-medium text-white/70'

/* ─── Section divider ─────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 pb-1 border-b border-white/5">
      {children}
    </p>
  )
}

/* ─── Customer Combobox ──────────────────────────────────────────────────── */
interface CustomerComboboxProps {
  customers: Customer[]
}

function CustomerCombobox({ customers }: CustomerComboboxProps) {
  const [query, setQuery]         = useState('')
  const [open, setOpen]           = useState(false)
  const [selected, setSelected]   = useState<Customer | null>(null)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  const filtered = query.trim() === ''
    ? customers.slice(0, 8)
    : customers
        .filter((c) => c.full_name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  function handleSelect(customer: Customer) {
    setSelected(customer)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { if (e.key !== 'Tab') setOpen(true); return }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)) }
    if (e.key === 'Enter')      { e.preventDefault(); if (filtered[highlighted]) handleSelect(filtered[highlighted]) }
    if (e.key === 'Escape')     { setOpen(false) }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Campo oculto con el ID real */}
      <input type="hidden" name="customer_id" value={selected?.id ?? ''} />

      {selected ? (
        /* ── Estado: cliente seleccionado ── */
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span className="text-sm font-medium text-white">{selected.full_name}</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Cambiar cliente"
            className="text-white/30 hover:text-white/70 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* ── Estado: búsqueda ── */
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-white/30">
            <Search size={14} />
          </span>
          <input
            ref={inputRef}
            id="customer_search"
            type="text"
            autoComplete="off"
            placeholder="Busca por nombre..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="
              w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-10 py-3
              text-sm text-white
              placeholder:text-white/25 placeholder:transition-opacity placeholder:duration-200
              focus:placeholder-transparent
              transition-all duration-200
              focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            "
          />
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-white/20">
            <ChevronDown size={14} />
          </span>
        </div>
      )}

      {/* ── Dropdown ── */}
      {open && !selected && (
        <div className="
          absolute z-50 mt-1.5 w-full rounded-xl border border-white/10
          bg-[#13152a] shadow-2xl shadow-black/50 overflow-hidden
        ">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-white/40">Sin resultados para "{query}"</p>
          ) : (
            <ul role="listbox" className="max-h-52 overflow-y-auto">
              {filtered.map((c, i) => (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={i === highlighted}
                  onMouseEnter={() => setHighlighted(i)}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(c) }}
                  className={`
                    px-4 py-2.5 cursor-pointer text-sm transition-colors duration-100
                    ${i === highlighted
                      ? 'bg-indigo-500/20 text-white'
                      : 'text-white/70 hover:bg-white/5'
                    }
                  `}
                >
                  {c.full_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Submit button ───────────────────────────────────────────────────────── */
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      id="submit-order-btn"
      type="submit"
      disabled={pending}
      className="
        flex-1 rounded-xl
        bg-gradient-to-r from-indigo-600 to-purple-600
        px-4 py-3 text-sm font-semibold text-white
        shadow-lg shadow-indigo-500/25
        transition-all duration-200
        hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40
        disabled:cursor-not-allowed disabled:opacity-60
        flex items-center justify-center gap-2
      "
    >
      {pending ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Guardando…
        </>
      ) : (
        'Crear orden'
      )}
    </button>
  )
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function CreateOrderForm({ customers }: CreateOrderFormProps) {
  const [state, formAction] = useActionState(createOrderAction, initialState)
  const [isNewCustomer, setIsNewCustomer] = useState(false)

  return (
    <div className="fixed inset-0 flex items-start justify-center overflow-y-auto bg-[#080a12] px-4 py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-[300px] w-[400px] rounded-full bg-purple-600/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-[#0f111a]/90 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Nueva Orden de Reparación
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Completa los datos del equipo y la falla reportada.
              </p>
            </div>

            {/* Form */}
            <form action={formAction} className="space-y-6" noValidate>

              {/* ══ SECCIÓN: Cliente ═══════════════════════════════════════ */}
              <div className="space-y-4">
                <SectionLabel>Cliente</SectionLabel>

                {/* Toggle nuevo / existente */}
                <div className="flex items-center justify-between">
                  <label className={labelBase}>
                    {isNewCustomer ? 'Nuevo cliente' : 'Cliente existente'}
                    {' '}<span className="text-pink-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomer((v) => !v)}
                    className={`
                      inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5
                      text-xs font-semibold border transition-all duration-200
                      ${isNewCustomer
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                      }
                    `}
                  >
                    {isNewCustomer ? (
                      <><UserCheck size={13} /> Usar cliente existente</>
                    ) : (
                      <><UserPlus size={13} /> Crear nuevo cliente</>
                    )}
                  </button>
                </div>

                {isNewCustomer ? (
                  /* ── Nuevo cliente inline ── */
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                    <input type="hidden" name="is_new_customer" value="true" />

                    {/* Nombre */}
                    <div className="space-y-1.5">
                      <label htmlFor="new_customer_name" className={labelBase}>
                        Nombre completo <span className="text-pink-400">*</span>
                      </label>
                      <input
                        id="new_customer_name"
                        name="new_customer_name"
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez García"
                        className={inputBase}
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <label htmlFor="new_customer_whatsapp" className={labelBase}>
                        WhatsApp <span className="text-white/30 font-normal">(opcional)</span>
                      </label>
                      <input
                        id="new_customer_whatsapp"
                        name="new_customer_whatsapp"
                        type="tel"
                        placeholder="Ej. 5512345678"
                        className={inputBase}
                      />
                    </div>
                  </div>
                ) : (
                  /* ── Combobox de búsqueda ── */
                  <div className="space-y-1.5">
                    <CustomerCombobox customers={customers} />
                    {customers.length === 0 && (
                      <p className="text-xs text-amber-400/80 mt-1">
                        ⚠️ No hay clientes registrados.{' '}
                        <a href="/dashboard/clientes" className="underline hover:text-amber-300">
                          Agrega uno primero
                        </a>{' '}
                        o usa "Crear nuevo cliente" ↑
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ══ SECCIÓN: Equipo ════════════════════════════════════════ */}
              <div className="space-y-4">
                <SectionLabel>Equipo</SectionLabel>

                {/* Tipo de equipo */}
                <div className="space-y-1.5">
                  <label htmlFor="device_type" className={labelBase}>
                    Tipo de equipo <span className="text-pink-400">*</span>
                  </label>
                  <select
                    id="device_type"
                    name="device_type"
                    required
                    className={`${inputBase} appearance-none cursor-pointer`}
                    defaultValue=""
                  >
                    <option value="" disabled className="bg-[#1a1d2e] text-white/40">
                      — Selecciona el tipo —
                    </option>
                    {DEVICE_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#1a1d2e] text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marca + Modelo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="brand" className={labelBase}>
                      Marca <span className="text-pink-400">*</span>
                    </label>
                    <input
                      id="brand"
                      name="brand"
                      type="text"
                      required
                      placeholder="Ej. Apple, Samsung"
                      className={inputBase}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="model" className={labelBase}>
                      Modelo <span className="text-pink-400">*</span>
                    </label>
                    <input
                      id="model"
                      name="model"
                      type="text"
                      required
                      placeholder="Ej. iPhone 14 Pro"
                      className={inputBase}
                    />
                  </div>
                </div>

                {/* Falla reportada */}
                <div className="space-y-1.5">
                  <label htmlFor="reported_failure" className={labelBase}>
                    Falla reportada <span className="text-pink-400">*</span>
                  </label>
                  <textarea
                    id="reported_failure"
                    name="reported_failure"
                    required
                    rows={3}
                    placeholder="Describe la falla que reporta el cliente..."
                    className={`${inputBase} resize-none`}
                  />
                </div>
              </div>

              {/* ══ SECCIÓN: Financiero ════════════════════════════════════ */}
              <div className="space-y-4">
                <SectionLabel>Financiero</SectionLabel>

                <div className="grid grid-cols-2 gap-4">
                  {/* Costo estimado */}
                  <div className="space-y-1.5">
                    <label htmlFor="estimated_cost" className={labelBase}>
                      Costo estimado{' '}
                      <span className="text-white/30 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-white/30">
                        <DollarSign size={14} />
                      </span>
                      <input
                        id="estimated_cost"
                        name="estimated_cost"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={`${inputBase} pl-8`}
                      />
                    </div>
                  </div>

                  {/* Anticipo */}
                  <div className="space-y-1.5">
                    <label htmlFor="advance_payment" className={labelBase}>
                      Anticipo / Enganche{' '}
                      <span className="text-white/30 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-white/30">
                        <Wallet size={14} />
                      </span>
                      <input
                        id="advance_payment"
                        name="advance_payment"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={`${inputBase} pl-8`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Error banner ─────────────────────────────────────────── */}
              {state.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 7a1 1 0 012 0v4a1 1 0 01-2 0V7zm1 7a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{state.error}</span>
                </div>
              )}

              {/* ── Actions ──────────────────────────────────────────────── */}
              <div className="flex gap-3 pt-1">
                <a
                  href="/dashboard/ordenes"
                  className="
                    flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3
                    text-sm font-medium text-white/60 text-center
                    transition-all duration-200 hover:bg-white/10 hover:text-white
                  "
                >
                  Cancelar
                </a>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
