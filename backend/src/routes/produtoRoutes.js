const { Router } = require('express');
const produtoController = require('../controllers/produtoController');
const { autenticar } = require('../middlewares/authMiddleware');
const { permitir } = require('../middlewares/rbacMiddleware');

const router = Router();

router.use(autenticar);

router.get('/', produtoController.listar);
router.get('/:id', produtoController.detalhar);
router.post('/', produtoController.criar);
router.put('/:id', produtoController.atualizar);
// RN04: desativação é uma forma de remoção — reservada ao Dono, como excluir registros.
router.patch('/:id/desativar', permitir('DONO'), produtoController.desativar);

module.exports = router;
