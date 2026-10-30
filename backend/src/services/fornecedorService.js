const fornecedorRepository = require('../repositories/fornecedorRepository');
const AppError = require('../lib/AppError');

// RF22: cadastro opcional, vinculado às entradas de estoque.
async function listar(negocioId) {
  return fornecedorRepository.listarPorNegocio(negocioId);
}

async function criar(negocioId, dados) {
  return fornecedorRepository.criar(negocioId, dados);
}

async function atualizar(negocioId, id, dados) {
  await buscarOuFalhar(negocioId, id);
  await fornecedorRepository.atualizar(negocioId, id, dados);
  return fornecedorRepository.buscarPorId(negocioId, id);
}

async function excluir(negocioId, id) {
  await buscarOuFalhar(negocioId, id);

  const emUso = await fornecedorRepository.contarMovimentacoesVinculadas(id);
  if (emUso > 0) {
    throw new AppError('Fornecedor em uso em movimentações de estoque — não pode ser excluído.', 409);
  }

  await fornecedorRepository.excluir(negocioId, id);
}

async function buscarOuFalhar(negocioId, id) {
  const fornecedor = await fornecedorRepository.buscarPorId(negocioId, id);
  if (!fornecedor) {
    throw new AppError('Fornecedor não encontrado.', 404);
  }
  return fornecedor;
}

module.exports = { listar, criar, atualizar, excluir };
