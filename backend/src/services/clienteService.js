const clienteRepository = require('../repositories/clienteRepository');
const scoreService = require('./scoreService');
const AppError = require('../lib/AppError');
const { statusParcela } = require('../lib/parcelaUtil');

// RF04, RF07: lista clientes ativos do negócio com o score calculado em tempo real.
async function listar(negocioId, { busca, incluirInativos } = {}) {
  const clientes = await clienteRepository.listarPorNegocio(negocioId, { busca, incluirInativos });
  return Promise.all(
    clientes.map(async (cliente) => ({
      ...cliente,
      score: await scoreService.calcularScore(cliente.id),
    })),
  );
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
