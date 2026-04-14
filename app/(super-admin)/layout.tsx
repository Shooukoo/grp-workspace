import type { Metadata } from 'next'
import { LogOut } from 'lucide-react'
import { signOutAction } from '@/app/actions/auth'

export const metadata: Metadata = {
  title: 'Admin Core | RepairLab',
  robots: { index: false, follow: false }, // never index this panel
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ── Top navbar ─────────────────────────────────────────────────── */}
      <header className="h-12 flex items-center gap-3 px-4 md:px-6 border-b border-white/8 shrink-0 select-none">
        {/* Red dot — visual cue that this is a privileged zone */}
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
        <span className="text-[11px] font-mono font-semibold tracking-widest text-red-400 uppercase">
          Admin Core
        </span>
        <span className="ml-auto hidden sm:block text-[10px] text-white/20 font-mono">
          RepairLab Superadmin
        </span>

        {/* Logout button */}
        <form action={signOutAction} className="shrink-0">
          <button
            type="submit"
            aria-label="Cerrar sesión"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 border border-transparent hover:border-red-500/20"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </form>
      </header>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
