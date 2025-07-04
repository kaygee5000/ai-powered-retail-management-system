import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { apiService } from '../services/apiService';

interface Alert {
  id: string;
  type: 'low_stock' | 'high_return' | 'unusual_activity' | 'sales_spike' | 'system';
  severity: 'low' | 'medium' | 'high';
  message: string;
  location_id: string;
  location?: {
    name: string;
  };
  timestamp: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface AlertFilters {
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
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (filters: AlertFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getAlerts(filters);
      if (apiError) throw new Error(apiError.message || String(apiError));
      setAlerts(data || []);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array as it doesn't rely on component scope variables

  const addAlert = async (alertData: {
    type: 'low_stock' | 'high_return' | 'unusual_activity' | 'sales_spike' | 'system';
    severity: 'low' | 'medium' | 'high';
    message: string;
    location_id: string;
    timestamp: string;
  }) => {
    try {
      const { data, error: apiError } = await apiService.createAlert(alertData);
      if (apiError) throw new Error(apiError.message || String(apiError));
      
      // Refresh the alerts list
      await fetchAlerts(); // fetchAlerts is memoized, so this is fine
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.resolveAlert(id);
      if (apiError) throw new Error(apiError.message || String(apiError));
      
      // Refresh the alerts list
      await fetchAlerts();
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.deleteAlert(id);
      if (apiError) throw new Error(apiError.message || String(apiError));
      
      // Refresh the alerts list
      await fetchAlerts();
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]); // Added fetchAlerts to dependency array

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    addAlert,
    resolveAlert,
    deleteAlert
  };
};