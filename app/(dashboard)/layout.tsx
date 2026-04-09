import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, MessageCircle, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { signOutAction } from '@/app/actions/auth'
import Sidebar from '@/app/(dashboard)/components/Sidebar'
import LogoutButton from '@/app/(dashboard)/components/LogoutButton'

export const metadata: Metadata = {
  title: 'GRP Workspace',
  description: 'Panel de gestión de talleres de reparación electrónica.',
}

// WhatsApp number the tenant contacts to renew (replace with your real number)
const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP_NUMBER ?? '521XXXXXXXXXX'

/**
 * Checks whether a workshop's subscription is still valid.
 * Returns true when the dashboard should be BLOCKED.
 */
function isExpired(
  status: string | null,
  endDate: string | null,
): boolean {
  if (status === 'canceled') return true
  if (!endDate) return false           // no end date = never expires
  return new Date(endDate) < new Date()
}

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // ── 1. Auth ───────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── 2. Super-admin is always exempt from subscription checks ──────────
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? ''
  if (user?.email === superAdminEmail) {
    return <NormalLayout>{children}</NormalLayout>
  }

  // ── 3. Look up this user's workshop subscription via their profile ─────
  let blocked = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('workshop_id')
      .eq('id', user.id)
      .single()

    if (profile?.workshop_id) {
      const { data: workshop } = await supabaseAdmin
        .from('workshops')
        .select('subscription_status, subscription_end_date')
        .eq('id', profile.workshop_id)
        .single()

      blocked = isExpired(
        workshop?.subscription_status ?? null,
        workshop?.subscription_end_date ?? null,
      )
    }
  }

  if (blocked) {
    return <ExpiredScreen />
  }

  return <NormalLayout>{children}</NormalLayout>
}

/* ─── Normal dashboard shell ──────────────────────────────────────────────── */
function NormalLayout({ children }: { children: React.ReactNode }) {
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

/* ─── Expired / blocked screen ────────────────────────────────────────────── */
function ExpiredScreen() {
  const waUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    'Hola, me gustaría renovar mi suscripción a RepairLab Enterprise.',
  )}`

  return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center p-6">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={36} className="text-red-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Suscripción Expirada
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            El acceso de tu taller a{' '}
            <span className="text-white font-medium">RepairLab Enterprise</span>{' '}
            ha sido pausado por falta de pago o fin de periodo de prueba.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center justify-center gap-2.5 w-full
              rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95
              px-6 py-3 text-sm font-semibold text-white
              shadow-lg shadow-emerald-500/20
              transition-all duration-150
            "
          >
            <MessageCircle size={17} strokeWidth={2} />
            Contactar a Soporte para Renovar
          </Link>

          {/* Secondary: sign out properly */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] px-6 py-2.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <LogOut size={13} />
              Cerrar sesión
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-slate-700">
          ¿Crees que esto es un error?{' '}
          <Link href={waUrl} target="_blank" className="text-slate-500 hover:text-slate-300 underline transition-colors">
            Contáctanos
          </Link>
        </p>
      </div>
    </div>
  )
}
