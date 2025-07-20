import express from 'express';
import { reviewController } from '../controllers/reviewController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateReviewCreation } from '../middleware/validation.js';

const router = express.Router();

// Создать отзыв
router.post('/', authenticateToken, validateReviewCreation, reviewController.createReview);

// Получить отзывы пользователя
router.get('/my', authenticateToken, reviewController.getUserReviews);

// Получить отзывы по инструменту
router.get('/tool/:toolId', reviewController.getToolReviews);

// Получить все отзывы (только для админов)
router.get('/', authenticateToken, requireAdmin, reviewController.getAllReviews);

// Одобрить отзыв (только для админов)
router.put('/:id/approve', authenticateToken, requireAdmin, reviewController.approveReview);

// Отклонить отзыв (только для админов)
router.put('/:id/reject', authenticateToken, requireAdmin, reviewController.rejectReview);

// Добавить ответ на отзыв (только для админов)
router.post('/:id/response', authenticateToken, requireAdmin, reviewController.addResponse);

// Отметить отзыв как полезный
router.post('/:id/helpful', reviewController.markHelpful);

// Пожаловаться на отзыв
router.post('/:id/report', reviewController.reportReview);

// Удалить отзыв
router.delete('/:id', authenticateToken, reviewController.deleteReview);

export default router;