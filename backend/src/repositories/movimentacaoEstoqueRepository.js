const prisma = require('../lib/prisma');

// RF23-26, RN12: histórico imutável — cria a movimentação e atualiza o
// saldo do produto numa transação só, igual ao fluxo já usado pela Venda.
function registrar(dados) {
  return prisma.$transaction(async (tx) => {
    await tx.produto.update({
      where: { id: dados.produtoId },
      data: { saldoAtual: dados.saldoPosterior },
    });
    return tx.movimentacaoEstoque.create({ data: dados });
  });
}

function listarPorProduto(negocioId, produtoId) {
  return prisma.movimentacaoEstoque.findMany({
    where: { produtoId, produto: { negocioId } },
    orderBy: { criadoEm: 'desc' },
  });
}

module.exports = { registrar, listarPorProduto };
