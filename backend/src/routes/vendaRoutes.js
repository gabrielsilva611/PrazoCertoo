const { Router } = require('express');
const vendaController = require('../controllers/vendaController');
const cobrancaController = require('../controllers/cobrancaController');
const { autenticar } = require('../middlewares/authMiddleware');

const router = Router();

router.use(autenticar);

router.get('/', vendaController.listar);
router.get('/:id', vendaController.detalhar);
router.post('/', vendaController.registrar);
router.patch('/:id/parcelas/:numero/pagar', vendaController.pagarParcela);
router.post('/:id/parcelas/:numero/cobrar', cobrancaController.gerar);

module.exports = router;
