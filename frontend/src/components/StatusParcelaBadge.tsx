import type { StatusParcela } from '../types'

const ESTILOS: Record<StatusParcela, { rotulo: string; classe: string }> = {
  ATRASADO: { rotulo: 'Atrasado', classe: 'bg-red-500/15 text-red-400' },
  PENDENTE: { rotulo: 'Pendente', classe: 'bg-amber-500/15 text-amber-400' },
  PAGO: { rotulo: 'Pago', classe: 'bg-brand-accent/15 text-brand-accent' },
}

export function StatusParcelaBadge({ status }: { status: StatusParcela }) {
  const { rotulo, classe } = ESTILOS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${classe}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {rotulo}
    </span>
  )
}
