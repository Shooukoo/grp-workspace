'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateTenantModal from './CreateTenantModal'

export default function NewTenantButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        id="new-tenant-btn"
        onClick={() => setOpen(true)}
        className="
          inline-flex items-center gap-2 rounded-xl
          bg-red-600 hover:bg-red-500 active:scale-95
          px-5 py-2.5 text-sm font-semibold text-white
          shadow-lg shadow-red-500/20
          transition-all duration-150 whitespace-nowrap
        "
      >
        <Plus size={15} strokeWidth={2.5} />
        Crear Nuevo Taller
      </button>

      {open && <CreateTenantModal onClose={() => setOpen(false)} />}
    </>
  )
}
