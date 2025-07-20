import FileDB from '../database/FileDB.js';

const db = new FileDB();
const reviews = db.collection('reviews');

export class Review {
  static async create(reviewData) {
    const review = {
      toolId: reviewData.toolId,
      customerId: reviewData.customerId,
      orderId: reviewData.orderId,
      rating: reviewData.rating, // 1-5
      title: reviewData.title || '',
      comment: reviewData.comment,
      pros: reviewData.pros || [],
      cons: reviewData.cons || [],
      wouldRecommend: reviewData.wouldRecommend || true,
      isVerified: reviewData.isVerified || false,
      isApproved: false,
      helpfulVotes: 0,
      reportCount: 0,
      response: null, // Ответ администрации
      images: reviewData.images || []
    };

    return await reviews.insertOne(review);
  }

  static async findById(id) {
    return await reviews.findById(id);
  }

  static async findByTool(toolId) {
    return await reviews.find({ 
      toolId, 
      isApproved: true 
    });
  }

  static async findByCustomer(customerId) {
    return await reviews.find({ customerId });
  }

  static async findAll(query = {}) {
    return await reviews.find(query);
  }

  static async findPending() {
    return await reviews.find({ isApproved: false });
  }

  static async approve(id) {
    return await reviews.updateOne(
      { _id: id },
      { isApproved: true }
    );
  }

  static async reject(id, reason = '') {
    return await reviews.updateOne(
      { _id: id },
      { 
        isApproved: false,
        rejectionReason: reason
      }
    );
  }

  static async addResponse(id, response) {
    return await reviews.updateOne(
      { _id: id },
      { response }
    );
  }

  static async addHelpfulVote(id) {
    const review = await reviews.findById(id);
    if (!review) return false;

    return await reviews.updateOne(
      { _id: id },
      { helpfulVotes: review.helpfulVotes + 1 }
    );
  }

  static async reportReview(id) {
    const review = await reviews.findById(id);
    if (!review) return false;

    return await reviews.updateOne(
      { _id: id },
      { reportCount: review.reportCount + 1 }
    );
  }

  static async update(id, updateData) {
    const result = await reviews.updateOne({ _id: id }, updateData);
    return result.modifiedCount > 0;
  }

  static async delete(id) {
    const result = await reviews.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  static async getToolRating(toolId) {
    const toolReviews = await reviews.find({ 
      toolId, 
      isApproved: true 
    });

    if (toolReviews.length === 0) {
      return { rating: 0, count: 0 };
    }

    const totalRating = toolReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / toolReviews.length;

    return {
      rating: Math.round(averageRating * 10) / 10,
      count: toolReviews.length,
      distribution: {
        5: toolReviews.filter(r => r.rating === 5).length,
        4: toolReviews.filter(r => r.rating === 4).length,
        3: toolReviews.filter(r => r.rating === 3).length,
        2: toolReviews.filter(r => r.rating === 2).length,
        1: toolReviews.filter(r => r.rating === 1).length
      }
    };
  }

  static async getRecentReviews(limit = 10) {
    return await reviews.aggregate([
      { $match: { isApproved: true } },
      { $sort: { createdAt: -1 } },
      { $limit: limit }
    ]);
  }
}