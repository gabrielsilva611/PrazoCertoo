import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  titulo: string
  onFechar: () => void
  children: ReactNode
}

export function Modal({ titulo, onFechar, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(evento) => evento.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-brand-border bg-brand-surface p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-text">{titulo}</h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-md p-1 text-brand-muted transition hover:bg-brand-bg hover:text-brand-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
