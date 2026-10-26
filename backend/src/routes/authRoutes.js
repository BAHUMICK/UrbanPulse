const express = require('express');
const { authRateLimit, csrf, register, login, me, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.get('/csrf', csrf);
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

module.exports = router;
