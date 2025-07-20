import FileDB from '../database/FileDB.js';

const db = new FileDB();
const tools = db.collection('tools');

export class Tool {
  static async create(toolData) {
    const tool = {
      name: toolData.name,
      brand: toolData.brand,
      model: toolData.model,
      category: toolData.category,
      subcategory: toolData.subcategory,
      description: toolData.description,
      fullDescription: toolData.fullDescription,
      price: toolData.price,
      images: toolData.images || [],
      specifications: toolData.specifications || {},
      features: toolData.features || [],
      included: toolData.included || [],
      condition: toolData.condition || 'excellent',
      location: toolData.location || 'main_warehouse',
      status: 'available', // available, rented, maintenance, retired
      inStock: toolData.inStock || 1,
      totalStock: toolData.totalStock || toolData.inStock || 1,
      rating: 0,
      reviewCount: 0,
      totalRentals: 0,
      totalRevenue: 0,
      lastMaintenance: new Date().toISOString(),
      nextMaintenance: null,
      purchaseDate: toolData.purchaseDate || new Date().toISOString(),
      purchasePrice: toolData.purchasePrice || 0,
      serialNumber: toolData.serialNumber || null,
      warranty: toolData.warranty || null,
      tags: toolData.tags || [],
      isActive: true
    };

    return await tools.insertOne(tool);
  }

  static async findById(id) {
    return await tools.findById(id);
  }

  static async findAll(query = {}) {
    return await tools.find(query);
  }

  static async findByCategory(category) {
    return await tools.find({ category, isActive: true });
  }

  static async findAvailable() {
    return await tools.find({ 
      status: 'available', 
      inStock: { $gt: 0 },
      isActive: true 
    });
  }

  static async search(searchTerm) {
    const regex = new RegExp(searchTerm, 'i');
    return await tools.find({
      $or: [
        { name: { $regex: regex } },
        { brand: { $regex: regex } },
        { category: { $regex: regex } },
        { subcategory: { $regex: regex } },
        { description: { $regex: regex } }
      ],
      isActive: true
    });
  }

  static async update(id, updateData) {
    const result = await tools.updateOne({ _id: id }, updateData);
    return result.modifiedCount > 0;
  }

  static async updateStock(id, quantity) {
    const tool = await tools.findById(id);
    if (!tool) return false;

    const newStock = tool.inStock + quantity;
    if (newStock < 0) return false;

    const status = newStock === 0 ? 'rented' : 'available';
    
    return await tools.updateOne(
      { _id: id },
      { inStock: newStock, status }
    );
  }

  static async updateRating(id, newRating, reviewCount) {
    return await tools.updateOne(
      { _id: id },
      { rating: newRating, reviewCount }
    );
  }

  static async incrementRentals(id, revenue) {
    const tool = await tools.findById(id);
    if (!tool) return false;

    return await tools.updateOne(
      { _id: id },
      { 
        totalRentals: tool.totalRentals + 1,
        totalRevenue: tool.totalRevenue + revenue
      }
    );
  }

  static async delete(id) {
    const result = await tools.updateOne({ _id: id }, { isActive: false });
    return result.modifiedCount > 0;
  }

  static async getPopular(limit = 10) {
    return await tools.aggregate([
      { $match: { isActive: true } },
      { $sort: { totalRentals: -1 } },
      { $limit: limit }
    ]);
  }

  static async getLowStock(threshold = 2) {
    return await tools.find({
      inStock: { $lte: threshold },
      isActive: true
    });
  }

  static async getByPriceRange(minPrice, maxPrice) {
    return await tools.find({
      price: { $gte: minPrice, $lte: maxPrice },
      isActive: true
    });
  }

  static async getCategories() {
    const allTools = await tools.find({ isActive: true });
    const categories = {};
    
    allTools.forEach(tool => {
      if (!categories[tool.category]) {
        categories[tool.category] = new Set();
      }
      categories[tool.category].add(tool.subcategory);
    });

    return Object.keys(categories).map(category => ({
      name: category,
      subcategories: Array.from(categories[category])
    }));
  }
}