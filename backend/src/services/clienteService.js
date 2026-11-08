const clienteRepository = require('../repositories/clienteRepository');
const parcelaRepository = require('../repositories/parcelaRepository');
const scoreService = require('./scoreService');
const AppError = require('../lib/AppError');
const { statusParcela } = require('../lib/parcelaUtil');

// RF04, RF07: lista clientes ativos do negócio com o score calculado em tempo real.
// As parcelas de todos os clientes são buscadas numa query só (em vez de uma
// por cliente) e agrupadas em memória antes de calcular cada score.
async function listar(negocioId, { busca, incluirInativos } = {}) {
  const clientes = await clienteRepository.listarPorNegocio(negocioId, { busca, incluirInativos });
  if (clientes.length === 0) {
    return clientes;
  }

  const agora = new Date();
  const desde = new Date(agora.getTime() - scoreService.SEIS_MESES_EM_MS);
  const clienteIds = clientes.map((cliente) => cliente.id);
  const parcelas = await parcelaRepository.listarPorClientes(clienteIds, desde);

  const parcelasPorCliente = new Map();
  for (const parcela of parcelas) {
    const doCliente = parcelasPorCliente.get(parcela.venda.clienteId) ?? [];
    doCliente.push(parcela);
    parcelasPorCliente.set(parcela.venda.clienteId, doCliente);
  }

  return clientes.map((cliente) => ({
    ...cliente,
    score: scoreService.calcularScoreDeParcelas(parcelasPorCliente.get(cliente.id) ?? [], agora),
  }));
}

// RF06: detalhe do cliente com score, acordos (com parcelas) e cobranças enviadas.
async function buscarDetalhe(negocioId, id) {
  const cliente = await clienteRepository.buscarComHistorico(negocioId, id);
  if (!cliente) {
    throw new AppError('Cliente não encontrado.', 404);
  }

  const score = await scoreService.calcularScore(cliente.id);
  const vendas = cliente.vendas.map((venda) => ({
    ...venda,
    parcelas: venda.parcelas.map((parcela) => ({ ...parcela, status: statusParcela(parcela) })),
  }));

  return { ...cliente, vendas, score };
}

async function criar(negocioId, dados) {
  return clienteRepository.criar(negocioId, dados);
}

// RF05: edição preservando o histórico (nenhum dado relacionado é apagado).
async function atualizar(negocioId, id, dados) {
  await buscarOuFalhar(negocioId, id);
  await clienteRepository.atualizar(negocioId, id, dados);
  return clienteRepository.buscarPorId(negocioId, id);
}

// RF05: desativação (soft delete) — histórico de acordos e cobranças permanece intacto.
async function desativar(negocioId, id) {
  await buscarOuFalhar(negocioId, id);
  await clienteRepository.desativar(negocioId, id);
}

async function buscarOuFalhar(negocioId, id) {
  const cliente = await clienteRepository.buscarPorId(negocioId, id);
  if (!cliente) {
    throw new AppError('Cliente não encontrado.', 404);
  }
  return cliente;
}

module.exports = { listar, buscarDetalhe, criar, atualizar, desativar };
