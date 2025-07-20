import FileDB from '../database/FileDB.js';

const db = new FileDB();
const orders = db.collection('orders');

export class Order {
  static async create(orderData) {
    const order = {
      orderNumber: this.generateOrderNumber(),
      customerId: orderData.customerId,
      customerInfo: orderData.customerInfo,
      items: orderData.items, // [{ toolId, quantity, pricePerDay, days }]
      startDate: orderData.startDate,
      endDate: orderData.endDate,
      totalDays: orderData.totalDays,
      subtotal: orderData.subtotal,
      tax: orderData.tax || 0,
      discount: orderData.discount || 0,
      total: orderData.total,
      deposit: orderData.deposit || 0,
      status: 'pending', // pending, confirmed, active, completed, cancelled, overdue
      paymentStatus: 'pending', // pending, paid, partial, refunded
      paymentMethod: orderData.paymentMethod,
      deliveryInfo: orderData.deliveryInfo,
      deliveryStatus: 'pending', // pending, scheduled, delivered, returned
      notes: orderData.notes || '',
      internalNotes: '',
      timeline: [{
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'Заказ создан'
      }],
      notifications: {
        confirmationSent: false,
        reminderSent: false,
        overdueNotificationSent: false
      }
    };

    return await orders.insertOne(order);
  }

  static generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}${random}`;
  }

  static async findById(id) {
    return await orders.findById(id);
  }

  static async findByOrderNumber(orderNumber) {
    return await orders.findOne({ orderNumber });
  }

  static async findByCustomer(customerId) {
    return await orders.find({ customerId });
  }

  static async findAll(query = {}) {
    return await orders.find(query);
  }

  static async findActive() {
    return await orders.find({ status: 'active' });
  }

  static async findOverdue() {
    const now = new Date().toISOString();
    return await orders.find({
      status: 'active',
      endDate: { $lt: now }
    });
  }

  static async findByDateRange(startDate, endDate) {
    return await orders.find({
      $or: [
        {
          startDate: { $gte: startDate, $lte: endDate }
        },
        {
          endDate: { $gte: startDate, $lte: endDate }
        },
        {
          startDate: { $lte: startDate },
          endDate: { $gte: endDate }
        }
      ]
    });
  }

  static async updateStatus(id, status, note = '') {
    const order = await orders.findById(id);
    if (!order) return false;

    const timeline = [...order.timeline, {
      status,
      timestamp: new Date().toISOString(),
      note
    }];

    return await orders.updateOne(
      { _id: id },
      { status, timeline }
    );
  }

  static async updatePaymentStatus(id, paymentStatus) {
    return await orders.updateOne(
      { _id: id },
      { paymentStatus }
    );
  }

  static async updateDeliveryStatus(id, deliveryStatus) {
    return await orders.updateOne(
      { _id: id },
      { deliveryStatus }
    );
  }

  static async addNote(id, note, isInternal = false) {
    const order = await orders.findById(id);
    if (!order) return false;

    const field = isInternal ? 'internalNotes' : 'notes';
    const currentNotes = order[field] || '';
    const newNotes = currentNotes + '\n' + `[${new Date().toISOString()}] ${note}`;

    return await orders.updateOne(
      { _id: id },
      { [field]: newNotes.trim() }
    );
  }

  static async update(id, updateData) {
    const result = await orders.updateOne({ _id: id }, updateData);
    return result.modifiedCount > 0;
  }

  static async delete(id) {
    const result = await orders.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  static async getStatistics(startDate, endDate) {
    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const allOrders = await orders.find(query);
    
    return {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      confirmed: allOrders.filter(o => o.status === 'confirmed').length,
      active: allOrders.filter(o => o.status === 'active').length,
      completed: allOrders.filter(o => o.status === 'completed').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length,
      overdue: allOrders.filter(o => o.status === 'overdue').length,
      totalRevenue: allOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      averageOrderValue: allOrders.length > 0 ? 
        allOrders.reduce((sum, o) => sum + (o.total || 0), 0) / allOrders.length : 0
    };
  }

  static async getRevenueByPeriod(period = 'month') {
    const allOrders = await orders.find({ status: { $in: ['completed', 'active'] } });
    const revenue = {};

    allOrders.forEach(order => {
      const date = new Date(order.createdAt);
      let key;

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      revenue[key] = (revenue[key] || 0) + order.total;
    });

    return revenue;
  }
}