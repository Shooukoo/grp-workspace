'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction, type LoginState } from '@/app/actions/auth'
import { useSearchParams } from 'next/navigation'

// ---------------------------------------------------------------------------
// Submit button — uses useFormStatus to read the pending state of the parent
// <form> without prop-drilling.
// ---------------------------------------------------------------------------
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      id="login-submit-btn"
      className={`
        relative w-full flex items-center justify-center gap-2
        rounded-xl px-4 py-3 text-sm font-semibold text-white
        bg-gradient-to-r from-indigo-600 to-violet-600
        hover:from-indigo-500 hover:to-violet-500
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-indigo-500
        shadow-lg shadow-indigo-500/30
        transition-all duration-200 ease-out
        disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
      `}
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          />
          Iniciando sesión…
        </>
      ) : (
        'Iniciar sesión'
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
const initialState: LoginState = { error: null }

export default function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [state, formAction] = useActionState(loginAction, initialState)

  return (
    <form
      action={formAction}
      noValidate
      className="space-y-5"
      aria-label="Formulario de inicio de sesión"
    >
      {/* Hidden field carries the intended destination */}
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {/* Error banner */}
      {state.error && (
        <div
          role="alert"
          aria-live="assertive"
          id="login-error-banner"
          className="
            flex items-start gap-3 rounded-xl border border-red-500/30
            bg-red-500/10 px-4 py-3 text-sm text-red-400
          "
        >
          {/* Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-xs font-medium uppercase tracking-wider text-slate-400"
        >
          Correo electrónico
        </label>
        <input
          id="login-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="tu@empresa.com"
          className="
            w-full rounded-xl border border-white/10
            bg-white/5 px-4 py-3 text-sm text-slate-100
            placeholder:text-slate-500 placeholder:transition-opacity placeholder:duration-200
            focus:placeholder-transparent
            outline-none ring-0
            transition-all duration-150
            focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50
          "
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="block text-xs font-medium uppercase tracking-wider text-slate-400"
        >
          Contraseña
        </label>
        <input
          id="login-password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="
            w-full rounded-xl border border-white/10
            bg-white/5 px-4 py-3 text-sm text-slate-100
            placeholder:text-slate-500 placeholder:transition-opacity placeholder:duration-200
            focus:placeholder-transparent
            outline-none ring-0
            transition-all duration-150
            focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50
          "
        />
      </div>

      <SubmitButton />
    </form>
  )
}
