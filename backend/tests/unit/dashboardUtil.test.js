const { calcularIndicadores } = require('../../src/lib/dashboardUtil');

const AGORA = new Date('2026-06-15T12:00:00Z');

function parcela({ valor, diasDoVencimento, clienteId = 'cliente-1' }) {
  return {
    valor,
    vencimento: new Date(AGORA.getTime() + diasDoVencimento * 86_400_000),
    pagoEm: null,
    clienteId,
  };
}

describe('calcularIndicadores (RF16)', () => {
  test('sem parcelas em aberto, todos os indicadores ficam zerados', () => {
    const resultado = calcularIndicadores([], AGORA);

    expect(resultado.totalAReceber).toEqual({ valor: 0, quantidade: 0 });
    expect(resultado.emAtraso).toEqual({ valor: 0, clientes: 0 });
  });

  test('parcela atrasada conta em totalAReceber e emAtraso, não nas outras', () => {
    const resultado = calcularIndicadores([parcela({ valor: 100, diasDoVencimento: -5 })], AGORA);

    expect(resultado.totalAReceber).toEqual({ valor: 100, quantidade: 1 });
    expect(resultado.emAtraso).toEqual({ valor: 100, clientes: 1 });
    expect(resultado.vencimentosHoje.quantidade).toBe(0);
    expect(resultado.vencimentosProximos7Dias.quantidade).toBe(0);
  });

  test('parcela que vence hoje conta em vencimentosHoje, não em atraso', () => {
    const resultado = calcularIndicadores([parcela({ valor: 50, diasDoVencimento: 0 })], AGORA);

    expect(resultado.vencimentosHoje).toEqual({ valor: 50, quantidade: 1 });
    expect(resultado.emAtraso).toEqual({ valor: 0, clientes: 0 });
  });

  test('parcela que vence em 5 dias conta em vencimentosProximos7Dias', () => {
    const resultado = calcularIndicadores([parcela({ valor: 80, diasDoVencimento: 5 })], AGORA);

    expect(resultado.vencimentosProximos7Dias).toEqual({ valor: 80, quantidade: 1 });
  });

  test('parcela que vence em 10 dias não entra em nenhum indicador de urgência', () => {
    const resultado = calcularIndicadores([parcela({ valor: 80, diasDoVencimento: 10 })], AGORA);

    expect(resultado.vencimentosProximos7Dias).toEqual({ valor: 0, quantidade: 0 });
    expect(resultado.vencimentosHoje).toEqual({ valor: 0, quantidade: 0 });
    expect(resultado.emAtraso).toEqual({ valor: 0, clientes: 0 });
    // mas ainda conta no total a receber do negócio
    expect(resultado.totalAReceber).toEqual({ valor: 80, quantidade: 1 });
  });

  test('considera o fuso de Brasília, não UTC, pra decidir o que é "hoje"', () => {
    // 22h de 15/jun em Brasília já é 01h de 16/jun em UTC — sem o ajuste de
    // fuso, uma parcela que vence hoje (15/jun) seria lida como atrasada.
    const agoraTardeNoBrasil = new Date('2026-06-16T01:00:00Z');
    const parcelaDeHoje = {
      valor: 40,
      vencimento: new Date('2026-06-15T00:00:00Z'),
      clienteId: 'cliente-1',
    };

    const resultado = calcularIndicadores([parcelaDeHoje], agoraTardeNoBrasil);

    expect(resultado.vencimentosHoje).toEqual({ valor: 40, quantidade: 1 });
    expect(resultado.emAtraso).toEqual({ valor: 0, clientes: 0 });
  });

  test('duas parcelas atrasadas do mesmo cliente contam 1 cliente só em emAtraso', () => {
    const resultado = calcularIndicadores(
      [
        parcela({ valor: 100, diasDoVencimento: -1, clienteId: 'cliente-1' }),
        parcela({ valor: 200, diasDoVencimento: -2, clienteId: 'cliente-1' }),
      ],
      AGORA,
    );

    expect(resultado.emAtraso).toEqual({ valor: 300, clientes: 1 });
  });
});
