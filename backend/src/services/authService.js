const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');

const CUSTO_HASH = 12; // RNF06, Seção 6.1 do RFC
const EXPIRACAO_TOKEN = '8h'; // Seção 6.1 do RFC

class AuthError extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

// Cria o primeiro usuário de um negócio. O Dono é o próprio "negócio":
// negocioId aponta pro seu próprio id (RN08, RN15 — isolamento multi-tenant).
async function registrarDono({ nome, email, senha }) {
  const existente = await usuarioRepository.buscarPorEmail(email);
  if (existente) {
    throw new AuthError('E-mail já cadastrado.', 409);
  }

  const id = crypto.randomUUID();
  const senhaHash = await bcrypt.hash(senha, CUSTO_HASH);

  const usuario = await usuarioRepository.criar({
    id,
    negocioId: id,
    nome,
    email,
    senhaHash,
    perfil: 'DONO',
  });

  return montarRespostaLogin(usuario);
}

// RF01, FA01: credenciais inválidas retornam a mesma mensagem genérica,
// sem revelar se o e-mail existe ou não.
async function login({ email, senha }) {
  const usuario = await usuarioRepository.buscarPorEmail(email);
  const senhaConfere = usuario && (await bcrypt.compare(senha, usuario.senhaHash));

  if (!senhaConfere) {
    throw new AuthError('E-mail ou senha incorretos.', 401);
  }

  return montarRespostaLogin(usuario);
}

function montarRespostaLogin(usuario) {
  const token = jwt.sign(
    { sub: usuario.id, negocioId: usuario.negocioId, perfil: usuario.perfil },
    process.env.JWT_SECRET,
    { expiresIn: EXPIRACAO_TOKEN },
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    },
  };
}

module.exports = { registrarDono, login, AuthError };
