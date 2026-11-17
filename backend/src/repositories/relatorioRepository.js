const prisma = require('../lib/prisma');

// Vendas registradas dentro do período (por data de início do acordo).
function listarVendasPorPeriodo(negocioId, inicio, fim) {
  return prisma.venda.findMany({
    where: { negocioId, dataInicio: { gte: inicio, lte: fim } },
    include: { cliente: { select: { nome: true } } },
    orderBy: { dataInicio: 'desc' },
  });
}

// Toda parcela ainda não paga do negócio, já com o nome do cliente — pro
// relatório de inadimplência não precisar de uma query por cliente.
function listarParcelasEmAberto(negocioId) {
  return prisma.parcela.findMany({
    where: { pagoEm: null, venda: { negocioId } },
    select: {
      valor: true,
      vencimento: true,
      venda: { select: { clienteId: true, cliente: { select: { nome: true } } } },
    },
  });
}

module.exports = { listarVendasPorPeriodo, listarParcelasEmAberto };
