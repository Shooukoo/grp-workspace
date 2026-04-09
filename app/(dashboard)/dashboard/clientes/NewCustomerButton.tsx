'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy-load the modal so it's not part of the initial SSR bundle
const AddCustomerModal = dynamic(() => import('./AddCustomerModal'), { ssr: false })

export default function NewCustomerButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        id="new-customer-btn"
        type="button"
        onClick={() => setIsOpen(true)}
        className="
          inline-flex items-center gap-2
          rounded-xl
          bg-gradient-to-r from-indigo-600 to-purple-600
          px-5 py-2.5 text-sm font-semibold text-white
          shadow-lg shadow-indigo-500/30
          transition-all duration-200
          hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/50 hover:-translate-y-px
          active:translate-y-0
        "
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo Cliente
      </button>

      <AddCustomerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
