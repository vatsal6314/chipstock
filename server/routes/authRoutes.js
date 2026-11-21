const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Basic rate limiting for login attempts (15 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);
router.post('/generate-hash', authController.generateHash);

module.exports = router;
