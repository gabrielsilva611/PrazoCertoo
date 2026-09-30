const dashboardService = require('../services/dashboardService');

async function indicadores(req, res) {
  const dados = await dashboardService.obterIndicadores(req.usuario.negocioId);
  res.status(200).json(dados);
}

module.exports = { indicadores };
