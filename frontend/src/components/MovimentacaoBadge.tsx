import type { TipoMovimentacao } from '../types'

const ESTILOS: Record<TipoMovimentacao, { rotulo: string; classe: string }> = {
  ENTRADA: { rotulo: 'Entrada', classe: 'bg-brand-accent/15 text-brand-accent' },
  SAIDA: { rotulo: 'Saída', classe: 'bg-red-500/15 text-red-400' },
  AJUSTE: { rotulo: 'Ajuste', classe: 'bg-amber-500/15 text-amber-400' },
  INVENTARIO: { rotulo: 'Inventário', classe: 'bg-blue-500/15 text-blue-400' },
}

export function MovimentacaoBadge({ tipo }: { tipo: TipoMovimentacao }) {
  const { rotulo, classe } = ESTILOS[tipo]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classe}`}>
      {rotulo}
    </span>
  )
}
