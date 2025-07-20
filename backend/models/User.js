import FileDB from '../database/FileDB.js';
import bcrypt from 'bcryptjs';

const db = new FileDB();
const users = db.collection('users');

export class User {
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      password: hashedPassword,
      role: userData.role || 'customer',
      company: userData.company || null,
      address: userData.address || null,
      isActive: true,
      emailVerified: false,
      lastLogin: null,
      preferences: {
        notifications: {
          email: true,
          sms: false,
          marketing: true
        },
        language: 'ru'
      },
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        memberSince: new Date().toISOString()
      }
    };

    return await users.insertOne(user);
  }

  static async findById(id) {
    return await users.findById(id);
  }

  static async findByEmail(email) {
    return await users.findOne({ email });
  }

  static async findAll(query = {}) {
    return await users.find(query);
  }

  static async update(id, updateData) {
    const result = await users.updateOne({ _id: id }, updateData);
    return result.modifiedCount > 0;
  }

  static async delete(id) {
    const result = await users.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(id) {
    return await users.updateOne(
      { _id: id },
      { lastLogin: new Date().toISOString() }
    );
  }

  static async updateStats(id, stats) {
    return await users.updateOne(
      { _id: id },
      { $set: { stats } }
    );
  }

  static async getCustomers() {
    return await users.find({ role: 'customer' });
  }

  static async getAdmins() {
    return await users.find({ role: 'admin' });
  }
}