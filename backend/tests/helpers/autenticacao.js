const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../../src/lib/prisma');

// RN03/RN13: helper pra testar rotas restritas ao Dono — cria um Funcionário
// de teste direto no banco (não há endpoint de convite ainda) e assina o
// token dele.
async function criarTokenFuncionario(negocioId) {
  const id = crypto.randomUUID();
  await prisma.usuario.create({
    data: {
      id,
      negocioId,
      nome: 'Funcionário de Teste',
      email: `teste-funcionario-${Date.now()}@exemplo.com`,
      senhaHash: 'hash-fake-nao-usado-no-login',
      perfil: 'FUNCIONARIO',
    },
  });
  return jwt.sign({ sub: id, negocioId, perfil: 'FUNCIONARIO' }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
}

module.exports = { criarTokenFuncionario };
