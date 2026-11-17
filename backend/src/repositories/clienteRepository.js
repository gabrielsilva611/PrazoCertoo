const prisma = require('../lib/prisma');

// Todo acesso é escopado por negocioId — isolamento multi-tenant (RN08, RN15).

function listarPorNegocio(negocioId, { busca, incluirInativos } = {}) {
  return prisma.cliente.findMany({
    where: {
      negocioId,
      ...(!incluirInativos && { ativo: true }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { telefone: { contains: busca } },
        ],
      }),
    },
    orderBy: { nome: 'asc' },
  });
}

function buscarPorId(negocioId, id) {
  return prisma.cliente.findFirst({ where: { id, negocioId } });
}

// RF06: histórico completo de acordos (com parcelas) e cobranças enviadas.
function buscarComHistorico(negocioId, id) {
  return prisma.cliente.findFirst({
    where: { id, negocioId },
    include: {
      vendas: { include: { parcelas: { orderBy: { numero: 'asc' } } }, orderBy: { criadoEm: 'desc' } },
      historicoCobrancas: { orderBy: { enviadoEm: 'desc' } },
    },
  });
}

function criar(negocioId, dados) {
  return prisma.cliente.create({ data: { ...dados, negocioId } });
}

function atualizar(negocioId, id, dados) {
  return prisma.cliente.updateMany({ where: { id, negocioId }, data: dados });
}

function desativar(negocioId, id) {
  return prisma.cliente.updateMany({ where: { id, negocioId }, data: { ativo: false } });
}

// Exclusão de verdade (RN de quitação): só chega aqui depois do service
// confirmar que não há parcela em aberto. Precisa apagar na ordem inversa das
// FKs — histórico de cobrança e parcelas primeiro, depois as vendas, só então
// o cliente — senão o Postgres recusa por violar a constraint.
function excluir(negocioId, id) {
  return prisma.$transaction(async (tx) => {
    await tx.historicoCobranca.deleteMany({ where: { clienteId: id } });
    await tx.parcela.deleteMany({ where: { venda: { clienteId: id } } });
    await tx.venda.deleteMany({ where: { clienteId: id } });
    await tx.cliente.deleteMany({ where: { id, negocioId } });
  });
}

module.exports = {
  listarPorNegocio,
  buscarPorId,
  buscarComHistorico,
  criar,
  atualizar,
  desativar,
  excluir,
};
