import express from 'express';
import { toolController } from '../controllers/toolController.js';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { validateToolCreation } from '../middleware/validation.js';

const router = express.Router();

// Получить все инструменты
router.get('/', optionalAuth, toolController.getAllTools);

// Получить инструмент по ID
router.get('/:id', optionalAuth, toolController.getToolById);

// Получить категории
router.get('/meta/categories', toolController.getCategories);

// Получить популярные инструменты
router.get('/meta/popular', toolController.getPopularTools);

// Проверить доступность инструмента
router.get('/:id/availability', toolController.checkAvailability);

// Получить календарь бронирований
router.get('/:id/calendar', toolController.getBookingCalendar);

// Создать инструмент (только для админов)
router.post('/', authenticateToken, requireAdmin, validateToolCreation, toolController.createTool);

// Обновить инструмент (только для админов)
router.put('/:id', authenticateToken, requireAdmin, toolController.updateTool);

// Удалить инструмент (только для админов)
router.delete('/:id', authenticateToken, requireAdmin, toolController.deleteTool);

export default router;