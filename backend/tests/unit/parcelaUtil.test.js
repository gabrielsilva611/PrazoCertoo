const { calcularParcelas, statusParcela } = require('../../src/lib/parcelaUtil');

describe('calcularParcelas', () => {
  test('divide o valor igualmente quando é exato', () => {
    const parcelas = calcularParcelas(900, 3, new Date('2026-01-01T00:00:00Z'));

    expect(parcelas).toHaveLength(3);
    expect(parcelas.map((p) => p.valor)).toEqual([300, 300, 300]);
  });

  test('a última parcela absorve o arredondamento (regressão: bug encontrado no PR #4)', () => {
    // R$680 em 3x: 226,67 + 226,67 + 226,66 = 680,00 — igual ao mockup da Tela 5 do RFC.
    // Uma implementação com Math.floor em vez de Math.round gerava 226,66/226,66/226,68.
    const parcelas = calcularParcelas(680, 3, new Date('2026-06-05T00:00:00Z'));

    expect(parcelas.map((p) => p.valor)).toEqual([226.67, 226.67, 226.66]);
  });

  test('a soma das parcelas sempre bate com o valor total, mesmo em casos difíceis de arredondar', () => {
    const casos = [
      [100, 3],
      [999.99, 7],
      [10, 4],
      [0.3, 3],
    ];

    for (const [valorTotal, numParcelas] of casos) {
      const parcelas = calcularParcelas(valorTotal, numParcelas, new Date('2026-01-01T00:00:00Z'));
      const soma = parcelas.reduce((total, p) => total + p.valor, 0);
      expect(Math.round(soma * 100)).toBe(Math.round(valorTotal * 100));
    }
  });

  test('calcula os vencimentos a partir do intervalo informado', () => {
    const parcelas = calcularParcelas(300, 3, new Date('2026-01-01T00:00:00Z'), 15);

    expect(parcelas.map((p) => p.vencimento.toISOString().slice(0, 10))).toEqual([
      '2026-01-01',
      '2026-01-16',
      '2026-01-31',
    ]);
  });

  test('usa 30 dias como intervalo padrão quando não informado', () => {
    const parcelas = calcularParcelas(200, 2, new Date('2026-01-01T00:00:00Z'));

    expect(parcelas[1].vencimento.toISOString().slice(0, 10)).toBe('2026-01-31');
  });
});

describe('statusParcela', () => {
  const agora = new Date('2026-06-15T12:00:00Z');

  test('retorna PAGO quando a parcela tem pagoEm', () => {
    const parcela = { pagoEm: new Date('2026-06-10'), vencimento: new Date('2026-06-01') };
    expect(statusParcela(parcela, agora)).toBe('PAGO');
  });

  test('retorna ATRASADO quando não paga e o vencimento já passou (RN01)', () => {
    const parcela = { pagoEm: null, vencimento: new Date('2026-06-01') };
    expect(statusParcela(parcela, agora)).toBe('ATRASADO');
  });

  test('retorna PENDENTE quando não paga e o vencimento ainda não chegou', () => {
    const parcela = { pagoEm: null, vencimento: new Date('2026-07-01') };
    expect(statusParcela(parcela, agora)).toBe('PENDENTE');
  });
});
