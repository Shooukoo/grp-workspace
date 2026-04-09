import type { Metadata } from 'next'
import { UserCog, Plus, AlertTriangle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import NewEmployeeButton from './NewEmployeeButton'

export const metadata: Metadata = {
  title: 'Empleados | GRP Workspace',
  description: 'Gestiona los empleados de tu taller de reparación.',
}

type EmployeeRole = 'admin' | 'technician' | 'receptionist'

interface Employee {
  id: string
  full_name: string
  role: EmployeeRole
  created_at: string
}

const ROLE_CONFIG: Record<EmployeeRole, { label: string; classes: string }> = {
  admin:        { label: 'Administrador', classes: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  technician:   { label: 'Técnico',       classes: 'bg-blue-500/10   text-blue-400   border-blue-500/20'   },
  receptionist: { label: 'Recepcionista', classes: 'bg-teal-500/10   text-teal-400   border-teal-500/20'   },
}

function RoleBadge({ role }: { role: EmployeeRole }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.technician
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default async function EmpleadosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user?.id ?? '')
    .single()

  const { data: employees, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('workshop_id', myProfile?.workshop_id ?? '')
    .order('created_at', { ascending: true })

  const rows: Employee[] = (employees as Employee[]) ?? []

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UserCog size={22} className="text-indigo-400" />
            Gestión de Empleados
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {rows.length > 0
              ? `${rows.length} miembro${rows.length !== 1 ? 's' : ''} del taller`
              : 'Aún no hay empleados registrados.'}
          </p>
        </div>
        <NewEmployeeButton />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <strong>Error al cargar empleados:</strong> {error.message}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <UserCog size={28} className="text-indigo-400" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-white">Sin empleados todavía</p>
              <p className="text-sm text-slate-500 max-w-xs">
                Agrega el primer miembro del equipo con{' '}
                <strong className="text-indigo-400">Nuevo Empleado</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {['Empleado', 'Rol', 'Fecha de Alta'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((emp) => {
                  const initials = (emp.full_name ?? '?').split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                  return (
                    <tr key={emp.id} className="group transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white select-none shadow-lg shadow-indigo-500/20">
                            {initials}
                          </span>
                          <span className="font-medium text-slate-100">{emp.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <RoleBadge role={emp.role} />
                      </td>
                      <td className="px-5 py-4 text-slate-500 tabular-nums text-xs">
                        {formatDate(emp.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Info callout ───────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/5 px-5 py-4 text-sm text-amber-400/80">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
        <span>
          Las cuentas de empleado se crean con acceso inmediato. Comparte las credenciales de forma segura.
        </span>
      </div>
    </div>
  )
}
