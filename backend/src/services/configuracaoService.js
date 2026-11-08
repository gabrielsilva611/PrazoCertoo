const usuarioRepository = require('../repositories/usuarioRepository');
const AppError = require('../lib/AppError');

async function obter(negocioId) {
  const usuario = await usuarioRepository.buscarPorId(negocioId);
  if (!usuario) {
    throw new AppError('Negócio não encontrado.', 404);
  }
  return { corDestaque: usuario.corDestaque };
}

async function atualizarCorDestaque(negocioId, corDestaque) {
  const usuario = await usuarioRepository.atualizarCorDestaque(negocioId, corDestaque);
  return { corDestaque: usuario.corDestaque };
}

module.exports = { obter, atualizarCorDestaque };
