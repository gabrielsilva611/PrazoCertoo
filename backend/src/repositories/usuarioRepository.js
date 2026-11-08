const prisma = require('../lib/prisma');

function buscarPorEmail(email) {
  return prisma.usuario.findUnique({ where: { email } });
}

function buscarPorId(id) {
  return prisma.usuario.findUnique({ where: { id } });
}

function criar(dados) {
  return prisma.usuario.create({ data: dados });
}

function atualizarCorDestaque(id, corDestaque) {
  return prisma.usuario.update({ where: { id }, data: { corDestaque } });
}

module.exports = { buscarPorEmail, buscarPorId, criar, atualizarCorDestaque };
