const prisma = require('../lib/prisma');

function criar(dados) {
  return prisma.historicoCobranca.create({ data: dados });
}

function listarPorCliente(negocioId, clienteId) {
  return prisma.historicoCobranca.findMany({
    where: { negocioId, clienteId },
    orderBy: { enviadoEm: 'desc' },
  });
}

module.exports = { criar, listarPorCliente };
