const { Router } = require('express');
const categoriaController = require('../controllers/categoriaController');
const { autenticar } = require('../middlewares/authMiddleware');
const { permitir } = require('../middlewares/rbacMiddleware');

const router = Router();

router.use(autenticar);

router.get('/', categoriaController.listar);
router.post('/', categoriaController.criar);
router.put('/:id', categoriaController.atualizar);
router.delete('/:id', permitir('DONO'), categoriaController.excluir);

module.exports = router;
