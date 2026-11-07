const inventarioRepository = require('../repositories/inventarioRepository');
const produtoRepository = require('../repositories/produtoRepository');
const AppError = require('../lib/AppError');

// RF28, RN13: abre um novo inventário (rascunho de contagem física).
function abrir(negocioId, usuarioId) {
  return inventarioRepository.criar(negocioId, usuarioId);
}

function listar(negocioId) {
  return inventarioRepository.listarPorNegocio(negocioId);
}

async function buscarDetalhe(negocioId, id) {
  return buscarOuFalhar(negocioId, id);
}

// RF28: registra (ou corrige) a contagem física de um produto no inventário aberto.
async function registrarItem(negocioId, inventarioId, dados) {
  const inventario = await buscarOuFalhar(negocioId, inventarioId);
  if (inventario.status !== 'ABERTO') {
    throw new AppError('Este inventário já foi concluído e não pode mais ser alterado.', 409);
  }

  const produto = await produtoRepository.buscarPorId(negocioId, dados.produtoId);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }

  const saldoSistema = produto.saldoAtual;
  const diferenca = dados.saldoFisico - saldoSistema;
  if (diferenca !== 0 && !dados.justificativa) {
    throw new AppError(
      'Há divergência entre a contagem física e o saldo do sistema. Informe "justificativa" para confirmar.',
      409,
    );
  }

  const itemExistente = await inventarioRepository.buscarItem(inventarioId, dados.produtoId);

  return inventarioRepository.salvarItem({
    id: itemExistente?.id,
    inventarioId,
    produtoId: dados.produtoId,
    saldoSistema,
    saldoFisico: dados.saldoFisico,
    diferenca,
    justificativa: dados.justificativa,
  });
}

// RF28, RN12: fecha o inventário — cada divergência gera uma movimentação de
// estoque (tipo INVENTARIO) e o saldo do produto passa a ser o saldo físico contado.
async function concluir(negocioId, inventarioId, usuarioId) {
  const inventario = await buscarOuFalhar(negocioId, inventarioId);
  if (inventario.status !== 'ABERTO') {
    throw new AppError('Este inventário já foi concluído.', 409);
  }
  if (inventario.itens.length === 0) {
    throw new AppError('Registre ao menos um item antes de concluir o inventário.', 409);
  }

  const movimentacoes = [];
  for (const item of inventario.itens) {
    const produto = await produtoRepository.buscarPorIdIncluindoInativos(negocioId, item.produtoId);
    if (!produto || produto.saldoAtual === item.saldoFisico) continue;

    movimentacoes.push({
      produtoId: item.produtoId,
      usuarioId,
      tipo: 'INVENTARIO',
      quantidade: Math.abs(item.saldoFisico - produto.saldoAtual),
      saldoAnterior: produto.saldoAtual,
      saldoPosterior: item.saldoFisico,
      motivo: item.justificativa ?? `Ajuste por contagem de inventário (${inventarioId})`,
    });
  }

  return inventarioRepository.concluir(inventarioId, movimentacoes);
}

async function buscarOuFalhar(negocioId, id) {
  const inventario = await inventarioRepository.buscarPorId(negocioId, id);
  if (!inventario) {
    throw new AppError('Inventário não encontrado.', 404);
  }
  return inventario;
}

module.exports = { abrir, listar, buscarDetalhe, registrarItem, concluir };
