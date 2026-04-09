import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Building2, ShieldAlert, Calendar, Hash } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import NewTenantButton from './NewTenantButton'

export const metadata: Metadata = {
  title: 'Admin Core | RepairLab',
}

// Server-side guard (redundant with proxy.ts — defence in depth).
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? ''

interface Workshop {
  id: string
  name: string
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminCorePage() {
  // ── 1. Super-admin guard (server-side) ────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  // ── 2. Fetch all workshops via admin client (bypasses RLS) ─────────────
  const { data: workshops, error } = await supabaseAdmin
    .from('workshops')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  const rows: Workshop[] = (workshops as Workshop[]) ?? []

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={18} className="text-red-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Centro de Mando
            </h1>
          </div>
          <p className="text-xs text-white/30 font-mono">
            {rows.length} taller{rows.length !== 1 ? 'es' : ''} registrado{rows.length !== 1 ? 's' : ''}
            &nbsp;·&nbsp;
            Sesión: <span className="text-white/50">{user.email}</span>
          </p>
        </div>

        <NewTenantButton />
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-5 py-4 text-xs text-red-400 font-mono">
          Error al cargar talleres: {error.message}
        </div>
      )}

      {/* ── Workshops table ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">

        {/* Table header */}
        <div className="px-5 py-3 border-b border-white/8 bg-white/[0.02]">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-white/20">
            Talleres registrados
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Building2 size={22} className="text-white/20" />
            </div>
            <p className="text-sm text-white/40">No hay talleres aún.</p>
            <p className="text-xs text-white/20">Crea el primero con el botón de arriba.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/8">
                  {[
                    { label: 'Nombre',          icon: Building2  },
                    { label: 'ID (UUID)',        icon: Hash       },
                    { label: 'Fecha de Creación', icon: Calendar  },
                  ].map(({ label, icon: Icon }) => (
                    <th
                      key={label}
                      className="px-5 py-3 text-[10px] font-mono font-semibold uppercase tracking-widest text-white/25"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Icon size={11} />
                        {label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((w) => (
                  <tr
                    key={w.id}
                    className="group hover:bg-white/[0.025] transition-colors"
                  >
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <Building2 size={13} className="text-red-400" />
                        </div>
                        <span className="font-medium text-white">{w.name}</span>
                      </div>
                    </td>

                    {/* UUID */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-[11px] text-white/35 group-hover:text-white/55 transition-colors select-all">
                        {w.id}
                      </span>
                    </td>

                    {/* Created at */}
                    <td className="px-5 py-4 text-xs text-white/30 tabular-nums whitespace-nowrap">
                      {formatDate(w.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-white/15 font-mono">
        ZONA RESTRINGIDA — Acceso exclusivo para administradores del sistema.
      </p>
    </div>
  )
}
