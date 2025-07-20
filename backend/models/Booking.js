import FileDB from '../database/FileDB.js';

const db = new FileDB();
const bookings = db.collection('bookings');

export class Booking {
  static async create(bookingData) {
    const booking = {
      toolId: bookingData.toolId,
      customerId: bookingData.customerId,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      quantity: bookingData.quantity || 1,
      status: 'pending', // pending, confirmed, cancelled, expired
      pricePerDay: bookingData.pricePerDay,
      totalPrice: bookingData.totalPrice,
      notes: bookingData.notes || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 часа
      confirmedAt: null,
      cancelledAt: null,
      cancellationReason: null
    };

    return await bookings.insertOne(booking);
  }

  static async findById(id) {
    return await bookings.findById(id);
  }

  static async findByCustomer(customerId) {
    return await bookings.find({ customerId });
  }

  static async findByTool(toolId) {
    return await bookings.find({ toolId });
  }

  static async findActive() {
    return await bookings.find({ 
      status: { $in: ['pending', 'confirmed'] }
    });
  }

  static async findExpired() {
    const now = new Date().toISOString();
    return await bookings.find({
      status: 'pending',
      expiresAt: { $lt: now }
    });
  }

  static async findConflicting(toolId, startDate, endDate, excludeBookingId = null) {
    const query = {
      toolId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    return await bookings.find(query);
  }

  static async isAvailable(toolId, startDate, endDate, quantity = 1) {
    const conflictingBookings = await this.findConflicting(toolId, startDate, endDate);
    const bookedQuantity = conflictingBookings.reduce((sum, booking) => sum + booking.quantity, 0);
    
    // Получаем информацию об инструменте
    const { Tool } = await import('./Tool.js');
    const tool = await Tool.findById(toolId);
    
    if (!tool) return false;
    
    return (tool.totalStock - bookedQuantity) >= quantity;
  }

  static async confirm(id) {
    const booking = await bookings.findById(id);
    if (!booking || booking.status !== 'pending') return false;

    // Проверяем доступность
    const available = await this.isAvailable(
      booking.toolId, 
      booking.startDate, 
      booking.endDate, 
      booking.quantity
    );

    if (!available) return false;

    return await bookings.updateOne(
      { _id: id },
      { 
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      }
    );
  }

  static async cancel(id, reason = '') {
    return await bookings.updateOne(
      { _id: id },
      { 
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason
      }
    );
  }

  static async expire(id) {
    return await bookings.updateOne(
      { _id: id },
      { status: 'expired' }
    );
  }

  static async expireOldBookings() {
    const expiredBookings = await this.findExpired();
    
    for (const booking of expiredBookings) {
      await this.expire(booking._id);
    }

    return expiredBookings.length;
  }

  static async update(id, updateData) {
    const result = await bookings.updateOne({ _id: id }, updateData);
    return result.modifiedCount > 0;
  }

  static async delete(id) {
    const result = await bookings.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  static async getToolAvailability(toolId, startDate, endDate) {
    const { Tool } = await import('./Tool.js');
    const tool = await Tool.findById(toolId);
    
    if (!tool) return null;

    const conflictingBookings = await this.findConflicting(toolId, startDate, endDate);
    const bookedQuantity = conflictingBookings.reduce((sum, booking) => sum + booking.quantity, 0);
    
    return {
      totalStock: tool.totalStock,
      availableStock: tool.totalStock - bookedQuantity,
      bookedQuantity,
      isAvailable: (tool.totalStock - bookedQuantity) > 0
    };
  }

  static async getBookingCalendar(toolId, year, month) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    return await bookings.find({
      toolId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    });
  }
}