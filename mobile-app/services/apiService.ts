import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthResponse {
  user: User | null;
  session: Session | null;
  access_token?: string;
  refresh_token?: string;
  error?: any;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      this.baseUrl = `${supabaseUrl}/functions/v1`;
    } else {
      console.error('EXPO_PUBLIC_SUPABASE_URL is not set in environment variables.');
      this.baseUrl = '';
    }
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

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
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data.user, session: data.session, error };
  }

  async signUp(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { user: data.user, session: data.session, error };
  }

  async signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getSession(): Promise<{ user: User | null; session: Session | null; error: any }> {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { user: session?.user || null, session, error };
  }

  // Products API
  async getProducts(filters?: any) {
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
  async getLocations(filters?: any) {
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
  async getSales(filters?: any) {
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
  async getAlerts(filters?: any) {
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

  // Analytics API
  async getAnalytics(timeRange: string = '30d') {
    return this.request<any>(`/analytics?timeRange=${timeRange}`);
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
}

export const apiService = new ApiService();