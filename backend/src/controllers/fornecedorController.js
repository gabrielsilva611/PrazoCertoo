const { z } = require('zod');
const fornecedorService = require('../services/fornecedorService');

const criarSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto.'),
  contato: z.string().optional(),
});

const atualizarSchema = criarSchema.partial();

async function listar(req, res) {
  const fornecedores = await fornecedorService.listar(req.usuario.negocioId);
  res.status(200).json({ fornecedores });
}

async function criar(req, res) {
  const dados = criarSchema.parse(req.body);
  const fornecedor = await fornecedorService.criar(req.usuario.negocioId, dados);
  res.status(201).json({ fornecedor });
}

async function atualizar(req, res) {
  const dados = atualizarSchema.parse(req.body);
  const fornecedor = await fornecedorService.atualizar(req.usuario.negocioId, req.params.id, dados);
  res.status(200).json({ fornecedor });
}

async function excluir(req, res) {
  await fornecedorService.excluir(req.usuario.negocioId, req.params.id);
  res.status(204).send();
}

module.exports = { listar, criar, atualizar, excluir };
