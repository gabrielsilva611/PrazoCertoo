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
// explícita do usuário antes de deixar o saldo ficar negativo. A checagem em
// si (e o saldoAnterior/saldoPosterior) só é feita depois, dentro da
// transação de vendaRepository.criarComParcelas — aqui só confere que o
// produto existe.
async function montarMovimentacaoEstoque(negocioId, dados) {
  const produto = await produtoRepository.buscarPorId(negocioId, dados.produtoId);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }

  return {
    produtoId: produto.id,
    usuarioId: dados.usuarioId,
    tipo: 'SAIDA',
    delta: -QUANTIDADE_POR_VENDA,
    justificativaEstoque: dados.justificativaEstoque,
  };
}

// RF11: registro de pagamento da parcela — pode ser parcial (abate do saldo
// devedor, a parcela continua em aberto) ou total (saldo chega a 0, marca
// pagoEm). Juros é opcional: quando informado, soma sobre o saldo ANTES de
// abater o valor pago (ex: devia 100, juros de 5% vira 105, paga 105 = quita).
// Tudo em centavos, igual parcelaUtil.calcularParcelas, pra não acumular erro
// de ponto flutuante.
async function registrarPagamento(negocioId, vendaId, numero, { valorPago, percentualJuros = 0 }) {
  const parcela = await vendaRepository.buscarParcela(negocioId, vendaId, numero);
  if (!parcela) {
    throw new AppError('Parcela não encontrada.', 404);
  }
  if (parcela.pagoEm) {
    throw new AppError('Parcela já está paga.', 409);
  }

  const saldoCentavos = Math.round(Number(parcela.saldoDevedor) * 100);
  const jurosCentavos = Math.round(saldoCentavos * (percentualJuros / 100));
  const valorPagoCentavos = Math.round(valorPago * 100);
  const novoSaldoCentavos = Math.max(0, saldoCentavos + jurosCentavos - valorPagoCentavos);

  const novoSaldo = novoSaldoCentavos / 100;
  return vendaRepository.registrarPagamento(parcela.id, {
    saldoDevedor: novoSaldo,
    pagoEm: novoSaldo === 0 ? new Date() : null,
  });
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

module.exports = { registrar, registrarPagamento, listar, buscarDetalhe };
