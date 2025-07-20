import FileDB from '../database/FileDB.js';
import bcrypt from 'bcryptjs';

const db = new FileDB();

// Данные для заполнения
const categories = [
  {
    name: 'Электроинструмент',
    subcategories: ['Перфораторы', 'Дрели', 'Болгарки', 'Лобзики', 'Миксеры', 'Шуруповерты', 'Пилы циркулярные']
  },
  {
    name: 'Пневмоинструмент',
    subcategories: ['Компрессоры', 'Гайковерты', 'Пневмодрели', 'Краскопульты', 'Пневмомолотки']
  },
  {
    name: 'Измерительные приборы',
    subcategories: ['Лазерные уровни', 'Дальномеры', 'Нивелиры', 'Теодолиты', 'Детекторы']
  },
  {
    name: 'Садовая техника',
    subcategories: ['Газонокосилки', 'Триммеры', 'Бензопилы', 'Культиваторы', 'Воздуходувки']
  },
  {
    name: 'Строительное оборудование',
    subcategories: ['Леса', 'Вышки', 'Бетономешалки', 'Генераторы', 'Сварочные аппараты']
  }
];

const brands = [
  'Bosch', 'DeWalt', 'Makita', 'Metabo', 'Milwaukee', 'Festool', 
  'Hilti', 'Ryobi', 'Black+Decker', 'Einhell', 'Интерскол', 'Зубр'
];

const russianNames = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артем', 'Илья', 'Кирилл', 'Михаил',
  'Никита', 'Матвей', 'Роман', 'Егор', 'Арсений', 'Иван', 'Денис', 'Евгений', 'Данил', 'Тимур',
  'Владислав', 'Игорь', 'Владимир', 'Павел', 'Руслан', 'Марк', 'Лев', 'Константин', 'Богдан', 'Степан'
];

const russianSurnames = [
  'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Федоров',
  'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семенов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев',
  'Орлов', 'Андреев', 'Макаров', 'Никитин', 'Захаров', 'Зайцев', 'Соловьев', 'Борисов', 'Яковлев', 'Григорьев'
];

const companies = [
  'ООО "СтройТех"', 'ИП Петров А.В.', 'ООО "РемонтСервис"', 'ООО "МастерСтрой"', 
  'ИП Иванов С.М.', 'ООО "ПрофиТул"', 'ООО "СтройМастер"', 'ИП Сидоров Д.А.',
  'ООО "ТехноСтрой"', 'ООО "УниверсалСтрой"', 'ИП Козлов В.И.', 'ООО "ЭлитСтрой"'
];

const toolDescriptions = {
  'Перфораторы': [
    'Профессиональный перфоратор для сверления и долбления бетона',
    'Мощный перфоратор с системой антивибрации',
    'Легкий перфоратор для бытовых работ',
    'Аккумуляторный перфоратор для мобильных работ'
  ],
  'Дрели': [
    'Ударная дрель для работы по бетону и металлу',
    'Безударная дрель для точного сверления',
    'Аккумуляторная дрель-шуруповерт',
    'Угловая дрель для работы в ограниченном пространстве'
  ],
  'Болгарки': [
    'Угловая шлифовальная машина 125мм',
    'Большая болгарка 230мм для тяжелых работ',
    'Аккумуляторная болгарка для мобильности',
    'Болгарка с регулировкой оборотов'
  ]
};

