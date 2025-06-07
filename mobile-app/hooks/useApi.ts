import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export function useApi<T>(
  apiCall: () => Promise<{ data: T | null; error: string | null }>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      if (result.error) {
        setError(result.error);
      } else {
        setData(result.data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
}

export function useProducts() {
  return useApi(() => apiService.getProducts());
}

export function useLocations() {
  return useApi(() => apiService.getLocations());
}

export function useSales() {
  return useApi(() => apiService.getSales());
}

export function useAlerts() {
  return useApi(() => apiService.getAlerts());
}

export function useAnalytics(timeRange: string = '30d') {
  return useApi(() => apiService.getAnalytics(timeRange), [timeRange]);
}