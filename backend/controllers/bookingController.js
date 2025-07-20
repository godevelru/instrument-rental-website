import { Booking } from '../models/Booking.js';
import { Tool } from '../models/Tool.js';

export const bookingController = {
  // Создать бронирование
  async createBooking(req, res) {
    try {
      const {
        toolId,
        startDate,
        endDate,
        quantity = 1,
        notes
      } = req.body;

      // Проверяем, существует ли инструмент
      const tool = await Tool.findById(toolId);
      if (!tool) {
        return res.status(404).json({
          success: false,
          message: 'Инструмент не найден'
        });
      }

      // Проверяем доступность
      const available = await Booking.isAvailable(toolId, startDate, endDate, quantity);
      if (!available) {
        return res.status(400).json({
          success: false,
          message: 'Инструмент недоступен на выбранные даты'
        });
      }

      // Рассчитываем стоимость
      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      const totalPrice = tool.price * quantity * days;

      const booking = await Booking.create({
        toolId,
        customerId: req.user.userId,
        startDate,
        endDate,
        quantity,
        pricePerDay: tool.price,
        totalPrice,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Бронирование успешно создано',
        data: booking
      });
    } catch (error) {
      console.error('Ошибка создания бронирования:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить бронирования пользователя
  async getUserBookings(req, res) {
    try {
      const { status } = req.query;
      
      let bookings = await Booking.findByCustomer(req.user.userId);
      
      if (status) {
        bookings = bookings.filter(booking => booking.status === status);
      }

      // Сортировка по дате создания (новые сначала)
      bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      console.error('Ошибка получения бронирований:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить все бронирования (только для админов)
  async getAllBookings(req, res) {
    try {
      const { status, toolId, page = 1, limit = 20 } = req.query;

      let query = {};
      if (status) query.status = status;
      if (toolId) query.toolId = toolId;

      const bookings = await Booking.findAll(query);

      // Сортировка по дате создания (новые сначала)
      bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Пагинация
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + Number(limit);
      const paginatedBookings = bookings.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          bookings: paginatedBookings,
          pagination: {
            current: Number(page),
            total: Math.ceil(bookings.length / limit),
            count: paginatedBookings.length,
            totalItems: bookings.length
          }
        }
      });
    } catch (error) {
      console.error('Ошибка получения всех бронирований:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить бронирование по ID
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      
      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Бронирование не найдено'
        });
      }

      // Проверяем права доступа
      if (req.user.role !== 'admin' && booking.customerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Нет доступа к этому бронированию'
        });
      }

      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Ошибка получения бронирования:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Подтвердить бронирование (только для админов)
  async confirmBooking(req, res) {
    try {
      const { id } = req.params;

      const confirmed = await Booking.confirm(id);
      if (!confirmed) {
        return res.status(400).json({
          success: false,
          message: 'Не удалось подтвердить бронирование. Возможно, инструмент уже недоступен.'
        });
      }

      res.json({
        success: true,
        message: 'Бронирование подтверждено'
      });
    } catch (error) {
      console.error('Ошибка подтверждения бронирования:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Отменить бронирование
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Бронирование не найдено'
        });
      }

      // Проверяем права доступа
      if (req.user.role !== 'admin' && booking.customerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для отмены этого бронирования'
        });
      }

      const cancelled = await Booking.cancel(id, reason || 'Отменено пользователем');
      if (!cancelled) {
        return res.status(500).json({
          success: false,
          message: 'Ошибка отмены бронирования'
        });
      }

      res.json({
        success: true,
        message: 'Бронирование отменено'
      });
    } catch (error) {
      console.error('Ошибка отмены бронирования:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Обновить бронирование
  async updateBooking(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, quantity, notes } = req.body;

      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Бронирование не найдено'
        });
      }

      // Проверяем права доступа
      if (req.user.role !== 'admin' && booking.customerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для изменения этого бронирования'
        });
      }

      // Можно изменить только ожидающие бронирования
      if (booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Можно изменить только ожидающие бронирования'
        });
      }

      // Если изменяются даты или количество, проверяем доступность
      if (startDate || endDate || quantity) {
        const newStartDate = startDate || booking.startDate;
        const newEndDate = endDate || booking.endDate;
        const newQuantity = quantity || booking.quantity;

        const available = await Booking.isAvailable(
          booking.toolId,
          newStartDate,
          newEndDate,
          newQuantity
        );

        if (!available) {
          return res.status(400).json({
            success: false,
            message: 'Инструмент недоступен на новые даты'
          });
        }

        // Пересчитываем стоимость
        if (startDate || endDate || quantity) {
          const tool = await Tool.findById(booking.toolId);
          const days = Math.ceil((new Date(newEndDate) - new Date(newStartDate)) / (1000 * 60 * 60 * 24));
          const totalPrice = tool.price * newQuantity * days;

          await Booking.update(id, {
            startDate: newStartDate,
            endDate: newEndDate,
            quantity: newQuantity,
            totalPrice,
            notes: notes || booking.notes
          });
        }
      } else if (notes) {
        await Booking.update(id, { notes });
      }

      res.json({
        success: true,
        message: 'Бронирование обновлено'
      });
    } catch (error) {
      console.error('Ошибка обновления бронирования:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Удалить бронирование
  async deleteBooking(req, res) {
    try {
      const { id } = req.params;

      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Бронирование не найдено'
        });
      }

      // Проверяем права доступа
      if (req.user.role !== 'admin' && booking.customerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для удаления этого бронирования'
        });
      }

      const deleted = await Booking.delete(id);
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Ошибка удаления бронирования'
        });
      }

      res.json({
        success: true,
        message: 'Бронирование удалено'
      });
    } catch (error) {
      console.error('Ошибка удаления бронирования:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Очистить просроченные бронирования
  async cleanupExpiredBookings(req, res) {
    try {
      const expiredCount = await Booking.expireOldBookings();
      
      res.json({
        success: true,
        message: `Обработано ${expiredCount} просроченных бронирований`
      });
    } catch (error) {
      console.error('Ошибка очистки просроченных бронирований:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }
};