import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiService } from '../services/aiService';

// Mock fetch for Gemini API calls
global.fetch = vi.fn();

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateProducts', () => {
    it('should generate products successfully', async () => {
      const mockAIResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify([
                  {
                    name: 'Smartphone Case',
                    sku: 'CASE-001',
                    category: 'Electronics',
                    price: 15.99,
                    stock: 50,
                    min_stock: 10
                  },
                  {
                    name: 'USB Cable',
                    sku: 'USB-001',
                    category: 'Electronics',
                    price: 8.99,
                    stock: 100,
                    min_stock: 20
                  }
                ])
              }]
            }
          }]
        }),
      };

      (global.fetch as any).mockResolvedValue(mockAIResponse);

      const result = await aiService.generateProducts('Electronics', 2);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0]).toEqual({
        name: 'Smartphone Case',
        sku: 'CASE-001',
        category: 'Electronics',
        price: 15.99,
        stock: 50,
        min_stock: 10
      });
    });

    it('should handle AI API error', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid request' }
        }),
      };

      (global.fetch as any).mockResolvedValue(mockErrorResponse);

      const result = await aiService.generateProducts('Electronics', 2);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid request');
    });

    it('should handle malformed AI response', async () => {
      const mockAIResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: 'Invalid JSON response'
              }]
            }
          }]
        }),
      };

      (global.fetch as any).mockResolvedValue(mockAIResponse);

      const result = await aiService.generateProducts('Electronics', 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('parsing');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await aiService.generateProducts('Electronics', 2);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('generateBusinessInsight', () => {
    it('should generate business insights successfully', async () => {
      const mockInsight = 'Your electronics category is performing well with a 15% increase in sales this month.';
      
      const mockAIResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: mockInsight
              }]
            }
          }]
        }),
      };

      (global.fetch as any).mockResolvedValue(mockAIResponse);

      const mockData = {
        totalSales: 15000,
        totalItems: 250,
        topProducts: [
          { name: 'Smartphone', sales: 5000 },
          { name: 'Laptop', sales: 8000 }
        ],
        salesTrend: [100, 120, 150, 180, 200]
      };

      const result = await aiService.generateBusinessInsight(mockData);

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockInsight);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('totalSales'),
        })
      );
    });

    it('should handle missing candidates in response', async () => {
      const mockAIResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: []
        }),
      };

      (global.fetch as any).mockResolvedValue(mockAIResponse);

      const result = await aiService.generateBusinessInsight({ totalSales: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('content');
    });
  });

  describe('parseReportText', () => {
    it('should parse report text successfully', async () => {
      const mockParsedData = {
        inventory: [
          { product: 'Apples', quantity: 50, notes: 'Fresh stock' },
          { product: 'Bananas', quantity: 30, notes: 'Some overripe' }
        ],
        alerts: [
          { type: 'low_stock', message: 'Running low on bananas' }
        ],
        notes: 'Overall inventory looks good'
      };

      const mockAIResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(mockParsedData)
              }]
            }
          }]
        }),
      };

      (global.fetch as any).mockResolvedValue(mockAIResponse);

      const reportText = 'We have 50 apples in stock, fresh delivery. Bananas are running low with only 30 left, some are overripe.';
      const result = await aiService.parseReportText(reportText);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockParsedData);
    });

    it('should fallback to rule-based parsing when AI fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      const reportText = 'Simple inventory update: 50 apples, 30 bananas. All good.';
      const result = await aiService.parseReportText(reportText);

      // Should still succeed with rule-based fallback
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.inventory).toEqual([]);
      expect(result.data.alerts).toEqual([]);
      expect(result.data.notes).toBe('');
    });
  });

  describe('API key validation', () => {
    it('should handle missing API key', async () => {
      // Temporarily remove the API key
      const originalEnv = import.meta.env.VITE_GEMINI_API_KEY;
      delete (import.meta.env as any).VITE_GEMINI_API_KEY;

      const result = await aiService.generateProducts('Electronics', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key');

      // Restore the API key
      (import.meta.env as any).VITE_GEMINI_API_KEY = originalEnv;
    });
  });
});