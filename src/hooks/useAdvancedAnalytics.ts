import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { apiService } from '../services/apiService';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    topSellingCategory: string;
    revenueGrowth: number;
    ordersGrowth: number;
    customerRetention: number;
    profitMargin: number;
  };
  salesTrends: {
    daily: Array<{
      date: string;
      revenue: number;
      orders: number;
      customers: number;
    }>;
    weekly: Array<{
      week: string; // e.g., "YYYY-WNN"
      revenue: number;
      orders: number;
    }>;
    monthly: Array<{
      month: string; // e.g., "YYYY-MM"
      revenue: number;
      orders: number;
    }>;
  };
  productAnalytics: {
    topProducts: Array<{
      name: string;
      revenue: number;
      quantity: number;
      growth: number;
    }>;
    categoryPerformance: Array<{
      category: string;
      revenue: number;
      quantity: number;
      profit?: number;
    }>;
    lowStockAlerts: Array<{
      name: string;
      currentStock: number;
      minStock: number;
      daysLeft: number;
    }>;
  };
  locationAnalytics: {
    performance: Array<{
      name: string;
      revenue: number;
      growth: number;
      efficiency: number;
    }>;
    comparison: Array<{
      name: string;
      currentRevenue: number;
      previousRevenue: number;
      changePercent: number;
    }>;
  };
  customerInsights: {
    segments: Array<{
      name: string;
      count: number;
      avgSpend: number;
      retention: number;
    }>;
    behavior: {
      peakHours: Array<{
        hour: string; // e.g., "14:00"
        orders: number;
        revenue?: number;
      }>;
      seasonality: Array<{
        month: string; // e.g., "Jan", "Feb"
        factor: number; // e.g., 1.2 for 20% above average
        revenue?: number;
      }>;
    };
  };
  predictiveAnalytics: {
    salesForecast: Array<{
      date: string;
      predicted: number;
      confidence: number;
    }>;
    inventoryNeeds: Array<{
      product: string;
      suggestedOrder: number;
      urgency: string;
    }>;
    trends: Array<{
      metric: string;
      direction: string;
      impact: number;
    }>;
  };
  aiInsights?: {
    keyFindings: string[];
    recommendations: Array<{
      type: string;
      title: string;
      description: string;
      impact: string;
    }>;
    anomalies: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    opportunities: Array<{
      title: string;
      description: string;
      potentialValue: number;
    }>;
  };
}

export const useAdvancedAnalytics = (timeRange: string = '30d') => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  // Removed unused aiProcessing state, as it's derived from loading in the return object
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    // setAiProcessing(true); // Assuming AI processing starts with fetch
    try {
      const { data, error: apiError } = await apiService.getAnalytics(timeRange);
      if (apiError) throw new Error(apiError.message || String(apiError));
      setAnalyticsData(data);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
      // setAiProcessing(false); // AI processing ends
    }
  }, [timeRange]); // Added timeRange to useCallback dependency

  const refreshAnalytics = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]); // Now uses memoized fetchAnalytics

  return {
    analyticsData,
    loading,
    aiProcessing: loading, // Reflect AI processing based on loading state, or manage separately
    error,
    refreshAnalytics
  };
};