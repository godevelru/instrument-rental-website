import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const authController = {
  // Регистрация
  async register(req, res) {
    try {
      const { firstName, lastName, email, phone, password, company } = req.body;

      // Проверяем, существует ли пользователь
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Пользователь с таким email уже существует'
        });
      }

      // Создаем пользователя
      const user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
        company,
        role: 'customer'
      });

      // Генерируем токен
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'Пользователь успешно зарегистрирован',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role
          },
          token
        }
      });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Авторизация
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Находим пользователя
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Неверный email или пароль'
        });
      }

      // Проверяем пароль
      const isValidPassword = await User.validatePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Неверный email или пароль'
        });
      }

      // Обновляем время последнего входа
      await User.updateLastLogin(user._id);

      // Генерируем токен
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Успешная авторизация',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            company: user.company
          },
          token
        }
      });
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Получение профиля
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          company: user.company,
          address: user.address,
          role: user.role,
          preferences: user.preferences,
          stats: user.stats,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Обновление профиля
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, phone, company, address, preferences } = req.body;

      const updated = await User.update(req.user.userId, {
        firstName,
        lastName,
        phone,
        company,
        address,
        preferences
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
      }

      res.json({
        success: true,
        message: 'Профиль успешно обновлен'
      });
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  },

  // Смена пароля
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
      }

      // Проверяем текущий пароль
      const isValidPassword = await User.validatePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Неверный текущий пароль'
        });
      }

      // Хешируем новый пароль
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Обновляем пароль
      await User.update(req.user.userId, { password: hashedPassword });

      res.json({
        success: true,
        message: 'Пароль успешно изменен'
      });
    } catch (error) {
      console.error('Ошибка смены пароля:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }
};