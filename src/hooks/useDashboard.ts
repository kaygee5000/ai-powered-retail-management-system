import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useDateRange } from './useDateRange';

interface DashboardStats {
  totalSales: number;
  salesChange: number;
  salesTrend?: any;
  totalLocations: number;
  locationsChange: number;
  locationsTrend?: any;
  activeAlerts: number;
  alertsChange: number;
  alertsTrend?: any;
  inventoryValue: number;
  inventoryChange: number;
  inventoryTrend?: any;
}

interface SalesDataPoint {
  name: string;
  sales: number;
}

interface CategoryDataPoint {
  name: string;
  value: number;
  sales: number;
}

interface RecentLocation {
  id: string;
  name: string;
  manager: string;
  status: string;
  locationSales: number;
  locationAlerts: number;
}

interface RecentAlert {
  id: string;
  message: string;
  severity: string;
  location: string;
  timestamp: string;
  resolved: boolean;
}

interface DataLoading {
  sales: boolean;
  locations: boolean;
  alerts: boolean;
  products: boolean;
}

export const useDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSales: 0,
    salesChange: 0,
    totalLocations: 0,
    locationsChange: 0,
    activeAlerts: 0,
    alertsChange: 0,
    inventoryValue: 0,
    inventoryChange: 0
  });

  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState<DataLoading>({
    sales: false,
    locations: false,
    alerts: false,
    products: false
  });

  const { dateRange, filterByDateRange } = useDateRange();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch analytics data which includes dashboard stats
      const analyticsResult = await apiService.getAnalytics('7d');
      if (analyticsResult.data) {
        const analytics = analyticsResult.data;
        
        setDashboardStats({
          totalSales: analytics.overview.totalRevenue,
          salesChange: analytics.overview.revenueGrowth,
          totalLocations: analytics.locationAnalytics.performance.length,
          locationsChange: 0, // Would need historical data
          activeAlerts: analytics.productAnalytics.lowStockAlerts.length,
          alertsChange: 0, // Would need historical data
          inventoryValue: analytics.productAnalytics.lowStockAlerts.reduce((sum: number, item: any) => 
            sum + (item.currentStock * 50), 0), // Estimate
          inventoryChange: 0 // Would need historical data
        });

        // Set sales trend data
        setSalesData(analytics.salesTrends.daily.map((day: any) => ({
          name: day.date,
          sales: day.revenue
        })));

        // Set location data
        setRecentLocations(analytics.locationAnalytics.performance.map((location: any, index: number) => ({
          id: `location-${index}`,
          name: location.name,
          manager: 'Manager', // Would come from actual location data
          status: 'active',
          locationSales: location.revenue,
          locationAlerts: Math.floor(Math.random() * 5)
        })));
      }

      // Generate some mock category data since we don't have product categories in analytics yet
      setCategoryData([
        { name: 'Electronics', value: 35, sales: 15000 },
        { name: 'Clothing', value: 25, sales: 10000 },
        { name: 'Food', value: 20, sales: 8000 },
        { name: 'Books', value: 10, sales: 4000 },
        { name: 'Other', value: 10, sales: 4000 }
      ]);

      // Generate some mock recent alerts
      setRecentAlerts([
        {
          id: '1',
          message: 'Low stock alert for Product A',
          severity: 'high',
          location: 'Main Store',
          timestamp: new Date().toISOString(),
          resolved: false
        },
        {
          id: '2',
          message: 'Unusual sales activity detected',
          severity: 'medium',
          location: 'Branch Store',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: false
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  return {
    dashboardStats,
    salesData,
    categoryData,
    recentLocations,
    recentAlerts,
    loading,
    dataLoading
  };
};