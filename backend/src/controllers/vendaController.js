const { z } = require('zod');
const vendaService = require('../services/vendaService');
const { statusParcela } = require('../lib/parcelaUtil');

const registrarSchema = z.object({
  clienteId: z.uuid('Cliente inválido.'),
  produtoId: z.uuid('Produto inválido.').optional(),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  valorTotal: z.number().positive('Valor total deve ser maior que zero.'),
  numParcelas: z.number().int().min(1, 'Número de parcelas deve ser ao menos 1.'),
  dataInicio: z.coerce.date('Data de início inválida.'),
  intervaloDias: z.number().int().positive().optional(),
  justificativaEstoque: z.string().optional(),
});

function comStatusDasParcelas(venda) {
  if (!venda.parcelas) return venda;
  return { ...venda, parcelas: venda.parcelas.map((p) => ({ ...p, status: statusParcela(p) })) };
}

async function registrar(req, res) {
  const dados = registrarSchema.parse(req.body);
  const venda = await vendaService.registrar(req.usuario.negocioId, {
    ...dados,
    usuarioId: req.usuario.id,
  });
  res.status(201).json({ venda: comStatusDasParcelas(venda) });
}

async function listar(req, res) {
  const vendas = await vendaService.listar(req.usuario.negocioId);
  res.status(200).json({ vendas: vendas.map(comStatusDasParcelas) });
}

async function detalhar(req, res) {
  const venda = await vendaService.buscarDetalhe(req.usuario.negocioId, req.params.id);
  res.status(200).json({ venda: comStatusDasParcelas(venda) });
}

async function pagarParcela(req, res) {
  const numero = Number(req.params.numero);
  const parcela = await vendaService.pagarParcela(req.usuario.negocioId, req.params.id, numero);
  res.status(200).json({ parcela: { ...parcela, status: statusParcela(parcela) } });
}

module.exports = { registrar, listar, detalhar, pagarParcela };
