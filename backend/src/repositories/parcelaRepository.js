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

module.exports = { listarPorCliente };
