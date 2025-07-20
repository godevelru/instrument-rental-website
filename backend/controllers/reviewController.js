import { Review } from '../models/Review.js';
import { Tool } from '../models/Tool.js';
import { Order } from '../models/Order.js';

export const reviewController = {
  // Создать отзыв
  async createReview(req, res) {
    try {
      const {
        toolId,
        orderId,
        rating,
        title,
        comment,
        pros,
        cons,
        wouldRecommend
      } = req.body;

      // Проверяем, существует ли инструмент
      const tool = await Tool.findById(toolId);
      if (!tool) {
        return res.status(404).json({
          success: false,
          message: 'Инструмент не найден'
        });
      }

      // Проверяем, что пользователь действительно арендовал этот инструмент
      let isVerified = false;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && order.customerId === req.user.userId) {
          const hasThisTool = order.items.some(item => item.toolId === toolId);
          if (hasThisTool && order.status === 'completed') {
            isVerified = true;
          }
        }
      }

      // Проверяем, не оставлял ли пользователь уже отзыв на этот инструмент
      const existingReview = await Review.findAll({
        toolId,
        customerId: req.user.userId
      });

      if (existingReview.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Вы уже оставили отзыв на этот инструмент'
        });
      }

      const review = await Review.create({
        toolId,
        customerId: req.user.userId,
        orderId,
        rating,
        title,
        comment,
        pros,
        cons,
        wouldRecommend,
        isVerified
      });

      // Обновляем рейтинг инструмента
      const toolRating = await Review.getToolRating(toolId);
      await Tool.updateRating(toolId, toolRating.rating, toolRating.count);

      res.status(201).json({
        success: true,
        message: 'Отзыв успешно создан',
        data: review
      });
    } catch (error) {
      console.error('Ошибка создания отзыва:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить отзывы по инструменту
  async getToolReviews(req, res) {
    try {
      const { toolId } = req.params;
      const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

      const reviews = await Review.findByTool(toolId);

      // Сортировка
      reviews.sort((a, b) => {
        let aVal = a[sort];
        let bVal = b[sort];
        
        if (sort === 'createdAt') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (order === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });

      // Пагинация
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + Number(limit);
      const paginatedReviews = reviews.slice(startIndex, endIndex);

      // Получаем рейтинг инструмента
      const rating = await Review.getToolRating(toolId);

      res.json({
        success: true,
        data: {
          reviews: paginatedReviews,
          rating,
          pagination: {
            current: Number(page),
            total: Math.ceil(reviews.length / limit),
            count: paginatedReviews.length,
            totalItems: reviews.length
          }
        }
      });
    } catch (error) {
      console.error('Ошибка получения отзывов:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить отзывы пользователя
  async getUserReviews(req, res) {
    try {
      const reviews = await Review.findByCustomer(req.user.userId);
      
      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      console.error('Ошибка получения отзывов пользователя:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить все отзывы (только для админов)
  async getAllReviews(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      let query = {};
      if (status === 'pending') {
        query.isApproved = false;
      } else if (status === 'approved') {
        query.isApproved = true;
      }

      const reviews = await Review.findAll(query);

      // Сортировка по дате создания (новые сначала)
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Пагинация
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + Number(limit);
      const paginatedReviews = reviews.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          reviews: paginatedReviews,
          pagination: {
            current: Number(page),
            total: Math.ceil(reviews.length / limit),
            count: paginatedReviews.length,
            totalItems: reviews.length
          }
        }
      });
    } catch (error) {
      console.error('Ошибка получения всех отзывов:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Одобрить отзыв (только для админов)
  async approveReview(req, res) {
    try {
      const { id } = req.params;

      const approved = await Review.approve(id);
      if (!approved) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден'
        });
      }

      // Обновляем рейтинг инструмента
      const review = await Review.findById(id);
      if (review) {
        const toolRating = await Review.getToolRating(review.toolId);
        await Tool.updateRating(review.toolId, toolRating.rating, toolRating.count);
      }

      res.json({
        success: true,
        message: 'Отзыв одобрен'
      });
    } catch (error) {
      console.error('Ошибка одобрения отзыва:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Отклонить отзыв (только для админов)
  async rejectReview(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const rejected = await Review.reject(id, reason);
      if (!rejected) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден'
        });
      }

      res.json({
        success: true,
        message: 'Отзыв отклонен'
      });
    } catch (error) {
      console.error('Ошибка отклонения отзыва:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Добавить ответ на отзыв (только для админов)
  async addResponse(req, res) {
    try {
      const { id } = req.params;
      const { response } = req.body;

      const updated = await Review.addResponse(id, {
        text: response,
        author: req.user.userId,
        createdAt: new Date().toISOString()
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден'
        });
      }

      res.json({
        success: true,
        message: 'Ответ добавлен'
      });
    } catch (error) {
      console.error('Ошибка добавления ответа:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Отметить отзыв как полезный
  async markHelpful(req, res) {
    try {
      const { id } = req.params;

      const updated = await Review.addHelpfulVote(id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден'
        });
      }

      res.json({
        success: true,
        message: 'Голос учтен'
      });
    } catch (error) {
      console.error('Ошибка голосования:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Пожаловаться на отзыв
  async reportReview(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const updated = await Review.reportReview(id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден'
        });
      }

      res.json({
        success: true,
        message: 'Жалоба отправлена'
      });
    } catch (error) {
      console.error('Ошибка отправки жалобы:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Удалить отзыв
  async deleteReview(req, res) {
    try {
      const { id } = req.params;

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден'
        });
      }

      // Проверяем права доступа
      if (req.user.role !== 'admin' && review.customerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для удаления этого отзыва'
        });
      }

      const deleted = await Review.delete(id);
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Ошибка удаления отзыва'
        });
      }

      // Обновляем рейтинг инструмента
      const toolRating = await Review.getToolRating(review.toolId);
      await Tool.updateRating(review.toolId, toolRating.rating, toolRating.count);

      res.json({
        success: true,
        message: 'Отзыв удален'
      });
    } catch (error) {
      console.error('Ошибка удаления отзыва:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }
};