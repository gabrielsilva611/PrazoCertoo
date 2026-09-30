const dashboardRepository = require('../repositories/dashboardRepository');
const clienteService = require('./clienteService');
const { calcularIndicadores, OFFSET_BRASIL_MS } = require('../lib/dashboardUtil');
// inicioDoMes usa OFFSET_BRASIL_MS diretamente (não diaLocalDeAgora) porque
// precisa do instante UTC real do início do mês, não só a string da data.

// Início do mês no horário de Brasília, não em UTC — mesmo motivo do
// dataLocalISO em dashboardUtil.js (evita cortar o mês 3h antes da hora
// certa pra quem está no fuso do Brasil).
function inicioDoMes(data) {
  const localizada = new Date(data.getTime() - OFFSET_BRASIL_MS);
  const inicioEmUtcDoDiaLocal = Date.UTC(localizada.getUTCFullYear(), localizada.getUTCMonth(), 1);
  return new Date(inicioEmUtcDoDiaLocal + OFFSET_BRASIL_MS);
}

// RF16: dashboard unificado com os indicadores de recebimento do negócio.
// A parte de estoque (capital imobilizado, produtos críticos) entra quando
// o Módulo 6 existir.
async function obterIndicadores(negocioId) {
  const agora = new Date();

  const [parcelasAbertas, recebidoNoMes, clientes] = await Promise.all([
    dashboardRepository.listarParcelasEmAberto(negocioId),
    dashboardRepository.somaRecebidaNoMes(negocioId, inicioDoMes(agora)),
    // TODO(qualidade): N+1 já documentado — clienteService.listar calcula o
    // score de cada cliente com uma consulta própria. Aceitável por ora
    // (poucos clientes em dev), mas o dashboard é chamado com frequência e
    // deve ser uma das primeiras coisas a otimizar na Sprint de Qualidade.
    clienteService.listar(negocioId),
  ]);

  const indicadores = calcularIndicadores(parcelasAbertas, agora);
  const clientesInadimplentes = clientes.filter((c) => c.score === 'INADIMPLENTE').length;

  return { ...indicadores, recebidoNoMes, clientesInadimplentes };
}

module.exports = { obterIndicadores };
