const { Router } = require('express');
const clienteController = require('../controllers/clienteController');
const { autenticar } = require('../middlewares/authMiddleware');
const { permitir } = require('../middlewares/rbacMiddleware');

const router = Router();

router.use(autenticar);

router.get('/', clienteController.listar);
router.get('/:id', clienteController.detalhar);
router.post('/', clienteController.criar);
router.put('/:id', clienteController.atualizar);
// RN04: desativação é uma forma de remoção — reservada ao Dono, como excluir registros.
router.patch('/:id/desativar', permitir('DONO'), clienteController.desativar);

module.exports = router;
