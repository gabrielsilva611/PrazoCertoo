const produtoRepository = require('../repositories/produtoRepository');
const fornecedorRepository = require('../repositories/fornecedorRepository');
const movimentacaoRepository = require('../repositories/movimentacaoEstoqueRepository');
const AppError = require('../lib/AppError');

// RF23-25: entrada soma ao saldo; saída e ajuste negativo subtraem.
// "quantidade" chega sempre positiva para ENTRADA/SAIDA; no AJUSTE o
// próprio valor já é o delta (pode ser negativo).
function calcularDelta(tipo, quantidade) {
  if (tipo === 'ENTRADA') return quantidade;
  if (tipo === 'SAIDA') return -quantidade;
  return quantidade;
}

async function registrar(negocioId, produtoId, dados) {
  const produto = await produtoRepository.buscarPorId(negocioId, produtoId);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }

  if (dados.fornecedorId) {
    const fornecedor = await fornecedorRepository.buscarPorId(negocioId, dados.fornecedorId);
    if (!fornecedor) {
      throw new AppError('Fornecedor não encontrado.', 404);
    }
  }

  const delta = calcularDelta(dados.tipo, dados.quantidade);
  const saldoPosterior = produto.saldoAtual + delta;

  // RN10 (mesmo critério já usado na Venda): estoque negativo não é
  // bloqueado, mas exige motivo explícito antes de confirmar.
  if (saldoPosterior < 0 && !dados.motivo) {
    throw new AppError(
      'Esta movimentação deixaria o estoque negativo. Informe "motivo" para confirmar mesmo assim.',
      409,
    );
  }

  return movimentacaoRepository.registrar({
    produtoId,
    usuarioId: dados.usuarioId,
    fornecedorId: dados.fornecedorId ?? null,
    tipo: dados.tipo,
    quantidade: Math.abs(delta),
    saldoAnterior: produto.saldoAtual,
    saldoPosterior,
    motivo: dados.motivo ?? null,
  });
}

async function listar(negocioId, produtoId) {
  const produto = await produtoRepository.buscarPorIdIncluindoInativos(negocioId, produtoId);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }
  return movimentacaoRepository.listarPorProduto(negocioId, produtoId);
}

module.exports = { registrar, listar };
