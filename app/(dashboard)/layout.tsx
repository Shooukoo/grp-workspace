import type { Metadata } from 'next'
import Sidebar from '@/app/(dashboard)/components/Sidebar'
import LogoutButton from '@/app/(dashboard)/components/LogoutButton'

export const metadata: Metadata = {
  title: 'GRP Workspace',
  description: 'Panel de gestión de talleres de reparación electrónica.',
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex bg-[#080b14]">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md shrink-0">
          <p className="text-sm text-slate-500">Panel de control</p>
          <LogoutButton />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
