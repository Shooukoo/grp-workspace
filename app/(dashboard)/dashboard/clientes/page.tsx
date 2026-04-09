import type { Metadata } from 'next'
import { Users, Smartphone } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import NewCustomerButton from './NewCustomerButton'

export const metadata: Metadata = {
  title: 'Directorio de Clientes | GRP Workspace',
  description: 'Gestiona el directorio de clientes de tu taller de reparación.',
}

interface Customer {
  id: string
  full_name: string
  whatsapp: string | null
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, full_name, whatsapp, created_at')
    .order('created_at', { ascending: false })

  const rows: Customer[] = customers ?? []

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users size={22} className="text-indigo-400" />
            Directorio de Clientes
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {rows.length > 0
              ? `${rows.length} cliente${rows.length !== 1 ? 's' : ''} registrado${rows.length !== 1 ? 's' : ''}`
              : 'Aún no hay clientes registrados.'}
          </p>
        </div>
        <NewCustomerButton />
      </div>

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <strong>Error al cargar clientes:</strong> {error.message}
        </div>
      )}

      {/* ── Table card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <Users size={28} className="text-indigo-400" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-white">Sin clientes todavía</p>
              <p className="text-sm text-slate-500 max-w-xs">
                Agrega tu primer cliente con el botón{' '}
                <strong className="text-indigo-400">Nuevo Cliente</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {['Nombre', 'Teléfono / WhatsApp', 'Fecha de Registro'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((customer) => (
                  <tr key={customer.id} className="group transition-colors hover:bg-white/[0.03]">
                    {/* Nombre */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white select-none shadow-lg shadow-indigo-500/20">
                          {customer.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                        </span>
                        <span className="font-medium text-slate-100">{customer.full_name}</span>
                      </div>
                    </td>

                    {/* Teléfono */}
                    <td className="px-5 py-4">
                      {customer.whatsapp ? (
                        <a
                          href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Smartphone size={13} />
                          {customer.whatsapp}
                        </a>
                      ) : (
                        <span className="text-slate-600 text-xs italic">Sin teléfono</span>
                      )}
                    </td>

                    {/* Fecha */}
                    <td className="px-5 py-4 text-slate-500 tabular-nums text-xs">
                      {formatDate(customer.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
