const { Router } = require('express');
const configuracaoController = require('../controllers/configuracaoController');
const { autenticar } = require('../middlewares/authMiddleware');
const { permitir } = require('../middlewares/rbacMiddleware');

const router = Router();

// Configurações do negócio (hoje só a cor de destaque) — exclusivas do Dono.
router.use(autenticar, permitir('DONO'));

router.get('/', configuracaoController.obter);
router.put('/', configuracaoController.atualizar);

module.exports = router;
