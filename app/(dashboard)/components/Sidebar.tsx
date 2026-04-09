'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Wrench,
  UserCog,
  Zap,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Inicio'     },
  { href: '/dashboard/clientes',  icon: Users,           label: 'Clientes'   },
  { href: '/dashboard/ordenes',   icon: Wrench,          label: 'Órdenes'    },
  { href: '/dashboard/empleados', icon: UserCog,         label: 'Empleados'  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-slate-900/60 backdrop-blur-xl border-r border-white/5">
      {/* ── Logo ────────────────────────────────────────────────────── */}
      <div className="h-16 flex items-center px-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight leading-none">RepairLab</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Enterprise</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all duration-150
                ${isActive
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <Icon
                size={16}
                className={isActive ? 'text-indigo-400' : 'text-slate-500'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-white/5">
        <p className="text-[11px] text-slate-600">RepairLab v0.1 · Multi-tenant SaaS</p>
      </div>
    </aside>
  )
}
