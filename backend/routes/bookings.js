import express from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateBookingCreation } from '../middleware/validation.js';

const router = express.Router();

// Создать бронирование
router.post('/', authenticateToken, validateBookingCreation, bookingController.createBooking);

// Получить бронирования пользователя
router.get('/my', authenticateToken, bookingController.getUserBookings);

// Получить все бронирования (только для админов)
router.get('/', authenticateToken, requireAdmin, bookingController.getAllBookings);

// Получить бронирование по ID
router.get('/:id', authenticateToken, bookingController.getBookingById);

// Подтвердить бронирование (только для админов)
router.put('/:id/confirm', authenticateToken, requireAdmin, bookingController.confirmBooking);

// Отменить бронирование
router.put('/:id/cancel', authenticateToken, bookingController.cancelBooking);

// Обновить бронирование
router.put('/:id', authenticateToken, bookingController.updateBooking);

// Удалить бронирование
router.delete('/:id', authenticateToken, bookingController.deleteBooking);

// Очистить просроченные бронирования (только для админов)
router.post('/cleanup/expired', authenticateToken, requireAdmin, bookingController.cleanupExpiredBookings);

export default router;