const prisma = require('../lib/prisma');

function buscarPorId(negocioId, id) {
  return prisma.venda.findFirst({
    where: { id, negocioId },
    include: { cliente: true, produto: true, parcelas: { orderBy: { numero: 'asc' } } },
  });
}

function listarPorNegocio(negocioId) {
  return prisma.venda.findMany({
    where: { negocioId },
    include: { cliente: true, parcelas: true },
    orderBy: { criadoEm: 'desc' },
  });
}

// RF08-RF10, RF26: cria a venda, as parcelas e (se houver produto vinculado)
// a movimentação de saída de estoque — tudo em uma transação só.
async function criarComParcelas({ venda, parcelas, movimentacaoEstoque }) {
  return prisma.$transaction(async (tx) => {
    const vendaCriada = await tx.venda.create({ data: venda });

    await tx.parcela.createMany({
      data: parcelas.map((parcela) => ({ ...parcela, vendaId: vendaCriada.id })),
    });

    if (movimentacaoEstoque) {
      await tx.produto.update({
        where: { id: movimentacaoEstoque.produtoId },
        data: { saldoAtual: movimentacaoEstoque.saldoPosterior },
      });
      await tx.movimentacaoEstoque.create({ data: movimentacaoEstoque });
    }

    return tx.venda.findUniqueOrThrow({
      where: { id: vendaCriada.id },
      include: { parcelas: { orderBy: { numero: 'asc' } } },
    });
  });
}

function buscarParcela(negocioId, vendaId, numero) {
  return prisma.parcela.findFirst({ where: { numero, vendaId, venda: { negocioId } } });
}

function marcarParcelaPaga(id) {
  return prisma.parcela.update({ where: { id }, data: { pagoEm: new Date() } });
}

module.exports = {
  buscarPorId,
  listarPorNegocio,
  criarComParcelas,
  buscarParcela,
  marcarParcelaPaga,
};
