'use client'

import {
  Tag,
  Cpu,
  Boxes,
  DollarSign,
  Package,
  AlertTriangle,
  MapPin,
} from 'lucide-react'

/* ─── Generic labelled input ──────────────────────────────────────────────── */
export function Field({
  id,
  label,
  icon: Icon,
  required,
  hint,
  ...rest
}: {
  id: string
  label: string
  icon?: React.ElementType
  required?: boolean
  hint?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="ml-1 text-indigo-400">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon size={14} className="text-slate-500" />
          </span>
        )}
        <input
          id={id}
          name={id}
          required={required}
          className={`
            w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm text-slate-100
            placeholder:text-slate-600 outline-none
            focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20
            transition-all duration-150
            ${Icon ? 'pl-9 pr-4' : 'px-4'}
          `}
          {...rest}
        />
      </div>
      {hint && <p className="text-[11px] text-slate-600 pl-1">{hint}</p>}
    </div>
  )
}

/* ─── Shared form body used by both Create and Edit modals ────────────────── */
export interface PartFormDefaultValues {
  name?: string
  brand?: string | null
  model_compatibility?: string[] | null
  cost_price?: number | null
  sale_price?: number | null
  stock_quantity?: number
  min_stock_alert?: number
  location_in_workshop?: string | null
  /** When true, the stock_quantity field is hidden (edit mode doesn't change stock this way) */
  hideStock?: boolean
}

export default function PartFormFields({ defaults }: { defaults?: PartFormDefaultValues }) {
  const compatStr = defaults?.model_compatibility?.join(', ') ?? ''

  return (
    <div className="space-y-5">
      {/* Row 1: Nombre + Marca */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          id="name"
          label="Nombre de la pieza"
          icon={Tag}
          placeholder="Ej: Pantalla OLED"
          required
          defaultValue={defaults?.name ?? ''}
        />
        <Field
          id="brand"
          label="Marca"
          icon={Cpu}
          placeholder="Ej: Apple, Samsung"
          required
          defaultValue={defaults?.brand ?? ''}
        />
      </div>

      {/* Row 2: Compatibilidad */}
      <Field
        id="model_compatibility"
        label="Compatibilidad de modelos"
        icon={Boxes}
        placeholder="Ej: iphone 13, iphone 14, iphone 15"
        hint="Separa los modelos con comas. Se guardarán en minúsculas."
        defaultValue={compatStr}
      />

      {/* Row 3: Costo + Precio venta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          id="cost_price"
          label="Precio de costo"
          icon={DollarSign}
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          defaultValue={defaults?.cost_price ?? ''}
        />
        <Field
          id="sale_price"
          label="Precio de venta"
          icon={DollarSign}
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          defaultValue={defaults?.sale_price ?? ''}
        />
      </div>

      {/* Row 4: Stock + Alerta mínima + Ubicación */}
      <div className={`grid grid-cols-1 gap-4 ${defaults?.hideStock ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
        {!defaults?.hideStock && (
          <Field
            id="stock_quantity"
            label="Stock inicial"
            icon={Package}
            type="number"
            min="0"
            step="1"
            placeholder="0"
            defaultValue={defaults?.stock_quantity ?? 0}
          />
        )}
        <Field
          id="min_stock_alert"
          label="Alerta de mínimo"
          icon={AlertTriangle}
          type="number"
          min="0"
          step="1"
          placeholder="5"
          defaultValue={defaults?.min_stock_alert ?? 5}
        />
        <Field
          id="location_in_workshop"
          label="Ubicación física"
          icon={MapPin}
          placeholder="Ej: Cajón A3"
          defaultValue={defaults?.location_in_workshop ?? ''}
        />
      </div>
    </div>
  )
}
