import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiService } from '../services/apiService';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock for auth session
    const { supabase } = require('../lib/supabase');
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    });
  });

  describe('Products API', () => {
    it('should try function endpoint first', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          { id: '1', name: 'Test Product', sku: 'TEST-001' },
        ]),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await apiService.getProducts();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/products'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.error).toBeNull();
      expect(result.data).toEqual([
        { id: '1', name: 'Test Product', sku: 'TEST-001' },
      ]);
    });

    it('should fallback to Supabase when function not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ error: 'Endpoint not found' }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const { supabase } = require('../lib/supabase');
      const mockSupabaseQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        data: [{ id: '1', name: 'Fallback Product' }],
        error: null,
      };
      
      supabase.from.mockReturnValue(mockSupabaseQuery);

      const result = await apiService.getProducts();

      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(result.error).toBeNull();
      expect(result.data).toEqual([{ id: '1', name: 'Fallback Product' }]);
    });

    it('should handle function endpoint success', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', sku: 'PROD-001', price: 10.99 },
        { id: '2', name: 'Product 2', sku: 'PROD-002', price: 15.99 },
      ];

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockProducts),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await apiService.getProducts({ category: 'electronics' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products?category=electronics'),
        expect.any(Object)
      );
      
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockProducts);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await apiService.getProducts();

      expect(result.error).toBe('Network error');
      expect(result.data).toBeNull();
    });
  });

  describe('Request method', () => {
    it('should include authorization headers', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      await apiService.getProducts();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle unauthorized responses', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await apiService.getProducts();

      expect(result.error).toBe('Unauthorized');
      expect(result.data).toBeNull();
    });
  });
});