import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { apiService } from '../services/apiService';

interface Location {
  id: string;
  name: string;
  address: string;
  manager: string;
  status: 'active' | 'inactive' | 'attention';
  sales: number;
  inventory: number;
  last_report: string;
  alerts: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface LocationFilters {
  status?: string;
  manager?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async (filters: LocationFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getLocations(filters);
      if (apiError) throw new Error(apiError.message || String(apiError));
      setLocations(data || []);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, []); // fetchLocations itself doesn't depend on other hook state/props here

  const addLocation = useCallback(async (locationData: {
    name: string;
    address: string;
    manager: string;
    status?: 'active' | 'inactive' | 'attention';
  }) => {
    try {
      const { data, error: apiError } = await apiService.createLocation(locationData);
      if (apiError) throw new Error(apiError.message || String(apiError));
      
      await fetchLocations();
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  }, [fetchLocations]);

  const updateLocation = useCallback(async (id: string, updates: Partial<{
    name: string;
    address: string;
    manager: string;
    status: 'active' | 'inactive' | 'attention';
  }>) => {
    try {
      const { data, error: apiError } = await apiService.updateLocation(id, updates);
      if (apiError) throw new Error(apiError.message || String(apiError));
      
      await fetchLocations();
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  }, [fetchLocations]);

  const deleteLocation = useCallback(async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.deleteLocation(id);
      if (apiError) throw new Error(apiError.message || String(apiError));
      
      await fetchLocations();
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  }, [fetchLocations]);

  const getLocation = useCallback(async (id: string) => {
    // This function doesn't modify state or call fetchLocations,
    // so its memoization is mainly for stable reference if passed as prop/dependency.
    try {
      const { data, error: apiError } = await apiService.getLocation(id);
      if (apiError) throw new Error(apiError.message || String(apiError));
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]); // Now depends on memoized fetchLocations

  return {
    locations,
    loading,
    error,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    getLocation
  };
};