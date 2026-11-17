const relatorioService = require('../services/relatorioService');
const AppError = require('../lib/AppError');

function parseData(valor, nomeCampo) {
  if (!valor) return null;
  const data = new Date(`${valor}T00:00:00Z`);
  if (Number.isNaN(data.getTime())) {
    throw new AppError(`Data inválida em "${nomeCampo}".`, 400);
  }
  return data;
}

async function vendas(req, res) {
  const inicio = parseData(req.query.inicio, 'inicio');
  const fim = parseData(req.query.fim, 'fim');
  const dados = await relatorioService.relatorioVendas(req.usuario.negocioId, { inicio, fim });
  res.status(200).json(dados);
}

async function inadimplencia(req, res) {
  const dados = await relatorioService.relatorioInadimplencia(req.usuario.negocioId);
  res.status(200).json(dados);
}

async function estoque(req, res) {
  const dados = await relatorioService.relatorioEstoque(req.usuario.negocioId);
  res.status(200).json(dados);
}

module.exports = { vendas, inadimplencia, estoque };
