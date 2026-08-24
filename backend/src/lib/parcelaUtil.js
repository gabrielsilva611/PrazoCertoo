const DIA_EM_MS = 1000 * 60 * 60 * 24;

// RF09: calcula o valor e a data de cada parcela. Trabalha em centavos pra
// evitar erro de ponto flutuante; a última parcela absorve o arredondamento
// (ex: R$680,00 em 3x -> 226,67 / 226,67 / 226,66 — igual ao mockup da Tela 5).
function calcularParcelas(valorTotal, numParcelas, dataInicio, intervaloDias = 30) {
  const totalCentavos = Math.round(Number(valorTotal) * 100);
  const baseCentavos = Math.round(totalCentavos / numParcelas);
  const restoCentavos = totalCentavos - baseCentavos * numParcelas;

  return Array.from({ length: numParcelas }, (_, indice) => {
    const numero = indice + 1;
    const centavos = numero === numParcelas ? baseCentavos + restoCentavos : baseCentavos;
    const vencimento = new Date(dataInicio.getTime() + indice * intervaloDias * DIA_EM_MS);

    return { numero, valor: centavos / 100, vencimento };
  });
}

// RF12, RN01: status é derivado, não armazenado — evita ficar desatualizado.
function statusParcela(parcela, agora = new Date()) {
  if (parcela.pagoEm) return 'PAGO';
  if (parcela.vencimento < agora) return 'ATRASADO';
  return 'PENDENTE';
}

module.exports = { calcularParcelas, statusParcela };
