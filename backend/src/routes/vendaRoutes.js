const { Router } = require('express');
const vendaController = require('../controllers/vendaController');
const { autenticar } = require('../middlewares/authMiddleware');

const router = Router();

router.use(autenticar);

router.get('/', vendaController.listar);
router.get('/:id', vendaController.detalhar);
router.post('/', vendaController.registrar);
router.patch('/:id/parcelas/:numero/pagar', vendaController.pagarParcela);

module.exports = router;
