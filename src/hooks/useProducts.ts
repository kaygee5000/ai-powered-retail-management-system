import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  location_id: string;
  location?: {
    name: string;
  };
  last_updated: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ProductFilters {
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
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (filters: ProductFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getProducts(filters);
      if (apiError) throw new Error(apiError);
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData: {
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    min_stock: number;
    location_id: string;
  }) => {
    try {
      const { data, error: apiError } = await apiService.createProduct(productData);
      if (apiError) throw new Error(apiError);
      
      // Refresh the products list
      await fetchProducts();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateProduct = async (id: string, updates: Partial<{
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    min_stock: number;
    location_id: string;
  }>) => {
    try {
      const { data, error: apiError } = await apiService.updateProduct(id, updates);
      if (apiError) throw new Error(apiError);
      
      // Refresh the products list
      await fetchProducts();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.deleteProduct(id);
      if (apiError) throw new Error(apiError);
      
      // Refresh the products list
      await fetchProducts();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const getProduct = async (id: string) => {
    try {
      const { data, error: apiError } = await apiService.getProduct(id);
      if (apiError) throw new Error(apiError);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct
  };
};