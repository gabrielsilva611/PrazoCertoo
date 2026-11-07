const { z } = require('zod');
const inventarioService = require('../services/inventarioService');

const registrarItemSchema = z.object({
  produtoId: z.uuid('Produto inválido.'),
  saldoFisico: z.number().int().nonnegative('Saldo físico não pode ser negativo.'),
  justificativa: z.string().optional(),
});

async function abrir(req, res) {
  const inventario = await inventarioService.abrir(req.usuario.negocioId, req.usuario.id);
  res.status(201).json({ inventario });
}

async function listar(req, res) {
  const inventarios = await inventarioService.listar(req.usuario.negocioId);
  res.status(200).json({ inventarios });
}

async function detalhar(req, res) {
  const inventario = await inventarioService.buscarDetalhe(req.usuario.negocioId, req.params.id);
  res.status(200).json({ inventario });
}

async function registrarItem(req, res) {
  const dados = registrarItemSchema.parse(req.body);
  const item = await inventarioService.registrarItem(req.usuario.negocioId, req.params.id, dados);
  res.status(200).json({ item });
}

async function concluir(req, res) {
  const inventario = await inventarioService.concluir(req.usuario.negocioId, req.params.id, req.usuario.id);
  res.status(200).json({ inventario });
}

module.exports = { abrir, listar, detalhar, registrarItem, concluir };
