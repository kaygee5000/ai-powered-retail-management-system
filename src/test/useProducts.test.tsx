import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '../hooks/useProducts';

// Mock the apiService
vi.mock('../services/apiService', () => ({
  apiService: {
    getProducts: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

describe('useProducts hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch products successfully', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        sku: 'TEST-001',
        category: 'Electronics',
        price: 99.99,
        stock: 10,
        min_stock: 5,
        location_id: 'loc-1',
        last_updated: '2024-01-01',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        user_id: 'user-1',
      },
    ];

    const { apiService } = require('../services/apiService');
    apiService.getProducts.mockResolvedValue({
      data: mockProducts,
      error: null,
    });

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.error).toBeNull();
    expect(apiService.getProducts).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch error', async () => {
    const { apiService } = require('../services/apiService');
    apiService.getProducts.mockResolvedValue({
      data: null,
      error: 'Failed to fetch products',
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch products');
  });

  it('should create product successfully', async () => {
    const { apiService } = require('../services/apiService');
    
    // Initial fetch
    apiService.getProducts.mockResolvedValue({
      data: [],
      error: null,
    });

    const newProduct = {
      name: 'New Product',
      sku: 'NEW-001',
      category: 'Test',
      price: 49.99,
      stock: 20,
      min_stock: 5,
      location_id: 'loc-1',
    };

    const createdProduct = {
      id: '2',
      ...newProduct,
      last_updated: '2024-01-01',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      user_id: 'user-1',
    };

    apiService.createProduct.mockResolvedValue({
      data: createdProduct,
      error: null,
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const createResult = await result.current.createProduct(newProduct);

    expect(createResult.success).toBe(true);
    expect(createResult.error).toBeNull();
    expect(apiService.createProduct).toHaveBeenCalledWith(newProduct);
  });

  it('should handle create product error', async () => {
    const { apiService } = require('../services/apiService');
    
    apiService.getProducts.mockResolvedValue({
      data: [],
      error: null,
    });

    apiService.createProduct.mockResolvedValue({
      data: null,
      error: 'SKU already exists',
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newProduct = {
      name: 'Duplicate Product',
      sku: 'DUP-001',
      category: 'Test',
      price: 49.99,
      stock: 20,
      min_stock: 5,
      location_id: 'loc-1',
    };

    const createResult = await result.current.createProduct(newProduct);

    expect(createResult.success).toBe(false);
    expect(createResult.error).toBe('SKU already exists');
  });

  it('should apply filters when fetching products', async () => {
    const { apiService } = require('../services/apiService');
    apiService.getProducts.mockResolvedValue({
      data: [],
      error: null,
    });

    const filters = {
      category: 'Electronics',
      location_id: 'loc-1',
      low_stock: true,
    };

    renderHook(() => useProducts(filters));

    await waitFor(() => {
      expect(apiService.getProducts).toHaveBeenCalledWith(filters);
    });
  });

  it('should update product successfully', async () => {
    const { apiService } = require('../services/apiService');
    
    const existingProduct = {
      id: '1',
      name: 'Existing Product',
      sku: 'EXIST-001',
      category: 'Electronics',
      price: 99.99,
      stock: 10,
      min_stock: 5,
      location_id: 'loc-1',
      last_updated: '2024-01-01',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      user_id: 'user-1',
    };

    apiService.getProducts.mockResolvedValue({
      data: [existingProduct],
      error: null,
    });

    const updatedProduct = {
      ...existingProduct,
      name: 'Updated Product',
      price: 109.99,
    };

    apiService.updateProduct.mockResolvedValue({
      data: updatedProduct,
      error: null,
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updates = { name: 'Updated Product', price: 109.99 };
    const updateResult = await result.current.updateProduct('1', updates);

    expect(updateResult.success).toBe(true);
    expect(updateResult.error).toBeNull();
    expect(apiService.updateProduct).toHaveBeenCalledWith('1', updates);
  });

  it('should delete product successfully', async () => {
    const { apiService } = require('../services/apiService');
    
    const existingProduct = {
      id: '1',
      name: 'Product to Delete',
      sku: 'DELETE-001',
      category: 'Electronics',
      price: 99.99,
      stock: 10,
      min_stock: 5,
      location_id: 'loc-1',
      last_updated: '2024-01-01',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      user_id: 'user-1',
    };

    apiService.getProducts.mockResolvedValue({
      data: [existingProduct],
      error: null,
    });

    apiService.deleteProduct.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const deleteResult = await result.current.deleteProduct('1');

    expect(deleteResult.success).toBe(true);
    expect(deleteResult.error).toBeNull();
    expect(apiService.deleteProduct).toHaveBeenCalledWith('1');
  });
});