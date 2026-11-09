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
//
// O "SELECT ... FOR UPDATE" trava a linha do inventário até o fim da
// transação, serializando contra concluir() (que também trava essa mesma
// linha ao virar o status pra CONCLUIDO). Sem isso, o upsert do item podia
// cair entre a checagem de status e a transação de conclusão de outra
// requisição — o item ficava salvo num inventário já concluído e sua
// divergência nunca virava movimentação de estoque.
function salvarItem({ inventarioId, produtoId, saldoSistema, saldoFisico, diferenca, justificativa }) {
  const dados = { saldoSistema, saldoFisico, diferenca, justificativa: justificativa ?? null };
  return prisma.$transaction(async (tx) => {
    const [inventario] = await tx.$queryRaw`
      SELECT status FROM inventarios WHERE id = ${inventarioId}::uuid FOR UPDATE
    `;
    if (!inventario || inventario.status !== 'ABERTO') {
      throw new AppError('Este inventário já foi concluído e não pode mais ser alterado.', 409);
    }

    return tx.inventarioItem.upsert({
      where: { inventarioId_produtoId: { inventarioId, produtoId } },
      create: { inventarioId, produtoId, ...dados },
      update: dados,
    });
  });
}

// RF28, RN12: aplica cada divergência como uma movimentação de estoque
// (tipo INVENTARIO) e fecha o inventário — tudo em uma transação só. O
// updateMany com "status: ABERTO" no where (em vez de um update por id)
// garante que duas conclusões simultâneas não processem a mesma contagem
// duas vezes (só a primeira encontra o inventário ainda aberto) e trava a
// linha do inventário até o fim da transação, serializando contra o
// salvarItem() de cima. O saldo do produto é alterado com "increment" (o
// delta calculado aqui dentro), não com um SET do valor absoluto — isso
// serializa a conclusão com qualquer outra movimentação concorrente no
// mesmo produto em vez de sobrescrevê-la.
//
// Os itens só são lidos DEPOIS do updateMany acima, com a linha já travada —
// isso garante que um registrarItem() que tenha ganhado a corrida contra
// esta conclusão (commitado antes deste ponto) apareça na lista e vire
// movimentação; montar "ajustes" fora desta transação, com um snapshot de
// itens lido antes do lock, era o que deixava uma contagem recém-salva de
// fora do fechamento.
async function concluir(negocioId, id, usuarioId) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.inventario.updateMany({
      where: { id, status: 'ABERTO' },
      data: { status: 'CONCLUIDO', concluidoEm: new Date() },
    });
    if (count === 0) {
      throw new AppError('Este inventário já foi concluído.', 409);
    }

    const itens = await tx.inventarioItem.findMany({ where: { inventarioId: id } });
    const produtoIds = itens.map((item) => item.produtoId);
    const produtosExistentes = await tx.produto.findMany({
      where: { id: { in: produtoIds }, negocioId },
      select: { id: true },
    });
    const idsExistentes = new Set(produtosExistentes.map((produto) => produto.id));

    for (const item of itens) {
      if (!idsExistentes.has(item.produtoId) || item.diferenca === 0) continue;

      const produto = await tx.produto.update({
        where: { id: item.produtoId },
        data: { saldoAtual: { increment: item.diferenca } },
      });

      await tx.movimentacaoEstoque.create({
        data: {
          produtoId: item.produtoId,
          usuarioId,
          tipo: 'INVENTARIO',
          quantidade: Math.abs(item.diferenca),
          saldoAnterior: produto.saldoAtual - item.diferenca,
          saldoPosterior: produto.saldoAtual,
          motivo: item.justificativa ?? `Ajuste por contagem de inventário (${id})`,
        },
      });
    }

    return tx.inventario.findUniqueOrThrow({
      where: { id },
      include: { itens: { include: { produto: true }, orderBy: { id: 'asc' } } },
    });
  });
}

module.exports = { criar, buscarAberto, listarPorNegocio, buscarPorId, salvarItem, concluir };
