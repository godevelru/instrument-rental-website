import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';

const router = express.Router();

// Регистрация
router.post('/register', validateRegistration, authController.register);

// Авторизация
router.post('/login', validateLogin, authController.login);

// Получение профиля
router.get('/profile', authenticateToken, authController.getProfile);

// Обновление профиля
router.put('/profile', authenticateToken, authController.updateProfile);

// Смена пароля
router.put('/change-password', authenticateToken, authController.changePassword);

export default router;