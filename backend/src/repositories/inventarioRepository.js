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

// Reconferir o mesmo produto atualiza o item em vez de duplicar — upsert
// pela constraint única (inventarioId, produtoId) evita a corrida de duas
// requisições simultâneas criando dois itens pro mesmo produto.
function salvarItem({ inventarioId, produtoId, saldoSistema, saldoFisico, diferenca, justificativa }) {
  const dados = { saldoSistema, saldoFisico, diferenca, justificativa: justificativa ?? null };
  return prisma.inventarioItem.upsert({
    where: { inventarioId_produtoId: { inventarioId, produtoId } },
    create: { inventarioId, produtoId, ...dados },
    update: dados,
  });
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

module.exports = { criar, listarPorNegocio, buscarPorId, salvarItem, concluir };
