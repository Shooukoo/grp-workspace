'use client'

import { useFormStatus } from 'react-dom'
import { signOutAction } from '@/app/actions/auth'
import { LogOut, Loader2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="
        flex items-center gap-2 rounded-lg px-3 py-1.5
        text-sm text-slate-400
        transition-all duration-200
        hover:bg-red-500/10 hover:text-red-400
        disabled:opacity-50 disabled:cursor-not-allowed
      "
      aria-label="Cerrar sesión"
    >
      {pending ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <LogOut size={15} />
      )}
      {pending ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}

export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton />
    </form>
  )
}
