// Brasil não observa horário de verão desde 2019 — um offset fixo de -3h é
// seguro. Usado só pra converter "agora" (um instante real) no dia local de
// Brasília. Sem isso, um comerciante olhando o painel às 22h (horário de
// Brasília) já estaria em "amanhã" em UTC.
const OFFSET_BRASIL_MS = 3 * 60 * 60 * 1000;
const DIA_EM_MS = 1000 * 60 * 60 * 24;

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

module.exports = { OFFSET_BRASIL_MS, DIA_EM_MS, diaLocalDeAgora, diaDoVencimento };
