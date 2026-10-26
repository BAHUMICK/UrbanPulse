const express = require('express');
const { authRateLimit, csrf, register, login, adminLogin, me, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.get('/csrf', csrf);
router.post('/register', authRateLimit, register);
router.post('/admin/login', authRateLimit, adminLogin);
router.post('/login', authRateLimit, login);
router.get('/me', authenticate, me);
// Logout is idempotent so an expired session can still clear its cookie.
router.post('/logout', logout);

module.exports = router;
