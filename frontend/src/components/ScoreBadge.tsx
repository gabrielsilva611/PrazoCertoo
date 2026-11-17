import type { Score } from '../types'

const ESTILOS: Record<Score, { rotulo: string; classe: string }> = {
  BOM_PAGADOR: { rotulo: 'Bom Pagador', classe: 'bg-emerald-50 text-emerald-700' },
  IRREGULAR: { rotulo: 'Irregular', classe: 'bg-amber-50 text-amber-700' },
  INADIMPLENTE: { rotulo: 'Inadimplente', classe: 'bg-red-50 text-red-700' },
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
