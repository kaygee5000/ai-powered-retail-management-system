import { useState, useEffect, useCallback } from 'react'; // Added useCallback
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

  const fetchSales = useCallback(async (filters: SalesFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getSales(filters);
      if (apiError) throw new Error(apiError.message || String(apiError));
      setSales(data || []);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSale = useCallback(async (saleData: {
    timestamp: string;
    location_id: string;
    total: number;
    items: number;
    staff: string;
    payment_method: string;
  }) => {
    try {
      const { data, error: apiError } = await apiService.createSale(saleData);
      if (apiError) throw new Error(apiError.message || String(apiError));
      
      await fetchSales();
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  }, [fetchSales]);

  const updateSale = useCallback(async (id: string, updates: Partial<{
    timestamp: string;
    location_id: string;
    total: number;
    items: number;
    staff: string;
    payment_method: string;
  }>) => {
    try {
      const { data, error: apiError } = await apiService.updateSale(id, updates);
      if (apiError) throw new Error(apiError.message || String(apiError));
      
      await fetchSales();
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  }, [fetchSales]);

  const deleteSale = useCallback(async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.deleteSale(id);
      if (apiError) throw new Error(apiError.message || String(apiError));
      
      await fetchSales();
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  }, [fetchSales]);

  const getSale = useCallback(async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.getSale(id);
      if (apiError) throw new Error(apiError.message || String(apiError));
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

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