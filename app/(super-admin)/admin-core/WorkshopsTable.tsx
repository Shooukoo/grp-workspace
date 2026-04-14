'use client'

import { useState, useEffect, useRef } from 'react'
import { Building2, Sparkles, Crown, Zap, Hash, Calendar, MoreHorizontal, Pencil, Eye, Ban, Trash2 } from 'lucide-react'
import EditTenantModal, { type WorkshopForEdit } from './EditTenantModal'
import WorkshopDetailPanel from './WorkshopDetailPanel'
import ConfirmDialog from './ConfirmDialog'
import { blockTenantAction, deleteTenantAction } from '@/app/actions/superadmin'

type Plan = 'basic' | 'pro' | 'enterprise'

const PLAN_CONFIG: Record<Plan, { label: string; icon: React.ElementType; classes: string }> = {
  basic:      { label: 'Básico',     icon: Zap,      classes: 'bg-slate-500/10  border-slate-500/25 text-slate-400'  },
  pro:        { label: 'Pro',        icon: Sparkles, classes: 'bg-violet-500/15 border-violet-500/30 text-violet-300' },
  enterprise: { label: 'Enterprise', icon: Crown,    classes: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' },
}

const STATUS_STYLE: Record<string, string> = {
  active:   'text-emerald-400',
  trialing: 'text-amber-400',
  canceled: 'text-red-400',
}
const STATUS_LABEL: Record<string, string> = {
  active:   'Activo',
  trialing: 'En prueba',
  canceled: 'Cancelado',
}

function PlanBadge({ plan }: { plan: Plan | null }) {
  const key = (plan ?? 'basic') as Plan
  const cfg = PLAN_CONFIG[key] ?? PLAN_CONFIG.basic
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.classes}`}>
      <Icon size={10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function daysLeft(iso: string | null): string {
  if (!iso) return ''
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days < 0)   return `${Math.abs(days)}d vencida`
  if (days === 0) return 'hoy'
  return `${days}d`
}

interface Props {
  workshops: WorkshopForEdit[]
}

interface MenuPos { top: number; right: number }

export default function WorkshopsTable({ workshops }: Props) {
  const [detailWorkshop,  setDetailWorkshop]  = useState<WorkshopForEdit | null>(null)
  const [editingWorkshop, setEditingWorkshop] = useState<WorkshopForEdit | null>(null)
  const [blockingWorkshop, setBlockingWorkshop] = useState<WorkshopForEdit | null>(null)
  const [deletingWorkshop, setDeletingWorkshop] = useState<WorkshopForEdit | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<MenuPos>({ top: 0, right: 0 })
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openMenuId) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    // Also close on scroll so the fixed dropdown doesn't drift
    function handleScroll() { setOpenMenuId(null) }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [openMenuId])

  /** Open edit from the detail panel without stacking two modals */
  function handleEditFromDetail() {
    setEditingWorkshop(detailWorkshop)
    setDetailWorkshop(null)
  }

  return (
    <>
      {workshops.length === 0 ? (
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
                  { label: 'Nombre',   icon: Building2 },
                  { label: 'Plan',     icon: Sparkles  },
                  { label: 'Estado',   icon: Zap       },
                ].map(({ label, icon: Icon }) => (
                  <th key={label} className="px-5 py-3 text-[10px] font-mono font-semibold uppercase tracking-widest text-white/25">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon size={11} />
                      {label}
                    </span>
                  </th>
                ))}
                {/* Vence — hidden on mobile */}
                <th className="px-5 py-3 text-[10px] font-mono font-semibold uppercase tracking-widest text-white/25 hidden md:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={11} />
                    Vence
                  </span>
                </th>
                {/* ID — hidden on mobile */}
                <th className="px-5 py-3 text-[10px] font-mono font-semibold uppercase tracking-widest text-white/25 hidden md:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <Hash size={11} />
                    ID
                  </span>
                </th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {workshops.map((w) => {
                const isExpired = w.subscription_end_date
                  ? new Date(w.subscription_end_date) < new Date()
                  : false

                return (
                  <tr
                    key={w.id}
                    className="group hover:bg-white/[0.025] transition-colors cursor-pointer"
                    onClick={() => setDetailWorkshop(w)}
                  >
                    {/* Name */}
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity"
                        onClick={() => setDetailWorkshop(w)}
                      >
                        <div className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <Building2 size={13} className="text-red-400" />
                        </div>
                        <span className="font-medium text-white">{w.name}</span>
                      </button>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-4">
                      <PlanBadge plan={w.subscription_plan as Plan | null} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold ${STATUS_STYLE[w.subscription_status ?? ''] ?? 'text-white/30'}`}>
                        {STATUS_LABEL[w.subscription_status ?? ''] ?? w.subscription_status ?? '—'}
                      </span>
                    </td>

                    {/* End date — hidden on mobile */}
                    <td className={`px-5 py-4 text-xs tabular-nums whitespace-nowrap hidden md:table-cell`}>
                      <span className={isExpired ? 'text-red-400 font-semibold' : 'text-white/30'}>
                        {formatDate(w.subscription_end_date)}
                      </span>
                      {w.subscription_end_date && (
                        <span className={`ml-2 text-[10px] font-mono ${isExpired ? 'text-red-500' : 'text-white/20'}`}>
                          ({daysLeft(w.subscription_end_date)})
                        </span>
                      )}
                    </td>

                    {/* UUID short — hidden on mobile */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="font-mono text-[11px] text-white/30 group-hover:text-white/50 transition-colors">
                        {w.id.slice(0, 8)}…
                      </span>
                    </td>

                    {/* 3-dot actions */}
                    <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          title="Acciones"
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                            setMenuPos({
                              top: rect.bottom + 6,
                              right: window.innerWidth - rect.right,
                            })
                            setOpenMenuId(openMenuId === w.id ? null : w.id)
                          }}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-white/20 hover:text-white/60 hover:bg-white/8 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Fixed-position dropdown (escapes all overflow containers) ── */}
      {openMenuId !== null && (() => {
        const w = workshops.find((x) => x.id === openMenuId)
        if (!w) return null
        return (
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
            className="min-w-[165px] rounded-xl border border-white/10 bg-[#111] shadow-2xl shadow-black/60 py-1"
          >
            <button
              onClick={() => { setDetailWorkshop(w); setOpenMenuId(null) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Eye size={12} /> Ver Detalles
            </button>
            <button
              onClick={() => { setEditingWorkshop(w); setOpenMenuId(null) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Pencil size={12} /> Editar Taller
            </button>
            <div className="my-1 h-px bg-white/8" />
            <button
              onClick={() => { setBlockingWorkshop(w); setOpenMenuId(null) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/5 transition-colors"
            >
              <Ban size={12} /> Bloquear Acceso
            </button>
            <button
              onClick={() => { setDeletingWorkshop(w); setOpenMenuId(null) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-500/80 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <Trash2 size={12} /> Eliminar Taller
            </button>
          </div>
        )
      })()}

      {/* Detail side panel */}
      {detailWorkshop && (
        <WorkshopDetailPanel
          workshop={detailWorkshop}
          onClose={() => setDetailWorkshop(null)}
          onEdit={handleEditFromDetail}
        />
      )}

      {/* Edit modal */}
      {editingWorkshop && (
        <EditTenantModal
          workshop={editingWorkshop}
          onClose={() => setEditingWorkshop(null)}
        />
      )}

      {/* Block confirmation */}
      {blockingWorkshop && (
        <ConfirmDialog
          title="Bloquear acceso al taller"
          description="El taller quedará suspendido de inmediato. Sus usuarios verán una pantalla de cuenta bloqueada hasta que lo reactives manualmente."
          confirmLabel="Sí, bloquear"
          confirmClass="bg-amber-600 hover:bg-amber-500"
          workshopId={blockingWorkshop.id}
          workshopName={blockingWorkshop.name}
          action={blockTenantAction}
          onClose={() => setBlockingWorkshop(null)}
        />
      )}

      {/* Delete confirmation */}
      {deletingWorkshop && (
        <ConfirmDialog
          title="Eliminar taller permanentemente"
          description="Esta acción es irreversible. Se eliminará el taller y todos sus datos del sistema. Los usuarios de Supabase Auth deben eliminarse por separado."
          confirmLabel="Sí, eliminar"
          confirmClass="bg-red-600 hover:bg-red-500"
          workshopId={deletingWorkshop.id}
          workshopName={deletingWorkshop.name}
          action={deleteTenantAction}
          onClose={() => setDeletingWorkshop(null)}
        />
      )}
    </>
  )
}
