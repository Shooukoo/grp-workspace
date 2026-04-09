'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type LoginState = {
  error: string | null
}

/**
 * Server Action: signs the user in with email + password.
 * On success   → redirects to /dashboard (or the `redirectTo` param).
 * On failure   → returns the error message so the form can display it.
 */
export async function loginAction(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard'

  // Basic presence check — the HTML5 `required` attribute handles most cases,
  // but we guard here too since Server Actions can be called programmatically.
  if (!email || !password) {
    return { error: 'Por favor completa todos los campos.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Map Supabase errors to user-friendly Spanish messages.
    if (
      error.message.toLowerCase().includes('invalid login credentials') ||
      error.message.toLowerCase().includes('invalid credentials')
    ) {
      return { error: 'Correo o contraseña incorrectos. Inténtalo de nuevo.' }
    }

    if (error.message.toLowerCase().includes('email not confirmed')) {
      return {
        error:
          'Tu cuenta no ha sido confirmada. Revisa tu correo electrónico.',
      }
    }

    return { error: error.message }
  }

  // Success — redirect CANNOT be caught here; throw it outside try/catch.
  redirect(redirectTo)
}

/**
 * Server Action: signs the current user out and redirects to /login.
 * Called from the LogoutButton Client Component via a minimal form.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

