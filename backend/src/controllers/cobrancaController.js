const cobrancaService = require('../services/cobrancaService');

async function gerar(req, res) {
  const { id: vendaId, numero } = req.params;
  const resultado = await cobrancaService.gerarCobranca(
    req.usuario.negocioId,
    vendaId,
    Number(numero),
  );
  res.status(201).json(resultado);
}

module.exports = { gerar };
