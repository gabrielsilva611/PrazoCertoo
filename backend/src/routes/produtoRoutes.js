const { Router } = require('express');
const produtoController = require('../controllers/produtoController');
const movimentacaoRoutes = require('./movimentacaoEstoqueRoutes');
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
// RF23-26: histórico de movimentações de estoque do produto.
router.use('/:produtoId/movimentacoes', movimentacaoRoutes);

module.exports = router;
