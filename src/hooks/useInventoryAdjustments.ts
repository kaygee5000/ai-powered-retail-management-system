import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface InventoryAdjustment {
  id: string;
  product_id: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  quantity_change: number;
  reason: 'damaged' | 'expired' | 'theft' | 'restock' | 'recount' | 'promotion' | 'transfer' | 'other';
  notes: string | null;
  timestamp: string;
  created_at: string;
  user_id: string;
}

interface InventoryAdjustmentFilters {
  product_id?: string;
  reason?: string;
  start_date?: string;
  end_date?: string;
  location_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const useInventoryAdjustments = () => {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdjustments = async (filters: InventoryAdjustmentFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getInventoryAdjustments(filters);
      if (apiError) throw new Error(apiError);
      setAdjustments(data || []);
    } catch (err: any) {
      setError(err.message);
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  const addAdjustment = async (adjustmentData: {
    product_id: string;
    quantity_change: number;
    reason: 'damaged' | 'expired' | 'theft' | 'restock' | 'recount' | 'promotion' | 'transfer' | 'other';
    notes?: string;
    timestamp?: string;
  }) => {
    try {
      const { data, error: apiError } = await apiService.createInventoryAdjustment(adjustmentData);
      if (apiError) throw new Error(apiError);
      
      // Refresh the adjustments list
      await fetchAdjustments();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteAdjustment = async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.deleteInventoryAdjustment(id);
      if (apiError) throw new Error(apiError);
      
      // Refresh the adjustments list
      await fetchAdjustments();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  return {
    adjustments,
    loading,
    error,
    fetchAdjustments,
    addAdjustment,
    deleteAdjustment
  };
};