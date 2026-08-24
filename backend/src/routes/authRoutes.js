const { Router } = require('express');
const authController = require('../controllers/authController');
const { autenticar } = require('../middlewares/authMiddleware');

const router = Router();

router.post('/registro', authController.registrar);
router.post('/login', authController.login);
router.get('/me', autenticar, authController.me);

module.exports = router;
