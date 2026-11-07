const { Router } = require('express');
const inventarioController = require('../controllers/inventarioController');
const { autenticar } = require('../middlewares/authMiddleware');
const { permitir } = require('../middlewares/rbacMiddleware');

const router = Router();

// RF28, RN13: inventário físico — realizado exclusivamente pelo perfil Dono.
router.use(autenticar, permitir('DONO'));

router.get('/', inventarioController.listar);
router.get('/:id', inventarioController.detalhar);
router.post('/', inventarioController.abrir);
router.put('/:id/itens', inventarioController.registrarItem);
router.patch('/:id/concluir', inventarioController.concluir);

module.exports = router;
