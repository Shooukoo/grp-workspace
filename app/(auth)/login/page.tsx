import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from './_components/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión | GRP Workspace',
  description:
    'Accede a tu taller electrónico. Gestiona órdenes, clientes y reparaciones.',
}

/**
 * Login page — Server Component.
 * Renders the card shell (static) and lazily loads the interactive Client Form.
 * Suspense is required because LoginForm uses useSearchParams(), which needs
 * a client boundary with a suspense wrapper in Next.js App Router.
 */
export default function LoginPage() {
  return (
    <main
      id="login-page"
      className="w-full max-w-md"
    >
      {/* Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">

        {/* Logo / brand mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
            {/* Wrench icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6 text-white"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 6.75a5.25 5.25 0 0 1 6.775-5.025.75.75 0 0 1 .313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.641l3.318-3.319a.75.75 0 0 1 1.248.313 5.25 5.25 0 0 1-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 1 1 2.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0 1 12 6.75ZM4.117 19.125a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-white">
              GRP Workspace
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Sistema de gestión de órdenes de reparación
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-medium text-slate-500">
            Ingresa tus credenciales
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Form — wrapped in Suspense because it reads useSearchParams() */}
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-center text-xs text-slate-500">
        ¿Problemas para ingresar? Contacta al administrador del sistema.
      </p>
    </main>
  )
}

/** Minimal skeleton shown while the Client Component hydrates. */
function FormSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-3 w-32 rounded bg-white/10" />
        <div className="h-11 rounded-xl bg-white/5" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-11 rounded-xl bg-white/5" />
      </div>
      <div className="h-11 rounded-xl bg-indigo-600/40" />
    </div>
  )
}
