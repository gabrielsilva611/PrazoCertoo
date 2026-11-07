const { z } = require('zod');
const movimentacaoService = require('../services/movimentacaoEstoqueService');

const registrarSchema = z
  .object({
    tipo: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE']),
    quantidade: z.number().int(),
    motivo: z.string().optional(),
    fornecedorId: z.uuid('Fornecedor inválido.').optional(),
  })
  .refine((dados) => (dados.tipo === 'AJUSTE' ? dados.quantidade !== 0 : dados.quantidade > 0), {
    message: 'Quantidade inválida para o tipo de movimentação.',
    path: ['quantidade'],
  });

async function listar(req, res) {
  const movimentacoes = await movimentacaoService.listar(req.usuario.negocioId, req.params.produtoId);
  res.status(200).json({ movimentacoes });
}

async function registrar(req, res) {
  const dados = registrarSchema.parse(req.body);
  const movimentacao = await movimentacaoService.registrar(req.usuario.negocioId, req.params.produtoId, {
    ...dados,
    usuarioId: req.usuario.id,
  });
  res.status(201).json({ movimentacao });
}

module.exports = { listar, registrar };
