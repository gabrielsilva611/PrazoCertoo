const { z } = require('zod');
const configuracaoService = require('../services/configuracaoService');

const atualizarSchema = z.object({
  corDestaque: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida — use o formato #RRGGBB.'),
});

async function obter(req, res) {
  const configuracao = await configuracaoService.obter(req.usuario.negocioId);
  res.status(200).json(configuracao);
}

async function atualizar(req, res) {
  const dados = atualizarSchema.parse(req.body);
  const configuracao = await configuracaoService.atualizarCorDestaque(req.usuario.negocioId, dados.corDestaque);
  res.status(200).json(configuracao);
}

module.exports = { obter, atualizar };
