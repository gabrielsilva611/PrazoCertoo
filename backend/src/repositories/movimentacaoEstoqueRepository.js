const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');

// RF23-26, RN12: histórico imutável — cria a movimentação e atualiza o
// saldo do produto numa transação só, igual ao fluxo já usado pela Venda.
// O saldo é alterado com "increment" (delta), não com um SET do valor
// calculado no service: duas movimentações concorrentes no mesmo produto
// fazem o Postgres serializar os dois UPDATEs na própria linha, então o
// resultado final soma as duas em vez de uma sobrescrever a outra. Por
// isso a checagem de saldo negativo (RN10) também só pode ser feita aqui,
// depois do increment — antes dele, a leitura seria a mesma que causava a
// corrida (ver issue da sobrescrita de saldoAtual).
function registrar({ produtoId, usuarioId, fornecedorId, tipo, delta, motivo }) {
  return prisma.$transaction(async (tx) => {
    const produto = await tx.produto.update({
      where: { id: produtoId },
      data: { saldoAtual: { increment: delta } },
    });

    const saldoPosterior = produto.saldoAtual;
    const saldoAnterior = saldoPosterior - delta;

    if (saldoPosterior < 0 && !motivo) {
      throw new AppError(
        'Esta movimentação deixaria o estoque negativo. Informe "motivo" para confirmar mesmo assim.',
        409,
      );
    }

    return tx.movimentacaoEstoque.create({
      data: {
        produtoId,
        usuarioId,
        fornecedorId: fornecedorId ?? null,
        tipo,
        quantidade: Math.abs(delta),
        saldoAnterior,
        saldoPosterior,
        motivo: motivo ?? null,
      },
    });
  });
}

function listarPorProduto(negocioId, produtoId) {
  return prisma.movimentacaoEstoque.findMany({
    where: { produtoId, produto: { negocioId } },
    orderBy: { criadoEm: 'desc' },
  });
}

module.exports = { registrar, listarPorProduto };
