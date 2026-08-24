const { ZodError } = require('zod');
const AppError = require('../lib/AppError');

// Middleware de erro precisa dos 4 parâmetros — é assim que o Express o reconhece.
function tratarErros(erro, req, res, next) {
  if (erro instanceof ZodError) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.issues });
  }

  if (erro instanceof AppError) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { tratarErros };
