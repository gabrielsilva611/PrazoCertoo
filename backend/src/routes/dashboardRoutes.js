const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');
const { autenticar } = require('../middlewares/authMiddleware');
const { permitir } = require('../middlewares/rbacMiddleware');

const router = Router();

// RN03: apenas o perfil Dono pode visualizar o dashboard gerencial.
router.use(autenticar, permitir('DONO'));

router.get('/', dashboardController.indicadores);

module.exports = router;
