const prisma = require('../lib/prisma');
const { Prisma } = require('../../generated/prisma');
const AppError = require('../lib/AppError');

// Todo acesso é escopado por negocioId — isolamento multi-tenant (RN08, RN15).

// O service já confere se há um inventário ABERTO antes de chamar isto, mas
// essa checagem é check-then-act (corrida possível). O índice único parcial
// "inventarios_aberto_unico_por_negocio" (migration, não representável no
// Prisma Schema Language) é quem garante a regra de fato — aqui só traduz a
// violação dele pra um 409 em vez de deixar o erro bruto do Postgres subir.
async function criar(negocioId, usuarioId) {
  try {
    return await prisma.inventario.create({ data: { negocioId, usuarioId } });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
      throw new AppError('Já existe um inventário aberto. Conclua-o antes de iniciar outro.', 409);
    }
    throw erro;
  }
}

function buscarAberto(negocioId) {
  return prisma.inventario.findFirst({ where: { negocioId, status: 'ABERTO' } });
}

function listarPorNegocio(negocioId) {
  return prisma.inventario.findMany({ where: { negocioId }, orderBy: { iniciadoEm: 'desc' } });
}

function buscarPorId(negocioId, id) {
  return prisma.inventario.findFirst({
    where: { id, negocioId },
    include: { itens: { include: { produto: true }, orderBy: { id: 'asc' } } },
  });
}

// Reconferir o mesmo produto atualiza o item em vez de duplicar — upsert
// pela constraint única (inventarioId, produtoId) evita a corrida de duas
// requisições simultâneas criando dois itens pro mesmo produto.
function salvarItem({ inventarioId, produtoId, saldoSistema, saldoFisico, diferenca, justificativa }) {
  const dados = { saldoSistema, saldoFisico, diferenca, justificativa: justificativa ?? null };
  return prisma.inventarioItem.upsert({
    where: { inventarioId_produtoId: { inventarioId, produtoId } },
    create: { inventarioId, produtoId, ...dados },
    update: dados,
  });
}

// RF28, RN12: aplica cada divergência como uma movimentação de estoque
// (tipo INVENTARIO) e fecha o inventário — tudo em uma transação só. O
// updateMany com "status: ABERTO" no where (em vez de um update por id)
// garante que duas conclusões simultâneas não processem a mesma contagem
// duas vezes: só a primeira encontra o inventário ainda aberto.
function concluir(id, movimentacoes) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.inventario.updateMany({
      where: { id, status: 'ABERTO' },
      data: { status: 'CONCLUIDO', concluidoEm: new Date() },
    });
    if (count === 0) {
      throw new AppError('Este inventário já foi concluído.', 409);
    }

    for (const movimentacao of movimentacoes) {
      await tx.produto.update({
        where: { id: movimentacao.produtoId },
        data: { saldoAtual: movimentacao.saldoPosterior },
      });
      await tx.movimentacaoEstoque.create({ data: movimentacao });
    }

    return tx.inventario.findUniqueOrThrow({
      where: { id },
      include: { itens: { include: { produto: true }, orderBy: { id: 'asc' } } },
    });
  });
}

module.exports = { criar, buscarAberto, listarPorNegocio, buscarPorId, salvarItem, concluir };
