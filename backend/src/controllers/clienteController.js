const { z } = require('zod');
const clienteService = require('../services/clienteService');

const criarSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto.'),
  telefone: z.string().min(8, 'Telefone inválido.'),
  email: z.email('E-mail inválido.').optional(),
  cpf: z.string().optional(),
  observacoes: z.string().optional(),
});

const atualizarSchema = criarSchema.partial();

async function listar(req, res) {
  const { busca, incluirInativos } = req.query;
  const clientes = await clienteService.listar(req.usuario.negocioId, {
    busca,
    incluirInativos: incluirInativos === 'true',
  });
  res.status(200).json({ clientes });
}

async function detalhar(req, res) {
  const cliente = await clienteService.buscarDetalhe(req.usuario.negocioId, req.params.id);
  res.status(200).json({ cliente });
}

async function criar(req, res) {
  const dados = criarSchema.parse(req.body);
  const cliente = await clienteService.criar(req.usuario.negocioId, dados);
  res.status(201).json({ cliente });
}

async function atualizar(req, res) {
  const dados = atualizarSchema.parse(req.body);
  const cliente = await clienteService.atualizar(req.usuario.negocioId, req.params.id, dados);
  res.status(200).json({ cliente });
}

async function desativar(req, res) {
  await clienteService.desativar(req.usuario.negocioId, req.params.id);
  res.status(204).send();
}

module.exports = { listar, detalhar, criar, atualizar, desativar };
