const prisma = require('../lib/prisma');

// Todas as parcelas ainda não pagas do negócio, já achatadas com o
// clienteId (vem de parcela -> venda -> cliente) pro dashboardUtil não
// precisar conhecer a forma do Prisma.
async function listarParcelasEmAberto(negocioId) {
  const parcelas = await prisma.parcela.findMany({
    where: { pagoEm: null, venda: { negocioId } },
    select: { valor: true, vencimento: true, venda: { select: { clienteId: true } } },
  });

  return parcelas.map((p) => ({
    valor: p.valor,
    vencimento: p.vencimento,
    clienteId: p.venda.clienteId,
  }));
}

// RF16: "Recebido no Mês" — soma das parcelas pagas dentro do mês corrente.
async function somaRecebidaNoMes(negocioId, inicioMes) {
  const resultado = await prisma.parcela.aggregate({
    where: { venda: { negocioId }, pagoEm: { gte: inicioMes } },
    _sum: { valor: true },
  });
  return Number(resultado._sum.valor ?? 0);
}

module.exports = { listarParcelasEmAberto, somaRecebidaNoMes };
