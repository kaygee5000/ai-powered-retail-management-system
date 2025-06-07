import { useState, useEffect } from 'react';
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
    weekly: any[];
    monthly: any[];
  };
  productAnalytics: {
    topProducts: Array<{
      name: string;
      revenue: number;
      quantity: number;
      growth: number;
    }>;
    categoryPerformance: any[];
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
    comparison: any[];
  };
  customerInsights: {
    segments: Array<{
      name: string;
      count: number;
      avgSpend: number;
      retention: number;
    }>;
    behavior: {
      peakHours: any[];
      seasonality: any[];
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
  const [aiProcessing, setAiProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getAnalytics(timeRange);
      if (apiError) throw new Error(apiError);
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err.message);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    await fetchAnalytics();
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  return {
    analyticsData,
    loading,
    aiProcessing,
    error,
    refreshAnalytics
  };
};