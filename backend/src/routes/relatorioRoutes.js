const { Router } = require('express');
const relatorioController = require('../controllers/relatorioController');
const { autenticar } = require('../middlewares/authMiddleware');
const { permitir } = require('../middlewares/rbacMiddleware');

const router = Router();

// Relatórios são visão gerencial, igual o dashboard — exclusivo do Dono.
router.use(autenticar, permitir('DONO'));

router.get('/vendas', relatorioController.vendas);
router.get('/inadimplencia', relatorioController.inadimplencia);
router.get('/estoque', relatorioController.estoque);

module.exports = router;
