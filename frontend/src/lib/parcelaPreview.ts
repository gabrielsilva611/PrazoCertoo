// Espelha backend/src/lib/parcelaUtil.js — mesma regra de arredondamento
// (a última parcela absorve o resto), só que sem hora, direto no navegador.

export interface ParcelaPrevia {
  numero: number
  valor: number
  vencimento: Date
}

export function calcularParcelasPrevia(
  valorTotal: number,
  numParcelas: number,
  dataInicio: Date,
  intervaloDias = 30,
): ParcelaPrevia[] {
  if (!valorTotal || !numParcelas || Number.isNaN(dataInicio.getTime())) return []

  const totalCentavos = Math.round(valorTotal * 100)
  const baseCentavos = Math.round(totalCentavos / numParcelas)
  const restoCentavos = totalCentavos - baseCentavos * numParcelas

  return Array.from({ length: numParcelas }, (_, indice) => {
    const numero = indice + 1
    const centavos = numero === numParcelas ? baseCentavos + restoCentavos : baseCentavos
    const vencimento = new Date(dataInicio.getTime() + indice * intervaloDias * 86_400_000)
    return { numero, valor: centavos / 100, vencimento }
  })
}
