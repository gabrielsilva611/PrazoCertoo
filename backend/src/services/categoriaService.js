const categoriaRepository = require('../repositories/categoriaRepository');
const AppError = require('../lib/AppError');

// RF20: agrupamento de produtos por tipo.
async function listar(negocioId) {
  return categoriaRepository.listarPorNegocio(negocioId);
}

async function criar(negocioId, dados) {
  return categoriaRepository.criar(negocioId, dados);
}

async function atualizar(negocioId, id, dados) {
  await buscarOuFalhar(negocioId, id);
  await categoriaRepository.atualizar(negocioId, id, dados);
  return categoriaRepository.buscarPorId(negocioId, id);
}

async function excluir(negocioId, id) {
  await buscarOuFalhar(negocioId, id);

  const emUso = await categoriaRepository.contarProdutosVinculados(id);
  if (emUso > 0) {
    throw new AppError('Categoria em uso por produtos — não pode ser excluída.', 409);
  }

  await categoriaRepository.excluir(negocioId, id);
}

async function buscarOuFalhar(negocioId, id) {
  const categoria = await categoriaRepository.buscarPorId(negocioId, id);
  if (!categoria) {
    throw new AppError('Categoria não encontrada.', 404);
  }
  return categoria;
}

module.exports = { listar, criar, atualizar, excluir };
