import { supabase } from '../lib/supabase';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error || `HTTP ${response.status}` };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Network error' };
    }
  }

  // Authentication APIs
  async signIn(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
    }

    return { data, error: null };
  }

  async signUp(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
    }

    return { data, error: null };
  }

  async signOut(token: string) {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
    }

    return { data, error: null };
  }

  async refreshToken(refreshToken: string) {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
    }

    return { data, error: null };
  }

  async resetPassword(email: string) {
    const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
    }

    return { data, error: null };
  }

  async getSession(token?: string) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/auth/session`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
    }

    return { data, error: null };
  }

  // Products API
  async getProducts(filters?: {
    category?: string;
    location_id?: string;
    low_stock?: boolean;
    min_price?: number;
    max_price?: number;
    search?: string;
    sku?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    return this.request<any[]>(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(product: any) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, updates: any) {
    return this.request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string) {
    return this.request<any>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Locations API
  async getLocations(filters?: {
    status?: string;
    manager?: string;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    return this.request<any[]>(`/locations${queryString ? `?${queryString}` : ''}`);
  }

  async getLocation(id: string) {
    return this.request<any>(`/locations/${id}`);
  }

  async createLocation(location: any) {
    return this.request<any>('/locations', {
      method: 'POST',
      body: JSON.stringify(location),
    });
  }

  async updateLocation(id: string, updates: any) {
    return this.request<any>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLocation(id: string) {
    return this.request<any>(`/locations/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales API
  async getSales(filters?: {
    location_id?: string;
    payment_method?: string;
    staff?: string;
    start_date?: string;
    end_date?: string;
    min_total?: number;
    max_total?: number;
    min_items?: number;
    max_items?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    return this.request<any[]>(`/sales${queryString ? `?${queryString}` : ''}`);
  }

  async getSale(id: string) {
    return this.request<any>(`/sales/${id}`);
  }

  async createSale(sale: any) {
    return this.request<any>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id: string, updates: any) {
    return this.request<any>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSale(id: string) {
    return this.request<any>(`/sales/${id}`, {
      method: 'DELETE',
    });
  }

  // Alerts API
  async getAlerts(filters?: {
    type?: string;
    severity?: string;
    resolved?: boolean;
    location_id?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    return this.request<any[]>(`/alerts${queryString ? `?${queryString}` : ''}`);
  }

  async createAlert(alert: any) {
    return this.request<any>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  async resolveAlert(id: string) {
    return this.request<any>(`/alerts/${id}/resolve`, {
      method: 'PUT',
    });
  }

  async deleteAlert(id: string) {
    return this.request<any>(`/alerts/${id}`, {
      method: 'DELETE',
    });
  }

  // Reports API
  async getReports() {
    return this.request<any[]>('/ai-reports');
  }

  async createReport(report: any) {
    return this.request<any>('/ai-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async parseText(text: string, confidenceThreshold?: number) {
    return this.request<any>('/ai-reports/parse', {
      method: 'POST',
      body: JSON.stringify({ text, confidence_threshold: confidenceThreshold }),
    });
  }

  // Inventory Adjustments API
  async getInventoryAdjustments(filters?: {
    product_id?: string;
    reason?: string;
    start_date?: string;
    end_date?: string;
    location_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    return this.request<any[]>(`/inventory-adjustments${queryString ? `?${queryString}` : ''}`);
  }

  async createInventoryAdjustment(adjustment: {
    product_id: string;
    quantity_change: number;
    reason: 'damaged' | 'expired' | 'theft' | 'restock' | 'recount' | 'promotion' | 'transfer' | 'other';
    notes?: string;
    timestamp?: string;
  }) {
    return this.request<any>('/inventory-adjustments', {
      method: 'POST',
      body: JSON.stringify(adjustment),
    });
  }

  async deleteInventoryAdjustment(id: string) {
    return this.request<any>(`/inventory-adjustments/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales Returns API
  async getSalesReturns(filters?: {
    original_sale_id?: string;
    product_id?: string;
    reason?: string;
    start_date?: string;
    end_date?: string;
    location_id?: string;
    staff?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    return this.request<any[]>(`/sales-returns${queryString ? `?${queryString}` : ''}`);
  }

  async createSalesReturn(salesReturn: {
    original_sale_id?: string;
    product_id?: string;
    quantity_returned?: number;
    refund_amount: number;
    reason: 'defective' | 'wrong_item' | 'customer_change_mind' | 'damaged' | 'expired' | 'duplicate' | 'other';
    notes?: string;
    timestamp?: string;
    location_id: string;
    staff: string;
  }) {
    return this.request<any>('/sales-returns', {
      method: 'POST',
      body: JSON.stringify(salesReturn),
    });
  }

  async deleteSalesReturn(id: string) {
    return this.request<any>(`/sales-returns/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings API
  async getSettings() {
    return this.request<any>('/user-settings');
  }

  async updateSettings(updates: any) {
    return this.request<any>('/user-settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Analytics API
  async getAnalytics(timeRange: string = '30d') {
    return this.request<any>(`/analytics?timeRange=${timeRange}`);
  }

  // Real-time notifications API
  async subscribeToNotifications(callback: (notification: any) => void): Promise<() => void> {
    // Use Server-Sent Events for real-time notifications
    const eventSource = new EventSource(`${this.baseUrl}/notifications/stream`, {
      headers: await this.getAuthHeaders() as any
    });

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        callback(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }

  async sendNotification(notification: {
    type: 'alert' | 'report' | 'system';
    title: string;
    message: string;
    userId?: string;
    data?: any;
  }) {
    return this.request<any>('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }
}

export const apiService = new ApiService();