const reviewTexts = [
  'Отличный инструмент! Мощный, надежный. Пробивает бетон как масло.',
  'Очень довольна качеством и сервисом. Инструмент в отличном состоянии.',
  'Хороший инструмент для профессиональных задач. Рекомендую!',
  'Арендовал для ремонта квартиры. Все прошло отлично, инструмент работает тихо.',
  'Профессиональный подход, качественная техника. Буду пользоваться еще.',
  'Быстрая доставка, все в срок. Инструмент соответствует описанию.',
  'Единственный минус - тяжеловат, но это компенсируется мощностью.',
  'Отличное соотношение цена-качество. Рекомендую всем коллегам.'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedUsers() {
  console.log('Создание пользователей...');
  
  const users = [];
  
  // Создаем админа
  const adminPassword = await bcrypt.hash('admin123', 12);
  users.push({
    firstName: 'Администратор',
    lastName: 'Системы',
    email: 'admin@toolrental.ru',
    phone: '+7 (495) 123-45-67',
    password: adminPassword,
    role: 'admin',
    company: 'ToolRental',
    address: 'г. Москва, ул. Строителей, 15',
    isActive: true,
    emailVerified: true,
    lastLogin: new Date().toISOString(),
    preferences: {
      notifications: { email: true, sms: true, marketing: false },
      language: 'ru'
    },
    stats: {
      totalOrders: 0,
      totalSpent: 0,
      memberSince: new Date('2023-01-01').toISOString()
    }
  });

  // Создаем клиентов
  for (let i = 0; i < 50; i++) {
    const firstName = getRandomElement(russianNames);
    const lastName = getRandomElement(russianSurnames);
    const password = await bcrypt.hash('password123', 12);
    
    users.push({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+7 (9${getRandomNumber(10, 99)}) ${getRandomNumber(100, 999)}-${getRandomNumber(10, 99)}-${getRandomNumber(10, 99)}`,
      password,
      role: 'customer',
      company: Math.random() > 0.6 ? getRandomElement(companies) : null,
      address: `г. Москва, ул. ${getRandomElement(['Ленина', 'Пушкина', 'Гагарина', 'Мира', 'Советская'])}, д. ${getRandomNumber(1, 100)}`,
      isActive: true,
      emailVerified: Math.random() > 0.2,
      lastLogin: Math.random() > 0.3 ? getRandomDate(new Date('2024-01-01'), new Date()).toISOString() : null,
      preferences: {
        notifications: {
          email: Math.random() > 0.2,
          sms: Math.random() > 0.7,
          marketing: Math.random() > 0.5
        },
        language: 'ru'
      },
      stats: {
        totalOrders: getRandomNumber(0, 15),
        totalSpent: getRandomNumber(0, 50000),
        memberSince: getRandomDate(new Date('2023-01-01'), new Date()).toISOString()
      }
    });
  }

  await db.collection('users').insertMany(users);
  console.log(`Создано ${users.length} пользователей`);
  return users;
}

async function seedTools() {
  console.log('Создание инструментов...');
  
  const tools = [];
  
  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      const toolsInSubcategory = getRandomNumber(3, 8);
      
      for (let i = 0; i < toolsInSubcategory; i++) {
        const brand = getRandomElement(brands);
        const model = `${subcategory.slice(0, 3).toUpperCase()}-${getRandomNumber(100, 999)}`;
        const name = `${subcategory.slice(0, -1)} ${brand} ${model}`;
        
        const basePrice = getRandomNumber(300, 3000);
        const description = getRandomElement(toolDescriptions[subcategory] || ['Профессиональный инструмент для строительных работ']);
        
        tools.push({
          name,
          brand,
          model,
          category: category.name,
          subcategory,
          description,
          fullDescription: `${description}. Высокое качество, надежность и долговечность. Подходит как для профессионального, так и для бытового использования. Регулярное техническое обслуживание гарантирует безупречную работу.`,
          price: basePrice,
          images: [
            '/img/5e130715-b755-4ab5-82af-c9e448995766.jpg',
            '/img/cc0687bd-1892-4c49-8820-2d326de6668b.jpg',
            '/img/a1f08a16-886e-4eb0-836e-611ef0c78857.jpg'
          ],
          specifications: {
            power: `${getRandomNumber(500, 2000)}W`,
            weight: `${(getRandomNumber(15, 80) / 10).toFixed(1)}кг`,
            voltage: '230V',
            warranty: '2 года',
            country: getRandomElement(['Германия', 'Япония', 'США', 'Китай'])
          },
          features: [
            'Эргономичная рукоятка',
            'Система защиты от перегрузки',
            'Быстрая замена оснастки',
            'Светодиодная подсветка'
          ].slice(0, getRandomNumber(2, 4)),
          included: [
            `${name}`,
            'Дополнительная рукоятка',
            'Кейс для хранения',
            'Инструкция по эксплуатации'
          ],
          condition: getRandomElement(['excellent', 'good', 'fair']),
          location: 'main_warehouse',
          status: 'available',
          inStock: getRandomNumber(1, 8),
          totalStock: getRandomNumber(1, 8),
          rating: (getRandomNumber(35, 50) / 10).toFixed(1),
          reviewCount: getRandomNumber(0, 50),
          totalRentals: getRandomNumber(0, 100),
          totalRevenue: getRandomNumber(0, 50000),
          lastMaintenance: getRandomDate(new Date('2024-01-01'), new Date()).toISOString(),
          nextMaintenance: getRandomDate(new Date(), new Date('2024-12-31')).toISOString(),
          purchaseDate: getRandomDate(new Date('2022-01-01'), new Date('2024-01-01')).toISOString(),
          purchasePrice: basePrice * getRandomNumber(8, 15),
          serialNumber: `SN${getRandomNumber(100000, 999999)}`,
          warranty: getRandomDate(new Date(), new Date('2026-12-31')).toISOString(),
          tags: [category.name, subcategory, brand].concat(
            getRandomElement([[], ['популярный'], ['новинка'], ['акция']])
          ),
          isActive: true
        });
      }
    }
  }

  await db.collection('tools').insertMany(tools);
  console.log(`Создано ${tools.length} инструментов`);
  return tools;
}

async function seedOrders(users, tools) {
  console.log('Создание заказов...');
  
  const orders = [];
  const customers = users.filter(u => u.role === 'customer');
  
  for (let i = 0; i < 100; i++) {
    const customer = getRandomElement(customers);
    const orderItems = [];
    const itemsCount = getRandomNumber(1, 4);
    
    let subtotal = 0;
    
    for (let j = 0; j < itemsCount; j++) {
      const tool = getRandomElement(tools);
      const quantity = getRandomNumber(1, 3);
      const days = getRandomNumber(1, 14);
      const itemTotal = tool.price * quantity * days;
      
      orderItems.push({
        toolId: tool._id,
        toolName: tool.name,
        quantity,
        pricePerDay: tool.price,
        days,
        total: itemTotal
      });
      
      subtotal += itemTotal;
    }
    
    const tax = subtotal * 0.2;
    const total = subtotal + tax;
    const deposit = total * 0.5;
    
    const startDate = getRandomDate(new Date('2024-01-01'), new Date('2024-12-31'));
    const endDate = new Date(startDate.getTime() + orderItems[0].days * 24 * 60 * 60 * 1000);
    
    const statuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
    const status = getRandomElement(statuses);
    
    orders.push({
      orderNumber: `ORD-${Date.now().toString().slice(-6)}${getRandomNumber(100, 999)}`,
      customerId: customer._id,
      customerInfo: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        company: customer.company
      },
      items: orderItems,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalDays: orderItems[0].days,
      subtotal,
      tax,
      total,
      deposit,
      status,
      paymentStatus: getRandomElement(['pending', 'paid', 'partial']),
      paymentMethod: getRandomElement(['card', 'cash', 'invoice']),
      deliveryInfo: {
        address: customer.address,
        date: startDate.toISOString(),
        timeSlot: getRandomElement(['09:00-12:00', '12:00-15:00', '15:00-18:00']),
        instructions: 'Позвонить за 30 минут до доставки'
      },
      deliveryStatus: getRandomElement(['pending', 'scheduled', 'delivered', 'returned']),
      notes: Math.random() > 0.7 ? 'Срочный заказ, требуется быстрая доставка' : '',
      internalNotes: '',
      timeline: [
        {
          status: 'pending',
          timestamp: startDate.toISOString(),
          note: 'Заказ создан'
        }
      ],
      notifications: {
        confirmationSent: Math.random() > 0.3,
        reminderSent: Math.random() > 0.5,
        overdueNotificationSent: false
      }
    });
  }

  await db.collection('orders').insertMany(orders);
  console.log(`Создано ${orders.length} заказов`);
  return orders;
}

async function seedReviews(users, tools, orders) {
  console.log('Создание отзывов...');
  
  const reviews = [];
  const customers = users.filter(u => u.role === 'customer');
  
  for (let i = 0; i < 200; i++) {
    const customer = getRandomElement(customers);
    const tool = getRandomElement(tools);
    const order = getRandomElement(orders.filter(o => o.customerId === customer._id));
    
    reviews.push({
      toolId: tool._id,
      customerId: customer._id,
      orderId: order?._id || null,
      rating: getRandomNumber(3, 5),
      title: `Отзыв о ${tool.name}`,
      comment: getRandomElement(reviewTexts),
      pros: getRandomElement([
        ['Мощный', 'Надежный'],
        ['Легкий', 'Удобный'],
        ['Качественный', 'Долговечный'],
        ['Быстрый', 'Эффективный']
      ]),
      cons: getRandomElement([
        [],
        ['Тяжеловат'],
        ['Шумный'],
        ['Дорогой']
      ]),
      wouldRecommend: Math.random() > 0.2,
      isVerified: order ? true : false,
      isApproved: Math.random() > 0.1,
      helpfulVotes: getRandomNumber(0, 20),
      reportCount: getRandomNumber(0, 2),
      response: Math.random() > 0.8 ? {
        text: 'Спасибо за отзыв! Мы ценим ваше мнение.',
        author: users.find(u => u.role === 'admin')._id,
        createdAt: new Date().toISOString()
      } : null,
      images: []
    });
  }

  await db.collection('reviews').insertMany(reviews);
  console.log(`Создано ${reviews.length} отзывов`);
  return reviews;
}

async function seedBookings(users, tools) {
  console.log('Создание бронирований...');
  
  const bookings = [];
  const customers = users.filter(u => u.role === 'customer');
  
  for (let i = 0; i < 150; i++) {
    const customer = getRandomElement(customers);
    const tool = getRandomElement(tools);
    
    const startDate = getRandomDate(new Date(), new Date('2024-12-31'));
    const days = getRandomNumber(1, 10);
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    const quantity = getRandomNumber(1, 2);
    const totalPrice = tool.price * quantity * days;
    
    bookings.push({
      toolId: tool._id,
      customerId: customer._id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      quantity,
      status: getRandomElement(['pending', 'confirmed', 'cancelled']),
      pricePerDay: tool.price,
      totalPrice,
      notes: Math.random() > 0.8 ? 'Требуется инструктаж по использованию' : '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      confirmedAt: Math.random() > 0.5 ? new Date().toISOString() : null,
      cancelledAt: null,
      cancellationReason: null
    });
  }

  await db.collection('bookings').insertMany(bookings);
  console.log(`Создано ${bookings.length} бронирований`);
  return bookings;
}

async function seedDatabase() {
  try {
    console.log('Начинаем заполнение базы данных...');
    
    // Очищаем существующие данные
    console.log('Очистка существующих данных...');
    await db.collection('users').deleteMany({});
    await db.collection('tools').deleteMany({});
    await db.collection('orders').deleteMany({});
    await db.collection('reviews').deleteMany({});
    await db.collection('bookings').deleteMany({});
    
    // Заполняем данными
    const users = await seedUsers();
    const tools = await seedTools();
    const orders = await seedOrders(users, tools);
    const reviews = await seedReviews(users, tools, orders);
    const bookings = await seedBookings(users, tools);
    
    console.log('\n=== ЗАПОЛНЕНИЕ ЗАВЕРШЕНО ===');
    console.log(`Пользователи: ${users.length}`);
    console.log(`Инструменты: ${tools.length}`);
    console.log(`Заказы: ${orders.length}`);
    console.log(`Отзывы: ${reviews.length}`);
    console.log(`Бронирования: ${bookings.length}`);
    console.log('\nДанные для входа:');
    console.log('Админ: admin@toolrental.ru / admin123');
    console.log('Клиент: любой email из списка / password123');
    
  } catch (error) {
    console.error('Ошибка заполнения базы данных:', error);
  }
}

// Запускаем заполнение, если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;