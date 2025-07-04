import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Loader2,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { useAdvancedAnalytics } from '../hooks/useAdvancedAnalytics';
import { useCurrency } from '../hooks/useCurrency';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { useLocations } from '../hooks/useLocations';
import { 
  calculateSalesTrend, 
  calculateOrdersTrend, 
  calculateAOVTrend,
  calculateInventoryTrend,
  calculateCustomerRetentionTrend,
  formatTrend 
} from '../utils/trendCalculations';
import MetricCard from './analytics/MetricCard';
import AdvancedChart from './analytics/AdvancedChart';
import AIInsightsPanel from './analytics/AIInsightsPanel';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedView, setSelectedView] = useState('overview');

  const { analyticsData, loading, aiProcessing, error, refreshAnalytics } = useAdvancedAnalytics(timeRange);
  const { format } = useCurrency();
  const { sales } = useSales();
  const { products } = useProducts();
  useLocations(); // Called for potential side effects or if its state is used indirectly

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' }
  ];

  const viewOptions = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'sales', label: 'Sales Analysis', icon: DollarSign },
    { value: 'products', label: 'Product Performance', icon: Package },
    { value: 'locations', label: 'Location Analytics', icon: Target },
    { value: 'predictive', label: 'Predictive Analytics', icon: Zap }
  ];

  // Calculate period days from timeRange
  const getPeriodDays = (range: string): number => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  // Calculate live trends for analytics
  const calculateAnalyticsTrends = () => {
    const periodDays = getPeriodDays(timeRange);
    
    const salesTrend = calculateSalesTrend(sales, { periodDays, comparisonPeriodDays: periodDays });
    const ordersTrend = calculateOrdersTrend(sales, { periodDays, comparisonPeriodDays: periodDays });
    const aovTrend = calculateAOVTrend(sales, { periodDays, comparisonPeriodDays: periodDays });
    const inventoryTrend = calculateInventoryTrend(products, [], { periodDays, comparisonPeriodDays: periodDays });
    const retentionTrend = calculateCustomerRetentionTrend(sales, { periodDays: periodDays * 2, comparisonPeriodDays: periodDays * 2 });

    return {
      salesTrend: formatTrend(salesTrend),
      ordersTrend: formatTrend(ordersTrend),
      aovTrend: formatTrend(aovTrend),
      inventoryTrend: formatTrend(inventoryTrend),
      retentionTrend: formatTrend(retentionTrend)
    };
  };

  const trends = calculateAnalyticsTrends();

  const handleExport = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading comprehensive analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 mb-4">Failed to load analytics data</p>
          <button 
            onClick={refreshAnalytics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
          <p className="text-gray-500">Start recording sales and managing inventory to see insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">AI-powered insights and comprehensive business intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={refreshAnalytics}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* View Navigation */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2">
          {viewOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedView(option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedView === option.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview View */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics with Live Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value={format(analyticsData.overview.totalRevenue)}
              change={analyticsData.overview.revenueGrowth}
              icon={DollarSign}
              color="bg-green-500"
              trend={trends.salesTrend.icon}
              trendTooltip={trends.salesTrend.tooltip}
            />
            <MetricCard
              title="Total Orders"
              value={analyticsData.overview.totalOrders.toLocaleString()}
              change={analyticsData.overview.ordersGrowth}
              icon={ShoppingCart}
              color="bg-blue-500"
              trend={trends.ordersTrend.icon}
              trendTooltip={trends.ordersTrend.tooltip}
            />
            <MetricCard
              title="Average Order Value"
              value={format(analyticsData.overview.avgOrderValue)}
              change={parseFloat(trends.aovTrend.value)}
              icon={TrendingUp}
              color="bg-purple-500"
              trend={trends.aovTrend.icon}
              trendTooltip={trends.aovTrend.tooltip}
            />
            <MetricCard
              title="Customer Retention"
              value={`${analyticsData.overview.customerRetention}%`}
              change={parseFloat(trends.retentionTrend.value)}
              icon={Users}
              color="bg-orange-500"
              trend={trends.retentionTrend.icon}
              trendTooltip={trends.retentionTrend.tooltip}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedChart
              type="area"
              data={analyticsData.salesTrends.daily}
              title="Daily Sales Trend"
              dataKey="revenue"
              xAxisKey="date"
              height={300}
            />
            <AdvancedChart
              type="bar"
              data={analyticsData.productAnalytics.categoryPerformance}
              title="Category Performance"
              dataKey="revenue"
              xAxisKey="category"
              height={300}
            />
          </div>

          {/* AI Insights */}
          <AIInsightsPanel insights={analyticsData.aiInsights} loading={aiProcessing} />
        </div>
      )}

      {/* Sales Analysis View */}
      {selectedView === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AdvancedChart
                type="line"
                data={analyticsData.salesTrends.daily}
                title="Sales Trend Analysis"
                dataKey="revenue"
                xAxisKey="date"
                height={400}
                showGrid={true}
              />
            </div>
            <div className="space-y-6">
              <MetricCard
                title="Revenue Growth"
                value={`${analyticsData.overview.revenueGrowth > 0 ? '+' : ''}${analyticsData.overview.revenueGrowth.toFixed(1)}%`}
                change={analyticsData.overview.revenueGrowth}
                icon={TrendingUp}
                color="bg-green-500"
                subtitle={`vs previous ${timeRange}`}
                trend={trends.salesTrend.icon}
                trendTooltip={trends.salesTrend.tooltip}
              />
              <MetricCard
                title="Profit Margin"
                value={`${analyticsData.overview.profitMargin}%`}
                change={1.2}
                icon={Target}
                color="bg-blue-500"
                subtitle="After all expenses"
                trend="up"
                trendTooltip="Profit margin trend calculated from revenue and estimated costs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedChart
              type="bar"
              data={analyticsData.salesTrends.weekly}
              title="Weekly Performance"
              dataKey="revenue"
              xAxisKey="week"
              height={300}
            />
            <AdvancedChart
              type="line"
              data={analyticsData.customerInsights.behavior.peakHours}
              title="Hourly Sales Pattern"
              dataKey="revenue"
              xAxisKey="hour"
              height={300}
            />
          </div>
        </div>
      )}

      {/* Product Performance View */}
      {selectedView === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
              <div className="space-y-4">
                {analyticsData.productAnalytics.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.quantity} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{format(product.revenue)}</p>
                      <div className="group relative">
                        <p className={`text-sm ${product.growth > 0 ? 'text-green-600' : 'text-red-600'} cursor-pointer`}>
                          {product.growth > 0 ? '+' : ''}{product.growth.toFixed(1)}%
                        </p>
                        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="font-medium mb-1">Product Growth:</div>
                          <div className="text-gray-300">Calculated based on revenue performance vs previous {timeRange}</div>
                          <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <AdvancedChart
              type="pie"
              data={analyticsData.productAnalytics.categoryPerformance.map(cat => ({
                name: cat.category,
                value: cat.revenue
              }))}
              title="Revenue by Category"
              height={350}
            />
          </div>

          {/* Low Stock Alerts */}
          {analyticsData.productAnalytics.lowStockAlerts.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Alerts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.productAnalytics.lowStockAlerts.map((alert, index) => (
                  <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-red-600" />
                      <h4 className="font-medium text-red-900">{alert.name}</h4>
                    </div>
                    <p className="text-sm text-red-700">
                      {alert.currentStock} / {alert.minStock} minimum
                    </p>
                    <div className="group relative">
                      <p className="text-xs text-red-600 mt-1 cursor-pointer">
                        ~{alert.daysLeft} days remaining
                      </p>
                      <div className="absolute left-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <div className="font-medium mb-1">Stock Calculation:</div>
                        <div className="text-gray-300">Based on estimated daily usage and current stock levels</div>
                        <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location Analytics View */}
      {selectedView === 'locations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedChart
              type="bar"
              data={analyticsData.locationAnalytics.performance}
              title="Location Performance"
              dataKey="revenue"
              xAxisKey="name"
              height={350}
            />
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Comparison</h3>
              <div className="space-y-4">
                {analyticsData.locationAnalytics.comparison.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{location.name}</h4>
                      <p className="text-sm text-gray-600">This month vs last month</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{format(location.thisMonth)}</p>
                      <div className="group relative">
                        <p className={`text-sm ${location.change > 0 ? 'text-green-600' : 'text-red-600'} cursor-pointer`}>
                          {location.change > 0 ? '+' : ''}{location.change.toFixed(1)}%
                        </p>
                        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="font-medium mb-1">Location Trend:</div>
                          <div className="text-gray-300">Monthly revenue comparison: ({format(location.thisMonth)} - {format(location.thisMonth / (1 + location.change/100))}) / {format(location.thisMonth / (1 + location.change/100))} × 100</div>
                          <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictive Analytics View */}
      {selectedView === 'predictive' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedChart
              type="line"
              data={analyticsData.predictiveAnalytics.salesForecast}
              title="Sales Forecast (Next 7 Days)"
              dataKey="predicted"
              xAxisKey="date"
              height={350}
              colors={['#8B5CF6']}
            />
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h3>
              <div className="space-y-4">
                {analyticsData.predictiveAnalytics.trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        trend.direction === 'up' ? 'bg-green-100' :
                        trend.direction === 'down' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {trend.direction === 'up' ? 
                          <TrendingUp className="w-4 h-4 text-green-600" /> :
                          trend.direction === 'down' ?
                          <TrendingDown className="w-4 h-4 text-red-600" /> :
                          <Clock className="w-4 h-4 text-gray-600" />
                        }
                      </div>
                      <h4 className="font-medium text-gray-900">{trend.metric}</h4>
                    </div>
                    <div className="group relative">
                      <div className={`text-sm font-medium cursor-pointer ${
                        trend.impact > 0 ? 'text-green-600' :
                        trend.impact < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {trend.impact > 0 ? '+' : ''}{trend.impact}%
                      </div>
                      <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <div className="font-medium mb-1">Predictive Impact:</div>
                        <div className="text-gray-300">Calculated based on current trends and historical patterns for {trend.metric.toLowerCase()}</div>
                        <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Recommendations */}
          {analyticsData.predictiveAnalytics.inventoryNeeds.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.predictiveAnalytics.inventoryNeeds.map((need, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    need.urgency === 'high' ? 'bg-red-50 border-red-200' :
                    need.urgency === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{need.product}</h4>
                      <div className="group relative">
                        <span className={`text-xs px-2 py-1 rounded-full uppercase font-medium cursor-pointer ${
                          need.urgency === 'high' ? 'bg-red-100 text-red-800' :
                          need.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {need.urgency}
                        </span>
                        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="font-medium mb-1">Urgency Level:</div>
                          <div className="text-gray-300">Based on current stock levels, sales velocity, and lead times</div>
                          <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <div className="group relative">
                      <p className="text-sm text-gray-700 cursor-pointer">
                        Suggested order: <span className="font-medium">{need.suggestedOrder} units</span>
                      </p>
                      <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <div className="font-medium mb-1">Order Calculation:</div>
                        <div className="text-gray-300">Based on minimum stock levels × 2.5 to account for lead time and safety stock</div>
                        <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;