import { Tool } from '../models/Tool.js';
import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';

export const toolController = {
  // Получить все инструменты
  async getAllTools(req, res) {
    try {
      const { 
        category, 
        brand, 
        minPrice, 
        maxPrice, 
        search, 
        available, 
        sort = 'name',
        order = 'asc',
        page = 1,
        limit = 20
      } = req.query;

      let query = { isActive: true };

      // Фильтры
      if (category) query.category = category;
      if (brand) query.brand = brand;
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }
      if (available === 'true') {
        query.status = 'available';
        query.inStock = { $gt: 0 };
      }

      let tools;
      if (search) {
        tools = await Tool.search(search);
      } else {
        tools = await Tool.findAll(query);
      }

      // Сортировка
      tools.sort((a, b) => {
        let aVal = a[sort];
        let bVal = b[sort];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (order === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });

      // Пагинация
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + Number(limit);
      const paginatedTools = tools.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          tools: paginatedTools,
          pagination: {
            current: Number(page),
            total: Math.ceil(tools.length / limit),
            count: paginatedTools.length,
            totalItems: tools.length
          }
        }
      });
    } catch (error) {
      console.error('Ошибка получения инструментов:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить инструмент по ID
  async getToolById(req, res) {
    try {
      const { id } = req.params;
      
      const tool = await Tool.findById(id);
      if (!tool || !tool.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Инструмент не найден'
        });
      }

      // Получаем отзывы
      const reviews = await Review.findByTool(id);
      const rating = await Review.getToolRating(id);

      res.json({
        success: true,
        data: {
          ...tool,
          reviews,
          rating
        }
      });
    } catch (error) {
      console.error('Ошибка получения инструмента:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Создать инструмент (только для админов)
  async createTool(req, res) {
    try {
      const tool = await Tool.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Инструмент успешно создан',
        data: tool
      });
    } catch (error) {
      console.error('Ошибка создания инструмента:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Обновить инструмент (только для админов)
  async updateTool(req, res) {
    try {
      const { id } = req.params;
      
      const updated = await Tool.update(id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Инструмент не найден'
        });
      }

      res.json({
        success: true,
        message: 'Инструмент успешно обновлен'
      });
    } catch (error) {
      console.error('Ошибка обновления инструмента:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Удалить инструмент (только для админов)
  async deleteTool(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await Tool.delete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Инструмент не найден'
        });
      }

      res.json({
        success: true,
        message: 'Инструмент успешно удален'
      });
    } catch (error) {
      console.error('Ошибка удаления инструмента:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить категории
  async getCategories(req, res) {
    try {
      const categories = await Tool.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Ошибка получения категорий:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить популярные инструменты
  async getPopularTools(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const tools = await Tool.getPopular(Number(limit));
      
      res.json({
        success: true,
        data: tools
      });
    } catch (error) {
      console.error('Ошибка получения популярных инструментов:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Проверить доступность инструмента
  async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, quantity = 1 } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Необходимо указать даты начала и окончания'
        });
      }

      const availability = await Booking.getToolAvailability(id, startDate, endDate);
      
      if (!availability) {
        return res.status(404).json({
          success: false,
          message: 'Инструмент не найден'
        });
      }

      res.json({
        success: true,
        data: {
          ...availability,
          canBook: availability.availableStock >= Number(quantity)
        }
      });
    } catch (error) {
      console.error('Ошибка проверки доступности:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получить календарь бронирований
  async getBookingCalendar(req, res) {
    try {
      const { id } = req.params;
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'Необходимо указать год и месяц'
        });
      }

      const bookings = await Booking.getBookingCalendar(id, Number(year), Number(month));
      
      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      console.error('Ошибка получения календаря:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }
};