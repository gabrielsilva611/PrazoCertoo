const prisma = require('../lib/prisma');

// Todo acesso é escopado por negocioId — isolamento multi-tenant (RN08, RN15).

function listarPorNegocio(negocioId, { busca, incluirInativos, categoriaId } = {}) {
  return prisma.produto.findMany({
    where: {
      negocioId,
      ...(!incluirInativos && { ativo: true }),
      ...(categoriaId && { categoriaId }),
      ...(busca && { nome: { contains: busca, mode: 'insensitive' } }),
    },
    orderBy: { nome: 'asc' },
  });
}

function buscarPorId(negocioId, id) {
  return prisma.produto.findFirst({ where: { id, negocioId, ativo: true } });
}

function buscarPorIdIncluindoInativos(negocioId, id) {
  return prisma.produto.findFirst({ where: { id, negocioId } });
}

function criar(negocioId, dados) {
  return prisma.produto.create({ data: { ...dados, negocioId } });
}

function atualizar(negocioId, id, dados) {
  return prisma.produto.updateMany({ where: { id, negocioId }, data: dados });
}

function desativar(negocioId, id) {
  return prisma.produto.updateMany({ where: { id, negocioId }, data: { ativo: false } });
}

// Usado dentro de transações (RF10) — recebe o client transacional.
function atualizarSaldo(tx, id, saldoAtual) {
  return tx.produto.update({ where: { id }, data: { saldoAtual } });
}

module.exports = {
  listarPorNegocio,
  buscarPorId,
  buscarPorIdIncluindoInativos,
  criar,
  atualizar,
  desativar,
  atualizarSaldo,
};
