const produtoRepository = require('../repositories/produtoRepository');
const categoriaRepository = require('../repositories/categoriaRepository');
const AppError = require('../lib/AppError');

// RF27: capital imobilizado (preço de custo × saldo) — calculado aqui, não persistido.
function comCapitalImobilizado(produto) {
  return { ...produto, capitalImobilizado: Number(produto.precoCusto) * produto.saldoAtual };
}

// RF21: catálogo de produtos com saldo e capital imobilizado.
async function listar(negocioId, { busca, incluirInativos, categoriaId } = {}) {
  const produtos = await produtoRepository.listarPorNegocio(negocioId, {
    busca,
    incluirInativos,
    categoriaId,
  });
  return produtos.map(comCapitalImobilizado);
}

async function buscarDetalhe(negocioId, id) {
  const produto = await produtoRepository.buscarPorIdIncluindoInativos(negocioId, id);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }
  return comCapitalImobilizado(produto);
}

async function criar(negocioId, dados) {
  await validarCategoria(negocioId, dados.categoriaId);
  const produto = await produtoRepository.criar(negocioId, dados);
  return comCapitalImobilizado(produto);
}

async function atualizar(negocioId, id, dados) {
  await buscarOuFalhar(negocioId, id);
  await validarCategoria(negocioId, dados.categoriaId);
  await produtoRepository.atualizar(negocioId, id, dados);
  const produto = await produtoRepository.buscarPorIdIncluindoInativos(negocioId, id);
  return comCapitalImobilizado(produto);
}

async function desativar(negocioId, id) {
  await buscarOuFalhar(negocioId, id);
  await produtoRepository.desativar(negocioId, id);
}

async function validarCategoria(negocioId, categoriaId) {
  if (!categoriaId) return;
  const categoria = await categoriaRepository.buscarPorId(negocioId, categoriaId);
  if (!categoria) {
    throw new AppError('Categoria não encontrada.', 404);
  }
}

async function buscarOuFalhar(negocioId, id) {
  const produto = await produtoRepository.buscarPorIdIncluindoInativos(negocioId, id);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }
  return produto;
}

module.exports = { listar, buscarDetalhe, criar, atualizar, desativar };
