const dashboardRepository = require('../repositories/dashboardRepository');
const clienteService = require('./clienteService');
const { calcularIndicadores, OFFSET_BRASIL_MS } = require('../lib/dashboardUtil');
// inicioDoMes usa OFFSET_BRASIL_MS diretamente (não diaLocalDeAgora) porque
// precisa do instante UTC real do início do mês, não só a string da data.

// Início do mês no horário de Brasília, não em UTC — mesmo motivo do
// diaLocalDeAgora em backend/src/lib/dataUtil.js (evita cortar o mês 3h antes
// da hora certa pra quem está no fuso do Brasil).
function inicioDoMes(data) {
  const localizada = new Date(data.getTime() - OFFSET_BRASIL_MS);
  const inicioEmUtcDoDiaLocal = Date.UTC(localizada.getUTCFullYear(), localizada.getUTCMonth(), 1);
  return new Date(inicioEmUtcDoDiaLocal + OFFSET_BRASIL_MS);
}

// RF16: dashboard com os indicadores de recebimento do negócio. Só isso —
// os números de estoque (capital imobilizado, produtos abaixo do mínimo)
// ficam no relatório de estoque (relatorioService.relatorioEstoque), não aqui.
async function obterIndicadores(negocioId) {
  const agora = new Date();

  const [parcelasAbertas, recebidoNoMes, clientes] = await Promise.all([
    dashboardRepository.listarParcelasEmAberto(negocioId),
    dashboardRepository.somaRecebidaNoMes(negocioId, inicioDoMes(agora)),
    // clienteService.listar já busca as parcelas de todos os clientes numa
    // única query (corrigido na issue #31) — não é mais N+1.
    clienteService.listar(negocioId),
  ]);

  const indicadores = calcularIndicadores(parcelasAbertas, agora);
  const clientesInadimplentes = clientes.filter((c) => c.score === 'INADIMPLENTE').length;

  return { ...indicadores, recebidoNoMes, clientesInadimplentes };
}

module.exports = { obterIndicadores };
