import type { ReactNode } from 'react'

interface FormFieldProps {
  rotulo: string
  id: string
  obrigatorio?: boolean
  children: ReactNode
}

export function FormField({ rotulo, id, obrigatorio, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs uppercase tracking-wide text-brand-muted">
        {rotulo} {obrigatorio && <span className="text-brand-accent">*</span>}
      </label>
      {children}
    </div>
  )
}

export const estiloInput =
  'mt-1 w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-accent'
