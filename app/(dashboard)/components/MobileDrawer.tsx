'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Zap, LogOut } from 'lucide-react'
import { NAV_ITEMS } from './Sidebar'
import LogoutButton from './LogoutButton'

/* ─── Mobile Header (hamburger bar) ──────────────────────────────────────── */
export function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer when route changes
  const pathname = usePathname()
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const close = useCallback(() => setDrawerOpen(false), [])

  return (
    <>
      {/* ── Top bar — only visible on mobile ──────────────────────────── */}
      <header className="flex md:hidden h-14 items-center justify-between px-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md shrink-0 sticky top-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={13} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight leading-none">RepairLab</p>
            <p className="text-[9px] text-slate-500 leading-none mt-0.5">Enterprise</p>
          </div>
        </div>

        {/* Hamburger button */}
        <button
          id="mobile-menu-btn"
          type="button"
          aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(v => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all duration-150 active:scale-95"
        >
          {drawerOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* ── Drawer overlay ────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`
          fixed inset-0 z-40 md:hidden
          bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Drawer panel */}
      <aside
        id="mobile-drawer"
        aria-label="Menú de navegación"
        className={`
          fixed inset-y-0 left-0 z-50 md:hidden
          w-72 flex flex-col
          bg-slate-900 border-r border-white/5
          shadow-2xl shadow-black/60
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Drawer header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap size={13} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight leading-none">RepairLab</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5">Enterprise</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menú"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation links */}
        <DrawerNav />

        {/* Footer / logout */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <LogoutButton />
          <p className="text-[10px] text-slate-700 text-center">RepairLab v0.1 · Multi-tenant SaaS</p>
        </div>
      </aside>
    </>
  )
}

/* ─── Nav links (Client — needs usePathname) ─────────────────────────────── */
function DrawerNav() {
  const pathname = usePathname()

  return (
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
              flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium
              transition-all duration-150
              ${isActive
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }
            `}
          >
            <Icon
              size={17}
              className={isActive ? 'text-indigo-400' : 'text-slate-500'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
