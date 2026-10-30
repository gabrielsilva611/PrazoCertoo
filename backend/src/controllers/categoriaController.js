const { z } = require('zod');
const categoriaService = require('../services/categoriaService');

const criarSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto.'),
  descricao: z.string().optional(),
});

const atualizarSchema = criarSchema.partial();

async function listar(req, res) {
  const categorias = await categoriaService.listar(req.usuario.negocioId);
  res.status(200).json({ categorias });
}

async function criar(req, res) {
  const dados = criarSchema.parse(req.body);
  const categoria = await categoriaService.criar(req.usuario.negocioId, dados);
  res.status(201).json({ categoria });
}

async function atualizar(req, res) {
  const dados = atualizarSchema.parse(req.body);
  const categoria = await categoriaService.atualizar(req.usuario.negocioId, req.params.id, dados);
  res.status(200).json({ categoria });
}

async function excluir(req, res) {
  await categoriaService.excluir(req.usuario.negocioId, req.params.id);
  res.status(204).send();
}

module.exports = { listar, criar, atualizar, excluir };
