const { Router } = require('express');
const fornecedorController = require('../controllers/fornecedorController');
const { autenticar } = require('../middlewares/authMiddleware');
const { permitir } = require('../middlewares/rbacMiddleware');

const router = Router();

router.use(autenticar);

router.get('/', fornecedorController.listar);
router.post('/', fornecedorController.criar);
router.put('/:id', fornecedorController.atualizar);
router.delete('/:id', permitir('DONO'), fornecedorController.excluir);

module.exports = router;
