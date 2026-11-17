import type { ReactNode } from 'react'

export interface Estatistica {
  rotulo: string
  valor: ReactNode
  destaque?: 'padrao' | 'amber' | 'red' | 'accent'
}

const CORES = {
  padrao: 'text-brand-text',
  amber: 'text-amber-700',
  red: 'text-red-600',
  accent: 'text-brand-accent',
} as const

// Faixa única tipo "extrato", em vez de vários cards soltos repetindo o mesmo
// molde — além de evitar duplicar esse bloco em cada página, se parece mais
// com um resumo financeiro de verdade do que com um grid genérico de KPIs.
export function EstatisticasFaixa({ itens }: { itens: Estatistica[] }) {
  return (
    <div className="mt-6 flex divide-x divide-brand-border overflow-x-auto rounded-lg border border-brand-border bg-brand-surface">
      {itens.map((item) => (
        <div key={item.rotulo} className="min-w-[160px] flex-1 shrink-0 px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-brand-muted">{item.rotulo}</p>
          <p className={`mt-1 font-display text-2xl ${CORES[item.destaque ?? 'padrao']}`}>{item.valor}</p>
        </div>
      ))}
    </div>
  )
}
