// RF03, RN03, FA03: restringe rotas por perfil (ex: dashboard gerencial é só do Dono).
// Uso: router.get('/relatorios', autenticar, permitir('DONO'), controller)
function permitir(...perfis) {
  return (req, res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: 'Você não tem permissão para acessar esta área.' });
    }
    next();
  };
}

module.exports = { permitir };
