import type { Metadata } from 'next'
import { Package } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { getUserContext } from '@/utils/supabase/queries'
import CreatePartModal from './CreatePartModal'
import InventoryTable, { type Part } from './InventoryTable'

export const metadata: Metadata = {
  title: 'Inventario de Refacciones | GRP Workspace',
  description: 'Gestiona el inventario de refacciones y piezas de tu taller.',
}

export default async function InventarioPage() {
  const supabase = await createClient()
  const { workshopId } = await getUserContext()

  const { data, error } = await supabase
    .from('parts_inventory')
    .select(
      'id, name, brand, model_compatibility, cost_price, sale_price, stock_quantity, min_stock_alert, location_in_workshop',
    )
    .eq('workshop_id', workshopId)
    .order('name', { ascending: true })

  const parts: Part[] = (data as Part[]) ?? []

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Package size={22} className="text-indigo-400" />
            Inventario de Refacciones
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {parts.length > 0
              ? `${parts.length} piezas registradas`
              : 'Aún no hay refacciones en el inventario.'}
          </p>
        </div>

        <CreatePartModal />
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <strong>Error al cargar inventario:</strong> {error.message}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {parts.length === 0 && !error && (
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Package size={28} className="text-indigo-400" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-white">Sin refacciones todavía</p>
            <p className="text-sm text-slate-500 max-w-xs">
              Agrega la primera pieza con el botón{' '}
              <strong className="text-indigo-400">Nueva Refacción</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Table (Client Component) ─────────────────────────────────── */}
      <InventoryTable parts={parts} />
    </div>
  )
}
