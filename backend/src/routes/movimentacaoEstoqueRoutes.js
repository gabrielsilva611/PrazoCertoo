const { Router } = require('express');
const movimentacaoController = require('../controllers/movimentacaoEstoqueController');

// mergeParams: precisa ler :produtoId, definido no router pai (produtoRoutes).
const router = Router({ mergeParams: true });

router.get('/', movimentacaoController.listar);
router.post('/', movimentacaoController.registrar);

module.exports = router;
