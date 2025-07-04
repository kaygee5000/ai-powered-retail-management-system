import { supabase } from '../lib/supabase';
import { Product } from '../hooks/useProducts';
import { Location } from '../hooks/useLocations';
import { Sale } from '../hooks/useSales';
import { Alert } from '../hooks/useAlerts';
import { Report, ParsedReportData } from '../hooks/useReports';
import { UserSettings } from '../hooks/useSettings';
import { AnalyticsData } from '../hooks/useAdvancedAnalytics';
import { Notification } from '../hooks/useNotifications'; // Import Notification type

// Define InventoryAdjustment type based on usage
interface InventoryAdjustment {
  id: string;
  product_id: string;
  quantity_change: number;
  reason: 'damaged' | 'expired' | 'theft' | 'restock' | 'recount' | 'promotion' | 'transfer' | 'other';
  notes?: string | null;
  timestamp: string;
  created_at: string;
  user_id: string;
  // Add location_id if it's part of the response, based on filters
  location_id?: string;
}

// Define SalesReturn type based on usage
interface SalesReturn {
  id: string;
  original_sale_id?: string | null;
  product_id?: string | null;
  quantity_returned?: number | null;
  refund_amount: number;
  reason: 'defective' | 'wrong_item' | 'customer_change_mind' | 'damaged' | 'expired' | 'duplicate' | 'other';
  notes?: string | null;
  timestamp: string;
  location_id: string;
  staff: string;
  created_at: string;
  user_id: string;
}

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
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
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
    return this.request<Product[]>(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id: string) {
    return this.request<Product>(`/products/${id}`);
  }

  async createProduct(product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'location'>>) {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'location'>>) {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string) {
    // Delete typically returns a very minimal response, or no content (204)
    // For consistency with other methods, we can expect a simple success/error object or specific type if API provides one.
    return this.request<{ success: boolean; message?: string } | null>(`/products/${id}`, {
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
    return this.request<Location[]>(`/locations${queryString ? `?${queryString}` : ''}`);
  }

  async getLocation(id: string) {
    return this.request<Location>(`/locations/${id}`);
  }

  async createLocation(location: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'sales' | 'inventory' | 'last_report' | 'alerts'>>) {
    return this.request<Location>('/locations', {
      method: 'POST',
      body: JSON.stringify(location),
    });
  }

  async updateLocation(id: string, updates: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'sales' | 'inventory' | 'last_report' | 'alerts'>>) {
    return this.request<Location>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLocation(id: string) {
    return this.request<{ success: boolean; message?: string } | null>(`/locations/${id}`, {
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
    return this.request<Sale[]>(`/sales${queryString ? `?${queryString}` : ''}`);
  }

  async getSale(id: string) {
    return this.request<Sale>(`/sales/${id}`);
  }

  async createSale(sale: Partial<Omit<Sale, 'id' | 'created_at' | 'user_id' | 'location'>>) {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id: string, updates: Partial<Omit<Sale, 'id' | 'created_at' | 'user_id' | 'location'>>) {
    return this.request<Sale>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSale(id: string) {
    return this.request<{ success: boolean; message?: string } | null>(`/sales/${id}`, {
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
    return this.request<Alert[]>(`/alerts${queryString ? `?${queryString}` : ''}`);
  }

  async createAlert(alert: Partial<Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'location' | 'resolved'>>) {
    return this.request<Alert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  async resolveAlert(id: string) {
    // Resolve might return the updated alert or just a success status
    return this.request<Alert | { success: boolean }>(`/alerts/${id}/resolve`, {
      method: 'PUT',
    });
  }

  async deleteAlert(id: string) {
    return this.request<{ success: boolean; message?: string } | null>(`/alerts/${id}`, {
      method: 'DELETE',
    });
  }

  // Reports API
  async getReports() {
    return this.request<Report[]>('/ai-reports');
  }

  async createReport(report: Partial<Omit<Report, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'location' | 'status' | 'confidence' | 'parsed_data'>>) {
    return this.request<Report>('/ai-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async parseText(text: string, confidenceThreshold?: number) {
    // The response from parseText might be just ParsedReportData or a fuller object
    return this.request<{ parsed_data: ParsedReportData; confidence?: number } | ParsedReportData>('/ai-reports/parse', {
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
    return this.request<InventoryAdjustment[]>(`/inventory-adjustments${queryString ? `?${queryString}` : ''}`);
  }

  async createInventoryAdjustment(adjustment: Omit<InventoryAdjustment, 'id' | 'created_at' | 'user_id' | 'location_id'>) {
    return this.request<InventoryAdjustment>('/inventory-adjustments', {
      method: 'POST',
      body: JSON.stringify(adjustment),
    });
  }

  async deleteInventoryAdjustment(id: string) {
    return this.request<{ success: boolean; message?: string } | null>(`/inventory-adjustments/${id}`, {
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
    return this.request<SalesReturn[]>(`/sales-returns${queryString ? `?${queryString}` : ''}`);
  }

  async createSalesReturn(salesReturn: Omit<SalesReturn, 'id' | 'created_at' | 'user_id'>) {
    return this.request<SalesReturn>('/sales-returns', {
      method: 'POST',
      body: JSON.stringify(salesReturn),
    });
  }

  async deleteSalesReturn(id: string) {
    return this.request<{ success: boolean; message?: string } | null>(`/sales-returns/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings API
  async getSettings() {
    return this.request<UserSettings>('/user-settings');
  }

  async updateSettings(updates: Partial<UserSettings>) {
    return this.request<UserSettings>('/user-settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Analytics API
  async getAnalytics(timeRange: string = '30d') {
    return this.request<AnalyticsData>(`/analytics?timeRange=${timeRange}`);
  }

  // Real-time notifications API
  async subscribeToNotifications(callback: (notification: Notification) => void): Promise<() => void> {
    // Use Server-Sent Events for real-time notifications
    // const headers = await this.getAuthHeaders(); // Removed unused headers
    const eventSource = new EventSource(`${this.baseUrl}/notifications/stream`, {
      // EventSource constructor doesn't directly take headers like fetch.
      // Auth for EventSource is typically handled via query params or cookies,
      // or if the server supports it, by upgrading a fetch request.
      // For now, assuming the endpoint is protected by cookie/session or allows token in query.
      // If direct header auth is needed, a different approach for EventSource or websockets would be required.
      // This cast to `any` for headers will likely not work as intended for EventSource.
      // Let's remove it or assume token is passed differently (e.g. in URL if server supports)
    } as EventSourceInit); // Added EventSourceInit type, headers part is tricky

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
    data?: Record<string, unknown>; // Match Notification['data']
  }) {
    // Assuming sendNotification might return the created notification or a success status
    return this.request<Notification | { success: boolean }>('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }
}

export const apiService = new ApiService();