import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { apiService } from '../services/apiService';
import { useDateRange } from './useDateRange';
// Removed unused TrendCalculation, formatTrend imports

// Define FormattedTrend structure based on formatTrend return type
interface FormattedTrend {
  value: string;
  color: string;
  icon: 'up' | 'down' | 'stable';
  tooltip: string;
}

interface DashboardStats {
  totalSales: number;
  salesChange: number;
  salesTrend?: FormattedTrend | null;
  totalLocations: number;
  locationsChange: number;
  locationsTrend?: FormattedTrend | null;
  activeAlerts: number;
  alertsChange: number;
  alertsTrend?: FormattedTrend | null;
  inventoryValue: number;
  inventoryChange: number;
  inventoryTrend?: FormattedTrend | null;
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

// Removed unused DataLoading interface

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
  // Removed dataLoading and setDataLoading as they were unused

  const { dateRange } = useDateRange(); // Removed filterByDateRange

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch analytics data which includes dashboard stats
      const analyticsResult = await apiService.getAnalytics(dateRange.key);
      if (analyticsResult.data) {
        const analytics = analyticsResult.data;
        
        // Define types for items from analytics data to avoid 'any'
        type AnalyticsLowStockItem = typeof analytics.productAnalytics.lowStockAlerts[0];
        type AnalyticsDailySalesItem = typeof analytics.salesTrends.daily[0];
        type AnalyticsLocationPerformanceItem = typeof analytics.locationAnalytics.performance[0];

        setDashboardStats({
          totalSales: analytics.overview.totalRevenue,
          salesChange: analytics.overview.revenueGrowth,
          // TODO: Populate actual trends if analytics data provides them or calculate them
          // salesTrend: formatTrend(calculateSalesTrend(analytics.salesTrends.daily...)),
          totalLocations: analytics.locationAnalytics.performance.length,
          locationsChange: 0,
          activeAlerts: analytics.productAnalytics.lowStockAlerts.length,
          alertsChange: 0,
          inventoryValue: analytics.productAnalytics.lowStockAlerts.reduce((sum: number, item: AnalyticsLowStockItem) =>
            sum + (item.currentStock * 50), 0), // Estimate, assuming price is 50
          inventoryChange: 0
        });

        setSalesData(analytics.salesTrends.daily.map((day: AnalyticsDailySalesItem) => ({
          name: day.date,
          sales: day.revenue
        })));

        setRecentLocations(analytics.locationAnalytics.performance.map((location: AnalyticsLocationPerformanceItem, index: number) => ({
          id: `location-${index}`, // Consider using actual location ID if available
          name: location.name,
          manager: 'Manager', // Placeholder, should come from actual location data
          status: 'active', // Placeholder
          locationSales: location.revenue,
          locationAlerts: Math.floor(Math.random() * 5) // Placeholder
        })));
      }

      // Mock data should ideally be removed or replaced with actual data sources
      setCategoryData([
        { name: 'Electronics', value: 35, sales: 15000 },
        { name: 'Clothing', value: 25, sales: 10000 },
        { name: 'Food', value: 20, sales: 8000 },
        { name: 'Books', value: 10, sales: 4000 },
        { name: 'Other', value: 10, sales: 4000 }
      ]);
      setRecentAlerts([
        { id: '1', message: 'Low stock alert for Product A', severity: 'high', location: 'Main Store', timestamp: new Date().toISOString(), resolved: false },
        { id: '2', message: 'Unusual sales activity detected', severity: 'medium', location: 'Branch Store', timestamp: new Date(Date.now() - 3600000).toISOString(), resolved: false }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]); // Added dateRange as a dependency

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Now depends on the memoized fetchDashboardData

  return {
    dashboardStats,
    salesData,
    categoryData,
    recentLocations,
    recentAlerts,
    loading
    // dataLoading removed
  };
};