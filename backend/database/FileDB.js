import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class FileDB {
  constructor(dbPath = './database/data') {
    this.dbPath = dbPath;
    this.collections = new Map();
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.dbPath, { recursive: true });
    } catch (error) {
      console.error('Ошибка создания директории БД:', error);
    }
  }

  getCollectionPath(collectionName) {
    return path.join(this.dbPath, `${collectionName}.json`);
  }

  async loadCollection(collectionName) {
    try {
      const filePath = this.getCollectionPath(collectionName);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async saveCollection(collectionName, data) {
    const filePath = this.getCollectionPath(collectionName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  collection(name) {
    return new Collection(this, name);
  }
}

class Collection {
  constructor(db, name) {
    this.db = db;
    this.name = name;
  }

  async find(query = {}) {
    const data = await this.db.loadCollection(this.name);
    return this.filterData(data, query);
  }

  async findOne(query = {}) {
    const results = await this.find(query);
    return results[0] || null;
  }

  async findById(id) {
    return await this.findOne({ _id: id });
  }

  async insertOne(document) {
    const data = await this.db.loadCollection(this.name);
    const newDoc = {
      _id: uuidv4(),
      ...document,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newDoc);
    await this.db.saveCollection(this.name, data);
    return { insertedId: newDoc._id, ...newDoc };
  }

  async insertMany(documents) {
    const data = await this.db.loadCollection(this.name);
    const newDocs = documents.map(doc => ({
      _id: uuidv4(),
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    data.push(...newDocs);
    await this.db.saveCollection(this.name, data);
    return { insertedCount: newDocs.length, insertedIds: newDocs.map(d => d._id) };
  }

  async updateOne(query, update) {
    const data = await this.db.loadCollection(this.name);
    const index = data.findIndex(item => this.matchesQuery(item, query));
    
    if (index === -1) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const updateData = update.$set || update;
    data[index] = {
      ...data[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await this.db.saveCollection(this.name, data);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(query, update) {
    const data = await this.db.loadCollection(this.name);
    let modifiedCount = 0;

    const updateData = update.$set || update;
    
    for (let i = 0; i < data.length; i++) {
      if (this.matchesQuery(data[i], query)) {
        data[i] = {
          ...data[i],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        modifiedCount++;
      }
    }

    await this.db.saveCollection(this.name, data);
    return { matchedCount: modifiedCount, modifiedCount };
  }

  async deleteOne(query) {
    const data = await this.db.loadCollection(this.name);
    const index = data.findIndex(item => this.matchesQuery(item, query));
    
    if (index === -1) {
      return { deletedCount: 0 };
    }

    data.splice(index, 1);
    await this.db.saveCollection(this.name, data);
    return { deletedCount: 1 };
  }

  async deleteMany(query) {
    const data = await this.db.loadCollection(this.name);
    const initialLength = data.length;
    
    const filteredData = data.filter(item => !this.matchesQuery(item, query));
    
    await this.db.saveCollection(this.name, filteredData);
    return { deletedCount: initialLength - filteredData.length };
  }

  async countDocuments(query = {}) {
    const data = await this.find(query);
    return data.length;
  }

  async aggregate(pipeline) {
    let data = await this.db.loadCollection(this.name);
    
    for (const stage of pipeline) {
      if (stage.$match) {
        data = this.filterData(data, stage.$match);
      }
      if (stage.$sort) {
        data = this.sortData(data, stage.$sort);
      }
      if (stage.$limit) {
        data = data.slice(0, stage.$limit);
      }
      if (stage.$skip) {
        data = data.slice(stage.$skip);
      }
      if (stage.$group) {
        data = this.groupData(data, stage.$group);
      }
    }
    
    return data;
  }

  filterData(data, query) {
    if (Object.keys(query).length === 0) return data;
    return data.filter(item => this.matchesQuery(item, query));
  }

  matchesQuery(item, query) {
    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('$')) {
        // Обработка операторов
        if (key === '$or') {
          return value.some(condition => this.matchesQuery(item, condition));
        }
        if (key === '$and') {
          return value.every(condition => this.matchesQuery(item, condition));
        }
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        // Обработка операторов сравнения
        if (value.$gt !== undefined && item[key] <= value.$gt) return false;
        if (value.$gte !== undefined && item[key] < value.$gte) return false;
        if (value.$lt !== undefined && item[key] >= value.$lt) return false;
        if (value.$lte !== undefined && item[key] > value.$lte) return false;
        if (value.$ne !== undefined && item[key] === value.$ne) return false;
        if (value.$in !== undefined && !value.$in.includes(item[key])) return false;
        if (value.$nin !== undefined && value.$nin.includes(item[key])) return false;
        if (value.$regex !== undefined) {
          const regex = new RegExp(value.$regex, value.$options || '');
          if (!regex.test(item[key])) return false;
        }
      } else {
        if (item[key] !== value) return false;
      }
    }
    return true;
  }

  sortData(data, sortSpec) {
    return data.sort((a, b) => {
      for (const [key, direction] of Object.entries(sortSpec)) {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return direction === 1 ? -1 : 1;
        if (aVal > bVal) return direction === 1 ? 1 : -1;
      }
      return 0;
    });
  }

  groupData(data, groupSpec) {
    const groups = {};
    
    for (const item of data) {
      const groupKey = this.evaluateExpression(item, groupSpec._id);
      
      if (!groups[groupKey]) {
        groups[groupKey] = { _id: groupKey };
      }
      
      for (const [field, expression] of Object.entries(groupSpec)) {
        if (field === '_id') continue;
        
        if (expression.$sum) {
          groups[groupKey][field] = (groups[groupKey][field] || 0) + 
            (expression.$sum === 1 ? 1 : this.evaluateExpression(item, expression.$sum));
        }
        if (expression.$avg) {
          if (!groups[groupKey][`${field}_sum`]) {
            groups[groupKey][`${field}_sum`] = 0;
            groups[groupKey][`${field}_count`] = 0;
          }
          groups[groupKey][`${field}_sum`] += this.evaluateExpression(item, expression.$avg);
          groups[groupKey][`${field}_count`]++;
          groups[groupKey][field] = groups[groupKey][`${field}_sum`] / groups[groupKey][`${field}_count`];
        }
      }
    }
    
    return Object.values(groups);
  }

  evaluateExpression(item, expression) {
    if (typeof expression === 'string' && expression.startsWith('$')) {
      return item[expression.substring(1)];
    }
    return expression;
  }
}

export default FileDB;