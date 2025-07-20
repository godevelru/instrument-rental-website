const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Tools methods
  async getTools(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/tools${queryString}`);
  }

  async getTool(id: string) {
    return this.request(`/tools/${id}`);
  }

  async createTool(toolData: any) {
    return this.request('/tools', {
      method: 'POST',
      body: JSON.stringify(toolData),
    });
  }

  async updateTool(id: string, toolData: any) {
    return this.request(`/tools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toolData),
    });
  }

  async deleteTool(id: string) {
    return this.request(`/tools/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories() {
    return this.request('/tools/meta/categories');
  }

  async getPopularTools(limit?: number) {
    const queryString = limit ? `?limit=${limit}` : '';
    return this.request(`/tools/meta/popular${queryString}`);
  }

  // Orders methods
  async getOrders(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/orders${queryString}`);
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id: string, status: string, note?: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  }

  async cancelOrder(id: string, reason?: string) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async getOrderStatistics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/orders/meta/statistics${queryString}`);
  }

  // Reviews methods
  async getReviews(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/reviews${queryString}`);
  }

  async approveReview(id: string) {
    return this.request(`/reviews/${id}/approve`, {
      method: 'PUT',
    });
  }

  async rejectReview(id: string, reason?: string) {
    return this.request(`/reviews/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async addReviewResponse(id: string, response: string) {
    return this.request(`/reviews/${id}/response`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  }

  async deleteReview(id: string) {
    return this.request(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  // Bookings methods
  async getBookings(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/bookings${queryString}`);
  }

  async confirmBooking(id: string) {
    return this.request(`/bookings/${id}/confirm`, {
      method: 'PUT',
    });
  }

  async cancelBooking(id: string, reason?: string) {
    return this.request(`/bookings/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async cleanupExpiredBookings() {
    return this.request('/bookings/cleanup/expired', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();