const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');

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
// a movimentação de saída de estoque — tudo em uma transação só. O saldo é
// alterado com "increment" (delta), não com um SET do valor calculado no
// service: isso serializa vendas concorrentes do mesmo produto na própria
// linha do Postgres em vez de uma sobrescrever o resultado da outra. A
// checagem de estoque insuficiente (RN10) por isso só pode acontecer aqui,
// depois do increment.
async function criarComParcelas({ venda, parcelas, movimentacaoEstoque }) {
  return prisma.$transaction(async (tx) => {
    const vendaCriada = await tx.venda.create({ data: venda });

    await tx.parcela.createMany({
      // saldoDevedor começa igual ao valor da parcela — é o que o pagamento
      // (mesmo que parcial) vai abatendo depois.
      data: parcelas.map((parcela) => ({ ...parcela, saldoDevedor: parcela.valor, vendaId: vendaCriada.id })),
    });

    if (movimentacaoEstoque) {
      const produto = await tx.produto.update({
        where: { id: movimentacaoEstoque.produtoId },
        data: { saldoAtual: { increment: movimentacaoEstoque.delta } },
      });

      const saldoPosterior = produto.saldoAtual;
      const saldoAnterior = saldoPosterior - movimentacaoEstoque.delta;
      const saldoInsuficiente = saldoPosterior < 0;

      if (saldoInsuficiente && !movimentacaoEstoque.justificativaEstoque) {
        throw new AppError(
          'Estoque insuficiente para este produto. Envie "justificativaEstoque" para confirmar a venda mesmo assim.',
          409,
        );
      }

      await tx.movimentacaoEstoque.create({
        data: {
          produtoId: movimentacaoEstoque.produtoId,
          usuarioId: movimentacaoEstoque.usuarioId,
          tipo: movimentacaoEstoque.tipo,
          quantidade: Math.abs(movimentacaoEstoque.delta),
          saldoAnterior,
          saldoPosterior,
          motivo: saldoInsuficiente
            ? `Venda com estoque insuficiente: ${movimentacaoEstoque.justificativaEstoque}`
            : 'Venda a prazo',
        },
      });
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

// RF13: a mensagem de cobrança precisa do nome e telefone do cliente.
function buscarParcelaComCliente(negocioId, vendaId, numero) {
  return prisma.parcela.findFirst({
    where: { numero, vendaId, venda: { negocioId } },
    include: { venda: { include: { cliente: true } } },
  });
}

// Atualiza o saldo depois de um pagamento (total ou parcial). Quando o
// service calcula que o saldo chegou a 0, passa pagoEm junto — senão só o
// saldoDevedor muda e a parcela continua em aberto.
function registrarPagamento(id, { saldoDevedor, pagoEm }) {
  return prisma.parcela.update({ where: { id }, data: { saldoDevedor, pagoEm } });
}

module.exports = {
  buscarPorId,
  listarPorNegocio,
  criarComParcelas,
  buscarParcela,
  buscarParcelaComCliente,
  registrarPagamento,
};
