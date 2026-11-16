import { describe, expect, it } from 'vitest'
import { calcularParcelasPrevia } from './parcelaPreview'

describe('calcularParcelasPrevia', () => {
  it('divide o valor em parcelas iguais quando a divisão é exata', () => {
    const parcelas = calcularParcelasPrevia(300, 3, new Date('2026-01-01'))
    expect(parcelas.map((p) => p.valor)).toEqual([100, 100, 100])
  })

  it('a última parcela absorve o resto da divisão (não exata)', () => {
    const parcelas = calcularParcelasPrevia(680, 3, new Date('2026-01-01'))
    expect(parcelas.map((p) => p.valor)).toEqual([226.67, 226.67, 226.66])
  })

  it('espaça os vencimentos pelo intervalo de dias informado', () => {
    const parcelas = calcularParcelasPrevia(200, 2, new Date('2026-01-01T00:00:00Z'), 30)
    expect(parcelas[0].vencimento.getTime()).toBe(new Date('2026-01-01T00:00:00Z').getTime())
    expect(parcelas[1].vencimento.getTime()).toBe(new Date('2026-01-31T00:00:00Z').getTime())
  })

  it('numera as parcelas a partir de 1', () => {
    const parcelas = calcularParcelasPrevia(300, 3, new Date('2026-01-01'))
    expect(parcelas.map((p) => p.numero)).toEqual([1, 2, 3])
  })

  it('retorna vazio quando faltam dados (valor, parcelas ou data inválida)', () => {
    expect(calcularParcelasPrevia(0, 3, new Date('2026-01-01'))).toEqual([])
    expect(calcularParcelasPrevia(300, 0, new Date('2026-01-01'))).toEqual([])
    expect(calcularParcelasPrevia(300, 3, new Date('data-invalida'))).toEqual([])
  })
})
