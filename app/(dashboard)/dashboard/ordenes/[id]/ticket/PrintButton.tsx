'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2
        rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white
        shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 active:scale-95
        transition-all duration-200"
    >
      🖨️ Imprimir
    </button>
  )
}
