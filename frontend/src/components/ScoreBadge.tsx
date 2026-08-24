import type { Score } from '../types'

const ESTILOS: Record<Score, { rotulo: string; classe: string }> = {
  BOM_PAGADOR: { rotulo: 'Bom Pagador', classe: 'bg-brand-accent/15 text-brand-accent' },
  IRREGULAR: { rotulo: 'Irregular', classe: 'bg-amber-500/15 text-amber-400' },
  INADIMPLENTE: { rotulo: 'Inadimplente', classe: 'bg-red-500/15 text-red-400' },
}

export function ScoreBadge({ score }: { score: Score }) {
  const { rotulo, classe } = ESTILOS[score]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${classe}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {rotulo}
    </span>
  )
}
