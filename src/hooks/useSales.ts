import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface Sale {
  id: string;
  timestamp: string;
  location_id: string;
  location?: {
    name: string;
  };
  total: number;
  items: number;
  staff: string;
  payment_method: string;
  created_at: string;
  user_id: string;
}

interface SalesFilters {
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
}

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async (filters: SalesFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getSales(filters);
      if (apiError) throw new Error(apiError);
      setSales(data || []);
    } catch (err: any) {
      setError(err.message);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const addSale = async (saleData: {
    timestamp: string;
    location_id: string;
    total: number;
    items: number;
    staff: string;
    payment_method: string;
  }) => {
    try {
      const { data, error: apiError } = await apiService.createSale(saleData);
      if (apiError) throw new Error(apiError);
      
      // Refresh the sales list
      await fetchSales();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateSale = async (id: string, updates: Partial<{
    timestamp: string;
    location_id: string;
    total: number;
    items: number;
    staff: string;
    payment_method: string;
  }>) => {
    try {
      const { data, error: apiError } = await apiService.updateSale(id, updates);
      if (apiError) throw new Error(apiError);
      
      // Refresh the sales list
      await fetchSales();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.deleteSale(id);
      if (apiError) throw new Error(apiError);
      
      // Refresh the sales list
      await fetchSales();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const getSale = async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.getSale(id);
      if (apiError) throw new Error(apiError);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return {
    sales,
    loading,
    error,
    fetchSales,
    addSale,
    updateSale,
    deleteSale,
    getSale
  };
};