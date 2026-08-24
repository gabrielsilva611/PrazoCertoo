const prisma = require('../lib/prisma');

function buscarPorId(negocioId, id) {
  return prisma.produto.findFirst({ where: { id, negocioId, ativo: true } });
}

// Usado dentro de transações (RF10) — recebe o client transacional.
function atualizarSaldo(tx, id, saldoAtual) {
  return tx.produto.update({ where: { id }, data: { saldoAtual } });
}

module.exports = { buscarPorId, atualizarSaldo };
