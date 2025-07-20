export const validateRegistration = (req, res, next) => {
  const { firstName, lastName, email, phone, password } = req.body;
  const errors = [];

  if (!firstName || firstName.trim().length < 2) {
    errors.push('Имя должно содержать минимум 2 символа');
  }

  if (!lastName || lastName.trim().length < 2) {
    errors.push('Фамилия должна содержать минимум 2 символа');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Некорректный email адрес');
  }

  if (!phone || !isValidPhone(phone)) {
    errors.push('Некорректный номер телефона');
  }

  if (!password || password.length < 6) {
    errors.push('Пароль должен содержать минимум 6 символов');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Ошибки валидации',
      errors
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Некорректный email адрес');
  }

  if (!password) {
    errors.push('Пароль обязателен');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Ошибки валидации',
      errors
    });
  }

  next();
};

export const validateToolCreation = (req, res, next) => {
  const { name, brand, category, price } = req.body;
  const errors = [];

  if (!name || name.trim().length < 3) {
    errors.push('Название инструмента должно содержать минимум 3 символа');
  }

  if (!brand || brand.trim().length < 2) {
    errors.push('Бренд должен содержать минимум 2 символа');
  }

  if (!category || category.trim().length < 2) {
    errors.push('Категория должна содержать минимум 2 символа');
  }

  if (!price || price <= 0) {
    errors.push('Цена должна быть больше 0');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Ошибки валидации',
      errors
    });
  }

  next();
};

export const validateOrderCreation = (req, res, next) => {
  const { items, startDate, endDate, customerInfo } = req.body;
  const errors = [];

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('Заказ должен содержать минимум один инструмент');
  }

  if (!startDate || !isValidDate(startDate)) {
    errors.push('Некорректная дата начала');
  }

  if (!endDate || !isValidDate(endDate)) {
    errors.push('Некорректная дата окончания');
  }

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    errors.push('Дата окончания должна быть позже даты начала');
  }

  if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName) {
    errors.push('Информация о клиенте обязательна');
  }

  if (customerInfo && (!customerInfo.email || !isValidEmail(customerInfo.email))) {
    errors.push('Некорректный email клиента');
  }

  if (items && Array.isArray(items)) {
    items.forEach((item, index) => {
      if (!item.toolId) {
        errors.push(`Инструмент ${index + 1}: отсутствует ID`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Инструмент ${index + 1}: некорректное количество`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Ошибки валидации',
      errors
    });
  }

  next();
};

export const validateReviewCreation = (req, res, next) => {
  const { toolId, rating, comment } = req.body;
  const errors = [];

  if (!toolId) {
    errors.push('ID инструмента обязателен');
  }

  if (!rating || rating < 1 || rating > 5) {
    errors.push('Рейтинг должен быть от 1 до 5');
  }

  if (!comment || comment.trim().length < 10) {
    errors.push('Комментарий должен содержать минимум 10 символов');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Ошибки валидации',
      errors
    });
  }

  next();
};

export const validateBookingCreation = (req, res, next) => {
  const { toolId, startDate, endDate, quantity } = req.body;
  const errors = [];

  if (!toolId) {
    errors.push('ID инструмента обязателен');
  }

  if (!startDate || !isValidDate(startDate)) {
    errors.push('Некорректная дата начала');
  }

  if (!endDate || !isValidDate(endDate)) {
    errors.push('Некорректная дата окончания');
  }

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    errors.push('Дата окончания должна быть позже даты начала');
  }

  if (startDate && new Date(startDate) < new Date()) {
    errors.push('Дата начала не может быть в прошлом');
  }

  if (quantity && (quantity <= 0 || !Number.isInteger(Number(quantity)))) {
    errors.push('Количество должно быть положительным целым числом');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Ошибки валидации',
      errors
    });
  }

  next();
};

// Вспомогательные функции
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}