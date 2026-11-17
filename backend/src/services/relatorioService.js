const relatorioRepository = require('../repositories/relatorioRepository');
const produtoService = require('./produtoService');
const { statusParcela } = require('../lib/parcelaUtil');
const AppError = require('../lib/AppError');

// Relatório de vendas por período (filtra pela data de início do acordo).
async function relatorioVendas(negocioId, { inicio, fim }) {
  if (!inicio || !fim || inicio > fim) {
    throw new AppError('Informe um período válido (início antes do fim).', 400);
  }

  const vendas = await relatorioRepository.listarVendasPorPeriodo(negocioId, inicio, fim);
  const totalVendido = vendas.reduce((soma, venda) => soma + Number(venda.valorTotal), 0);

  return { vendas, totalVendido, totalAcordos: vendas.length };
}

// Relatório de inadimplência: toda parcela em aberto, agrupada por cliente,
// do maior valor em atraso pro menor (é quem o Dono provavelmente quer
// cobrar primeiro).
async function relatorioInadimplencia(negocioId) {
  const parcelas = await relatorioRepository.listarParcelasEmAberto(negocioId);
  const agora = new Date();

  const porCliente = new Map();
  for (const parcela of parcelas) {
    const clienteId = parcela.venda.clienteId;
    const status = statusParcela(parcela, agora);
    const atual = porCliente.get(clienteId) ?? {
      clienteId,
      nome: parcela.venda.cliente.nome,
      totalPendente: 0,
      totalAtrasado: 0,
      parcelasPendentes: 0,
      parcelasAtrasadas: 0,
    };

    const valor = Number(parcela.valor);
    atual.totalPendente += valor;
    atual.parcelasPendentes += 1;
    if (status === 'ATRASADO') {
      atual.totalAtrasado += valor;
      atual.parcelasAtrasadas += 1;
    }

    porCliente.set(clienteId, atual);
  }

  const clientes = [...porCliente.values()].sort((a, b) => b.totalAtrasado - a.totalAtrasado);
  const totalEmAberto = clientes.reduce((soma, c) => soma + c.totalPendente, 0);
  const totalAtrasado = clientes.reduce((soma, c) => soma + c.totalAtrasado, 0);

  return { clientes, totalEmAberto, totalAtrasado };
}

// Relatório de estoque: reusa o cálculo de capital imobilizado já usado na
// listagem de produtos (RF27), só soma o total do negócio por cima.
async function relatorioEstoque(negocioId) {
  const produtos = await produtoService.listar(negocioId);
  const totalCapitalImobilizado = produtos.reduce((soma, p) => soma + p.capitalImobilizado, 0);
  const abaixoDoMinimo = produtos.filter((p) => p.saldoAtual < p.estoqueMinimo);

  return { produtos, totalCapitalImobilizado, totalAbaixoDoMinimo: abaixoDoMinimo.length };
}

module.exports = { relatorioVendas, relatorioInadimplencia, relatorioEstoque };
