import { Order } from '../models/Order.js';
import { Tool } from '../models/Tool.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';

export const orderController = {
  // Создать заказ
  async createOrder(req, res) {
    try {
      const {
        items, // [{ toolId, quantity, days }]
        startDate,
        endDate,
        customerInfo,
        deliveryInfo,
        paymentMethod,
        notes
      } = req.body;

      // Проверяем доступность всех инструментов
      for (const item of items) {
        const available = await Booking.isAvailable(
          item.toolId,
          startDate,
          endDate,
          item.quantity
        );

        if (!available) {
          const tool = await Tool.findById(item.toolId);
          return res.status(400).json({
            success: false,
            message: `Инструмент "${tool?.name}" недоступен на выбранные даты`
          });
        }
      }

      // Рассчитываем стоимость
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const tool = await Tool.findById(item.toolId);
        if (!tool) {
          return res.status(404).json({
            success: false,
            message: `Инструмент с ID ${item.toolId} не найден`
          });
        }

        const totalDays = Math.ceil(
          (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
        );

        const itemTotal = tool.price * item.quantity * totalDays;
        subtotal += itemTotal;

        orderItems.push({
          toolId: item.toolId,
          toolName: tool.name,
          quantity: item.quantity,
          pricePerDay: tool.price,
          days: totalDays,
          total: itemTotal
        });
      }

      const tax = subtotal * 0.2; // НДС 20%
      const total = subtotal + tax;
      const deposit = total * 0.5; // Залог 50%

      // Создаем заказ
      const order = await Order.create({
        customerId: req.user?.userId || null,
        customerInfo,
        items: orderItems,
        startDate,
        endDate,
        totalDays: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
        subtotal,
        tax,
        total,
        deposit,
        paymentMethod,
        deliveryInfo,
        notes
      });

      // Создаем бронирования для каждого инструмента
      for (const item of items) {
        await Booking.create({
          toolId: item.toolId,
          customerId: req.user?.userId || null,
          startDate,
          endDate,
          quantity: item.quantity,
          pricePerDay: (await Tool.findById(item.toolId)).price,
          totalPrice: orderItems.find(oi => oi.toolId === item.toolId).total
        });
      }

      res.status(201).json({
        success: true,
        message: 'Заказ успешно создан',
        data: order
      });
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить все заказы
  async getAllOrders(req, res) {
    try {
      const { 
        status, 
        customerId, 
        startDate, 
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      let query = {};

      if (status) query.status = status;
      if (customerId) query.customerId = customerId;
      if (startDate && endDate) {
        query.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }

      // Если пользователь не админ, показываем только его заказы
      if (req.user.role !== 'admin') {
        query.customerId = req.user.userId;
      }

      const orders = await Order.findAll(query);

      // Сортировка по дате создания (новые сначала)
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Пагинация
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + Number(limit);
      const paginatedOrders = orders.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          orders: paginatedOrders,
          pagination: {
            current: Number(page),
            total: Math.ceil(orders.length / limit),
            count: paginatedOrders.length,
            totalItems: orders.length
          }
        }
      });
    } catch (error) {
      console.error('Ошибка получения заказов:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить заказ по ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Проверяем права доступа
      if (req.user.role !== 'admin' && order.customerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Нет доступа к этому заказу'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Ошибка получения заказа:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Обновить статус заказа (только для админов)
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const updated = await Order.updateStatus(id, status, note);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Если заказ подтвержден, подтверждаем все связанные бронирования
      if (status === 'confirmed') {
        const order = await Order.findById(id);
        for (const item of order.items) {
          const bookings = await Booking.findByTool(item.toolId);
          for (const booking of bookings) {
            if (booking.customerId === order.customerId) {
              await Booking.confirm(booking._id);
            }
          }
        }
      }

      res.json({
        success: true,
        message: 'Статус заказа обновлен'
      });
    } catch (error) {
      console.error('Ошибка обновления статуса заказа:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Отменить заказ
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Проверяем права доступа
      if (req.user.role !== 'admin' && order.customerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Нет доступа к этому заказу'
        });
      }

      // Можно отменить только заказы в статусе pending или confirmed
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Нельзя отменить заказ в текущем статусе'
        });
      }

      await Order.updateStatus(id, 'cancelled', reason || 'Отменен пользователем');

      // Отменяем все связанные бронирования
      for (const item of order.items) {
        const bookings = await Booking.findByTool(item.toolId);
        for (const booking of bookings) {
          if (booking.customerId === order.customerId) {
            await Booking.cancel(booking._id, reason);
          }
        }
      }

      res.json({
        success: true,
        message: 'Заказ успешно отменен'
      });
    } catch (error) {
      console.error('Ошибка отмены заказа:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить статистику заказов (только для админов)
  async getOrderStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const stats = await Order.getStatistics(startDate, endDate);
      const revenueByMonth = await Order.getRevenueByPeriod('month');
      
      res.json({
        success: true,
        data: {
          ...stats,
          revenueByMonth
        }
      });
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Добавить примечание к заказу
  async addOrderNote(req, res) {
    try {
      const { id } = req.params;
      const { note, isInternal = false } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Только админы могут добавлять внутренние заметки
      if (isInternal && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для добавления внутренних заметок'
        });
      }

      await Order.addNote(id, note, isInternal);

      res.json({
        success: true,
        message: 'Примечание добавлено'
      });
    } catch (error) {
      console.error('Ошибка добавления примечания:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }
};