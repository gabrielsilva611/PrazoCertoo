const { z } = require('zod');
const produtoService = require('../services/produtoService');

// saldoAtual não entra no schema de criação/edição — só muda via
// movimentação de estoque (entrada/saída/ajuste), nunca por edição direta.
const criarSchema = z.object({
  categoriaId: z.uuid('Categoria inválida.').nullable().optional(),
  nome: z.string().min(2, 'Nome muito curto.'),
  unidade: z.string().min(1, 'Unidade é obrigatória.'),
  precoCusto: z.number().nonnegative('Preço de custo não pode ser negativo.'),
  precoVenda: z.number().nonnegative('Preço de venda não pode ser negativo.'),
  estoqueMinimo: z.number().int().nonnegative('Estoque mínimo não pode ser negativo.'),
});

const atualizarSchema = criarSchema.partial();

const listarQuerySchema = z.object({
  busca: z.string().optional(),
  incluirInativos: z.string().optional(),
  categoriaId: z.uuid('Categoria inválida.').optional(),
});

async function listar(req, res) {
  const { busca, incluirInativos, categoriaId } = listarQuerySchema.parse(req.query);
  const produtos = await produtoService.listar(req.usuario.negocioId, {
    busca,
    incluirInativos: incluirInativos === 'true',
    categoriaId,
  });
  res.status(200).json({ produtos });
}

async function detalhar(req, res) {
  const produto = await produtoService.buscarDetalhe(req.usuario.negocioId, req.params.id);
  res.status(200).json({ produto });
}

async function criar(req, res) {
  const dados = criarSchema.parse(req.body);
  const produto = await produtoService.criar(req.usuario.negocioId, dados);
  res.status(201).json({ produto });
}

async function atualizar(req, res) {
  const dados = atualizarSchema.parse(req.body);
  const produto = await produtoService.atualizar(req.usuario.negocioId, req.params.id, dados);
  res.status(200).json({ produto });
}

async function desativar(req, res) {
  await produtoService.desativar(req.usuario.negocioId, req.params.id);
  res.status(204).send();
}

module.exports = { listar, detalhar, criar, atualizar, desativar };
