const prisma = require('../lib/prisma');

// Todo acesso é escopado por negocioId — isolamento multi-tenant (RN08, RN15).

function listarPorNegocio(negocioId) {
  return prisma.categoria.findMany({ where: { negocioId }, orderBy: { nome: 'asc' } });
}

function buscarPorId(negocioId, id) {
  return prisma.categoria.findFirst({ where: { id, negocioId } });
}

function criar(negocioId, dados) {
  return prisma.categoria.create({ data: { ...dados, negocioId } });
}

function atualizar(negocioId, id, dados) {
  return prisma.categoria.updateMany({ where: { id, negocioId }, data: dados });
}

function excluir(negocioId, id) {
  return prisma.categoria.deleteMany({ where: { id, negocioId } });
}

function contarProdutosVinculados(categoriaId) {
  return prisma.produto.count({ where: { categoriaId } });
}

module.exports = { listarPorNegocio, buscarPorId, criar, atualizar, excluir, contarProdutosVinculados };
