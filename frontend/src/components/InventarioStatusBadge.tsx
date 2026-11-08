import type { StatusInventario } from '../types'

const ESTILOS: Record<StatusInventario, { rotulo: string; classe: string }> = {
  ABERTO: { rotulo: 'Em contagem', classe: 'bg-amber-500/15 text-amber-400' },
  CONCLUIDO: { rotulo: 'Concluído', classe: 'bg-brand-accent/15 text-brand-accent' },
}

export function InventarioStatusBadge({ status }: { status: StatusInventario }) {
  const { rotulo, classe } = ESTILOS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${classe}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {rotulo}
    </span>
  )
}
