import type { TipoMovimentacao } from '../types'

const ESTILOS: Record<TipoMovimentacao, { rotulo: string; classe: string }> = {
  ENTRADA: { rotulo: 'Entrada', classe: 'bg-brand-accent/10 text-brand-accent' },
  SAIDA: { rotulo: 'Saída', classe: 'bg-red-50 text-red-700' },
  AJUSTE: { rotulo: 'Ajuste', classe: 'bg-amber-50 text-amber-700' },
  INVENTARIO: { rotulo: 'Inventário', classe: 'bg-blue-50 text-blue-700' },
}

export function MovimentacaoBadge({ tipo }: { tipo: TipoMovimentacao }) {
  const { rotulo, classe } = ESTILOS[tipo]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classe}`}>
      {rotulo}
    </span>
  )
}
