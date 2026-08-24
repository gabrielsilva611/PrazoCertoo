const parcelaRepository = require('../repositories/parcelaRepository');

const SCORE = {
  BOM_PAGADOR: 'BOM_PAGADOR',
  IRREGULAR: 'IRREGULAR',
  INADIMPLENTE: 'INADIMPLENTE',
};

const SEIS_MESES_EM_MS = 1000 * 60 * 60 * 24 * 30 * 6;
const TRINTA_DIAS_EM_MS = 1000 * 60 * 60 * 24 * 30;

// RN02: Bom Pagador (sem atrasos nos últimos 6 meses), Irregular (1 a 2 atrasos),
// Inadimplente (3+ atrasos ou parcela em aberto há mais de 30 dias).
async function calcularScore(clienteId) {
  const agora = new Date();
  const desde = new Date(agora.getTime() - SEIS_MESES_EM_MS);

  const parcelas = await parcelaRepository.listarPorCliente(clienteId, desde);

  const emAberto = parcelas.filter((p) => p.pagoEm === null && p.vencimento < agora);
  const atrasos = emAberto.length;
  const temParcelaAntiga = emAberto.some(
    (p) => agora.getTime() - p.vencimento.getTime() > TRINTA_DIAS_EM_MS,
  );

  if (atrasos >= 3 || temParcelaAntiga) return SCORE.INADIMPLENTE;
  if (atrasos >= 1) return SCORE.IRREGULAR;
  return SCORE.BOM_PAGADOR;
}

module.exports = { calcularScore, SCORE };
