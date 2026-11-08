const prisma = require('../lib/prisma');

// Parcelas de um cliente nos últimos `desde` (usado pelo cálculo de score — RN02).
function listarPorCliente(clienteId, desde) {
  return prisma.parcela.findMany({
    where: {
      venda: { clienteId },
      ...(desde && { vencimento: { gte: desde } }),
    },
  });
}

// Mesma busca, mas para vários clientes de uma vez (1 query em vez de N) —
// usado pela listagem de clientes, que calcula o score de todos eles.
// Cada parcela sai com venda.clienteId pra permitir agrupar por cliente.
function listarPorClientes(clienteIds, desde) {
  return prisma.parcela.findMany({
    where: {
      venda: { clienteId: { in: clienteIds } },
      ...(desde && { vencimento: { gte: desde } }),
    },
    include: { venda: { select: { clienteId: true } } },
  });
}

module.exports = { listarPorCliente, listarPorClientes };
