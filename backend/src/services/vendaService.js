const vendaRepository = require('../repositories/vendaRepository');
const clienteRepository = require('../repositories/clienteRepository');
const produtoRepository = require('../repositories/produtoRepository');
const { calcularParcelas } = require('../lib/parcelaUtil');
const AppError = require('../lib/AppError');

// RF08: a Tela 5 vincula um produto por venda, sem campo de quantidade —
// cada venda com produto debita 1 unidade do estoque.
const QUANTIDADE_POR_VENDA = 1;

// RN05: venda só pode ser registrada para cliente já cadastrado no negócio.
async function registrar(negocioId, dados) {
  const cliente = await clienteRepository.buscarPorId(negocioId, dados.clienteId);
  if (!cliente) {
    throw new AppError('Cliente não encontrado.', 404);
  }

  const movimentacaoEstoque = dados.produtoId
    ? await montarMovimentacaoEstoque(negocioId, dados)
    : null;

  const parcelas = calcularParcelas(
    dados.valorTotal,
    dados.numParcelas,
    dados.dataInicio,
    dados.intervaloDias,
  );

  return vendaRepository.criarComParcelas({
    venda: {
      negocioId,
      clienteId: dados.clienteId,
      produtoId: dados.produtoId ?? null,
      descricao: dados.descricao,
      observacoes: dados.observacoes,
      valorTotal: dados.valorTotal,
      numParcelas: dados.numParcelas,
      dataInicio: dados.dataInicio,
    },
    parcelas,
    movimentacaoEstoque,
  });
}

// RN10: se o saldo for insuficiente, não bloqueia — mas exige uma justificativa
// explícita do usuário antes de deixar o saldo ficar negativo.
async function montarMovimentacaoEstoque(negocioId, dados) {
  const produto = await produtoRepository.buscarPorId(negocioId, dados.produtoId);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }

  const saldoInsuficiente = produto.saldoAtual < QUANTIDADE_POR_VENDA;
  if (saldoInsuficiente && !dados.justificativaEstoque) {
    throw new AppError(
      'Estoque insuficiente para este produto. Envie "justificativaEstoque" para confirmar a venda mesmo assim.',
      409,
    );
  }

  return {
    produtoId: produto.id,
    usuarioId: dados.usuarioId,
    tipo: 'SAIDA',
    quantidade: QUANTIDADE_POR_VENDA,
    saldoAnterior: produto.saldoAtual,
    saldoPosterior: produto.saldoAtual - QUANTIDADE_POR_VENDA,
    motivo: saldoInsuficiente
      ? `Venda com estoque insuficiente: ${dados.justificativaEstoque}`
      : 'Venda a prazo',
  };
}

// RF11: registro de pagamento individual da parcela.
async function pagarParcela(negocioId, vendaId, numero) {
  const parcela = await vendaRepository.buscarParcela(negocioId, vendaId, numero);
  if (!parcela) {
    throw new AppError('Parcela não encontrada.', 404);
  }
  if (parcela.pagoEm) {
    throw new AppError('Parcela já está paga.', 409);
  }
  return vendaRepository.marcarParcelaPaga(parcela.id);
}

function listar(negocioId) {
  return vendaRepository.listarPorNegocio(negocioId);
}

async function buscarDetalhe(negocioId, id) {
  const venda = await vendaRepository.buscarPorId(negocioId, id);
  if (!venda) {
    throw new AppError('Venda não encontrada.', 404);
  }
  return venda;
}

module.exports = { registrar, pagarParcela, listar, buscarDetalhe };
