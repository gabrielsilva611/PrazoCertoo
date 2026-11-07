const prisma = require('../lib/prisma');

// Todo acesso é escopado por negocioId — isolamento multi-tenant (RN08, RN15).

function criar(negocioId, usuarioId) {
  return prisma.inventario.create({ data: { negocioId, usuarioId } });
}

function listarPorNegocio(negocioId) {
  return prisma.inventario.findMany({ where: { negocioId }, orderBy: { iniciadoEm: 'desc' } });
}

function buscarPorId(negocioId, id) {
  return prisma.inventario.findFirst({
    where: { id, negocioId },
    include: { itens: { include: { produto: true }, orderBy: { id: 'asc' } } },
  });
}

function buscarItem(inventarioId, produtoId) {
  return prisma.inventarioItem.findFirst({ where: { inventarioId, produtoId } });
}

function salvarItem({ id, inventarioId, produtoId, saldoSistema, saldoFisico, diferenca, justificativa }) {
  const dados = {
    inventarioId,
    produtoId,
    saldoSistema,
    saldoFisico,
    diferenca,
    justificativa: justificativa ?? null,
  };
  if (id) {
    return prisma.inventarioItem.update({ where: { id }, data: dados });
  }
  return prisma.inventarioItem.create({ data: dados });
}

// RF28, RN12: aplica cada divergência como uma movimentação de estoque
// (tipo INVENTARIO) e fecha o inventário — tudo em uma transação só.
function concluir(id, movimentacoes) {
  return prisma.$transaction(async (tx) => {
    for (const movimentacao of movimentacoes) {
      await tx.produto.update({
        where: { id: movimentacao.produtoId },
        data: { saldoAtual: movimentacao.saldoPosterior },
      });
      await tx.movimentacaoEstoque.create({ data: movimentacao });
    }

    return tx.inventario.update({
      where: { id },
      data: { status: 'CONCLUIDO', concluidoEm: new Date() },
      include: { itens: { include: { produto: true }, orderBy: { id: 'asc' } } },
    });
  });
}

module.exports = { criar, listarPorNegocio, buscarPorId, buscarItem, salvarItem, concluir };
