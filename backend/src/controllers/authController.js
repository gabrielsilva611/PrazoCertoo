const { z } = require('zod');
const authService = require('../services/authService');

const registroSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto.'),
  email: z.email('E-mail inválido.'),
  senha: z.string().min(8, 'Senha deve ter ao menos 8 caracteres.'),
});

const loginSchema = z.object({
  email: z.email('E-mail inválido.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
});

async function registrar(req, res) {
  const dados = registroSchema.parse(req.body);
  const resultado = await authService.registrarDono(dados);
  res.status(201).json(resultado);
}

async function login(req, res) {
  const dados = loginSchema.parse(req.body);
  const resultado = await authService.login(dados);
  res.status(200).json(resultado);
}

function me(req, res) {
  res.status(200).json({ usuario: req.usuario });
}

module.exports = { registrar, login, me };
