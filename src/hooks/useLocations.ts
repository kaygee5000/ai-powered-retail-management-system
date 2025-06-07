import { useState, useEffect } from 'react';
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

  const fetchLocations = async (filters: LocationFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getLocations(filters);
      if (apiError) throw new Error(apiError);
      setLocations(data || []);
    } catch (err: any) {
      setError(err.message);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async (locationData: {
    name: string;
    address: string;
    manager: string;
    status?: 'active' | 'inactive' | 'attention';
  }) => {
    try {
      const { data, error: apiError } = await apiService.createLocation(locationData);
      if (apiError) throw new Error(apiError);
      
      // Refresh the locations list
      await fetchLocations();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateLocation = async (id: string, updates: Partial<{
    name: string;
    address: string;
    manager: string;
    status: 'active' | 'inactive' | 'attention';
  }>) => {
    try {
      const { data, error: apiError } = await apiService.updateLocation(id, updates);
      if (apiError) throw new Error(apiError);
      
      // Refresh the locations list
      await fetchLocations();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.deleteLocation(id);
      if (apiError) throw new Error(apiError);
      
      // Refresh the locations list
      await fetchLocations();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const getLocation = async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.getLocation(id);
      if (apiError) throw new Error(apiError);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

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