import express from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { validateOrderCreation } from '../middleware/validation.js';

const router = express.Router();

// Создать заказ
router.post('/', optionalAuth, validateOrderCreation, orderController.createOrder);

// Получить все заказы
router.get('/', authenticateToken, orderController.getAllOrders);

// Получить заказ по ID
router.get('/:id', authenticateToken, orderController.getOrderById);

// Обновить статус заказа (только для админов)
router.put('/:id/status', authenticateToken, requireAdmin, orderController.updateOrderStatus);

// Отменить заказ
router.put('/:id/cancel', authenticateToken, orderController.cancelOrder);

// Добавить примечание к заказу
router.post('/:id/notes', authenticateToken, orderController.addOrderNote);

// Получить статистику заказов (только для админов)
router.get('/meta/statistics', authenticateToken, requireAdmin, orderController.getOrderStatistics);

export default router;