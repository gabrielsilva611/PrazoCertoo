const prisma = require('../lib/prisma');

// Todo acesso é escopado por negocioId — isolamento multi-tenant (RN08, RN15).

function listarPorNegocio(negocioId) {
  return prisma.fornecedor.findMany({ where: { negocioId }, orderBy: { nome: 'asc' } });
}

function buscarPorId(negocioId, id) {
  return prisma.fornecedor.findFirst({ where: { id, negocioId } });
}

function criar(negocioId, dados) {
  return prisma.fornecedor.create({ data: { ...dados, negocioId } });
}

function atualizar(negocioId, id, dados) {
  return prisma.fornecedor.updateMany({ where: { id, negocioId }, data: dados });
}

function excluir(negocioId, id) {
  return prisma.fornecedor.deleteMany({ where: { id, negocioId } });
}

function contarMovimentacoesVinculadas(fornecedorId) {
  return prisma.movimentacaoEstoque.count({ where: { fornecedorId } });
}

module.exports = {
  listarPorNegocio,
  buscarPorId,
  criar,
  atualizar,
  excluir,
  contarMovimentacoesVinculadas,
};
