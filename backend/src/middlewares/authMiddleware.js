const jwt = require('jsonwebtoken');

// RF01, Seção 6.1: valida o JWT em toda rota autenticada antes de liberar
// o acesso a qualquer Service ou Repository.
function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }

  const token = cabecalho.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = {
      id: payload.sub,
      negocioId: payload.negocioId,
      perfil: payload.perfil,
    };
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = { autenticar };
