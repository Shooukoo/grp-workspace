import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import NewTenantButton from './NewTenantButton'
import WorkshopsTable from './WorkshopsTable'
import type { WorkshopForEdit } from './EditTenantModal'

export const metadata: Metadata = {
  title: 'Admin Core | RepairLab',
}

// Server-side guard (redundant with proxy.ts — defence in depth).
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? ''

export default async function AdminCorePage() {
  // ── 1. Super-admin guard ───────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  // ── 2. Fetch all workshops (bypasses RLS) ──────────────────────────────
  const { data: workshops, error } = await supabaseAdmin
    .from('workshops')
    .select('id, name, phone, address, subscription_plan, subscription_status, subscription_end_date, created_at')
    .order('created_at', { ascending: false })

  const rows: WorkshopForEdit[] = (workshops as WorkshopForEdit[]) ?? []

  return (
    <div className="space-y-4 md:space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={18} className="text-red-400 shrink-0" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Centro de Mando
            </h1>
          </div>
          <p className="text-xs text-white/30 font-mono truncate">
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

        {/* Table label */}
        <div className="px-5 py-3 border-b border-white/8 bg-white/[0.02]">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-white/20">
            Talleres registrados
          </p>
        </div>

        {/* Client component owns table state (edit modal) */}
        <WorkshopsTable workshops={rows} />
      </div>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-white/15 font-mono">
        ZONA RESTRINGIDA — Acceso exclusivo para administradores del sistema.
      </p>
    </div>
  )
}
