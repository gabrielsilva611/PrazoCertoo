const DIA_EM_MS = 1000 * 60 * 60 * 24;
// Brasil não observa horário de verão desde 2019 — um offset fixo de -3h é
// seguro. Usado só pra converter "agora" (um instante real) no dia local de
// Brasília. Sem isso, um comerciante olhando o painel às 22h (horário de
// Brasília) já estaria em "amanhã" em UTC.
const OFFSET_BRASIL_MS = 3 * 60 * 60 * 1000;

// Só pra instantes de verdade (ex: `new Date()`). NÃO aplicar em
// `parcela.vencimento` — esse campo é uma data pura (@db.Date), guardada
// como meia-noite UTC representando o dia exato pretendido; subtrair 3h
// dele joga a data um dia pra trás por engano.
function diaLocalDeAgora(data) {
  return new Date(data.getTime() - OFFSET_BRASIL_MS).toISOString().slice(0, 10);
}

function diaDoVencimento(data) {
  return data.toISOString().slice(0, 10);
}

// RF16: indicadores de recebimento a partir das parcelas ainda não pagas do
// negócio. Usa comparação por dia — "hoje" calculado no fuso de Brasília,
// não em UTC — porque comparar por instante exato misturaria o bucket
// "vence hoje" com "atrasado" a partir da meia-noite.
function calcularIndicadores(parcelasAbertas, agora = new Date()) {
  const hojeISO = diaLocalDeAgora(agora);
  const daquiA7DiasISO = diaLocalDeAgora(new Date(agora.getTime() + 7 * DIA_EM_MS));

  const indicadores = {
    totalAReceber: { valor: 0, quantidade: 0 },
    vencimentosHoje: { valor: 0, quantidade: 0 },
    emAtraso: { valor: 0, clientesIds: new Set() },
    vencimentosProximos7Dias: { valor: 0, quantidade: 0 },
  };

  for (const parcela of parcelasAbertas) {
    const valor = Number(parcela.valor);
    const vencimentoISO = diaDoVencimento(parcela.vencimento);

    indicadores.totalAReceber.valor += valor;
    indicadores.totalAReceber.quantidade += 1;

    if (vencimentoISO < hojeISO) {
      indicadores.emAtraso.valor += valor;
      indicadores.emAtraso.clientesIds.add(parcela.clienteId);
    } else if (vencimentoISO === hojeISO) {
      indicadores.vencimentosHoje.valor += valor;
      indicadores.vencimentosHoje.quantidade += 1;
    } else if (vencimentoISO <= daquiA7DiasISO) {
      indicadores.vencimentosProximos7Dias.valor += valor;
      indicadores.vencimentosProximos7Dias.quantidade += 1;
    }
  }

  return {
    totalAReceber: indicadores.totalAReceber,
    vencimentosHoje: indicadores.vencimentosHoje,
    emAtraso: {
      valor: indicadores.emAtraso.valor,
      clientes: indicadores.emAtraso.clientesIds.size,
    },
    vencimentosProximos7Dias: indicadores.vencimentosProximos7Dias,
  };
}

module.exports = { calcularIndicadores, diaLocalDeAgora, OFFSET_BRASIL_MS };
