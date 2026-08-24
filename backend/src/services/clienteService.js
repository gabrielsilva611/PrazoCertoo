const clienteRepository = require('../repositories/clienteRepository');
const scoreService = require('./scoreService');
const AppError = require('../lib/AppError');

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

// RF06: detalhe do cliente com score. O histórico de acordos e cobranças
// (Módulos 3 e 4) se conecta aqui quando esses módulos existirem.
async function buscarDetalhe(negocioId, id) {
  const cliente = await buscarOuFalhar(negocioId, id);
  const score = await scoreService.calcularScore(cliente.id);
  return { ...cliente, score };
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
