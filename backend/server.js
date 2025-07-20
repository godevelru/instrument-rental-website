import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Импорт маршрутов
import authRoutes from './routes/auth.js';
import toolRoutes from './routes/tools.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import bookingRoutes from './routes/bookings.js';

// Импорт моделей для инициализации
import { Booking } from './models/Booking.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware безопасности
app.use(helmet());
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Логирование
app.use(morgan('combined'));

// Ограничение запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: {
    success: false,
    message: 'Слишком много запросов, попробуйте позже'
  }
});
app.use('/api/', limiter);

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookings', bookingRoutes);

// Базовый маршрут
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API сервера проката инструментов',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tools: '/api/tools',
      orders: '/api/orders',
      reviews: '/api/reviews',
      bookings: '/api/bookings'
    }
  });
});

// Маршрут для проверки здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Обработка несуществующих маршрутов
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден'
  });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
  console.error('Глобальная ошибка:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Периодическая очистка просроченных бронирований
setInterval(async () => {
  try {
    const expiredCount = await Booking.expireOldBookings();
    if (expiredCount > 0) {
      console.log(`Обработано ${expiredCount} просроченных бронирований`);
    }
  } catch (error) {
    console.error('Ошибка очистки просроченных бронирований:', error);
  }
}, 60 * 60 * 1000); // каждый час

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📖 API документация: http://localhost:${PORT}/api`);
  console.log(`🏥 Проверка здоровья: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
});

export default app;