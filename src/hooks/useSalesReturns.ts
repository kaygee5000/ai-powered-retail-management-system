import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface SalesReturn {
  id: string;
  original_sale_id: string | null;
  original_sale?: {
    id: string;
    total: number;
    timestamp: string;
  };
  product_id: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  quantity_returned: number | null;
  refund_amount: number;
  reason: 'defective' | 'wrong_item' | 'customer_change_mind' | 'damaged' | 'expired' | 'duplicate' | 'other';
  notes: string | null;
  timestamp: string;
  location_id: string;
  location?: {
    id: string;
    name: string;
  };
  staff: string;
  created_at: string;
  user_id: string;
}

interface SalesReturnFilters {
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
}

export const useSalesReturns = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReturns = async (filters: SalesReturnFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getSalesReturns(filters);
      if (apiError) throw new Error(apiError);
      setReturns(data || []);
    } catch (err: any) {
      setError(err.message);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const addReturn = async (returnData: {
    original_sale_id?: string;
    product_id?: string;
    quantity_returned?: number;
    refund_amount: number;
    reason: 'defective' | 'wrong_item' | 'customer_change_mind' | 'damaged' | 'expired' | 'duplicate' | 'other';
    notes?: string;
    timestamp?: string;
    location_id: string;
    staff: string;
  }) => {
    try {
      const { data, error: apiError } = await apiService.createSalesReturn(returnData);
      if (apiError) throw new Error(apiError);
      
      // Refresh the returns list
      await fetchReturns();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteReturn = async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.deleteSalesReturn(id);
      if (apiError) throw new Error(apiError);
      
      // Refresh the returns list
      await fetchReturns();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  return {
    returns,
    loading,
    error,
    fetchReturns,
    addReturn,
    deleteReturn
  };
};