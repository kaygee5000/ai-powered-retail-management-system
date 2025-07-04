import React from 'react';
import { 
  TrendingUp, 
  Store, 
  AlertTriangle, 
  Package,
  DollarSign,
  Loader2,
  Brain,
  Eye,
  BarChart3,
  Users
} from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { useAdvancedAnalytics } from '../hooks/useAdvancedAnalytics';
import { useCurrency } from '../hooks/useCurrency';
import { useDateRange } from '../hooks/useDateRange';
import MetricCard from './analytics/MetricCard';
import AIInsightsPanel from './analytics/AIInsightsPanel';
import DateRangePicker from './DateRangePicker';
import { formatTrend } from '../utils/trendCalculations';

const Dashboard: React.FC = () => {
  const { 
    dateRange, 
    updateDateRange, 
    getPeriodInfo 
  } = useDateRange();

  const { 
    dashboardStats, 
    salesData, 
    categoryData, 
    recentLocations, 
    recentAlerts, 
    dataLoading 
  } = useDashboard();

  const { analyticsData, aiProcessing } = useAdvancedAnalytics('7d');
  const { format } = useCurrency();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const enhancedSalesData = salesData.map(item => ({
    ...item,
    profit: item.sales * 0.25, // 25% profit margin
    customers: Math.floor(item.sales / 85) // Avg order value
  }));

  // Format trends with tooltips
  const salesTrendFormatted = dashboardStats.salesTrend ? formatTrend(dashboardStats.salesTrend) : null;
  const alertsTrendFormatted = dashboardStats.alertsTrend ? formatTrend(dashboardStats.alertsTrend) : null;
  const inventoryTrendFormatted = dashboardStats.inventoryTrend ? formatTrend(dashboardStats.inventoryTrend) : null;
  const locationsTrendFormatted = dashboardStats.locationsTrend ? formatTrend(dashboardStats.locationsTrend) : null;

  const periodInfo = getPeriodInfo();

  return (
    <div className="p-6 space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Business overview for <span className="font-medium text-blue-600">{periodInfo.label.toLowerCase()}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker 
            selectedRange={dateRange}
            onRangeChange={updateDateRange}
          />
          {aiProcessing && (
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-purple-800 text-sm">AI analyzing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats Cards with Date Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={`Total Sales ${periodInfo.isToday ? 'Today' : periodInfo.isSingleDay ? 'This Day' : `(${periodInfo.label})`}`}
          value={format(dashboardStats.totalSales)}
          change={dashboardStats.salesChange}
          icon={DollarSign}
          color="bg-blue-500"
          loading={dataLoading.sales}
          trend={salesTrendFormatted?.icon}
          trendTooltip={salesTrendFormatted?.tooltip}
        />
        <MetricCard
          title="Active Locations"
          value={dashboardStats.totalLocations.toString()}
          change={dashboardStats.locationsChange}
          icon={Store}
          color="bg-green-500"
          loading={dataLoading.locations}
          trend={locationsTrendFormatted?.icon}
          trendTooltip={locationsTrendFormatted?.tooltip}
        />
        <MetricCard
          title={`Active Alerts ${periodInfo.isToday ? 'Today' : `(${periodInfo.label})`}`}
          value={dashboardStats.activeAlerts.toString()}
          change={dashboardStats.alertsChange}
          icon={AlertTriangle}
          color="bg-red-500"
          loading={dataLoading.alerts}
          trend={alertsTrendFormatted?.icon}
          trendTooltip={alertsTrendFormatted?.tooltip}
        />
        <MetricCard
          title="Current Inventory Value"
          value={format(dashboardStats.inventoryValue)}
          change={dashboardStats.inventoryChange}
          icon={Package}
          color="bg-purple-500"
          loading={dataLoading.products}
          trend={inventoryTrendFormatted?.icon}
          trendTooltip={inventoryTrendFormatted?.tooltip}
        />
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sales Performance</h2>
              <p className="text-sm text-gray-600">
                Revenue and trends for {periodInfo.label.toLowerCase()}
              </p>
            </div>
            {dataLoading.sales ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                {salesTrendFormatted?.value || '+0.0%'} vs previous period
              </div>
            )}
          </div>
          {dataLoading.sales ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading sales data...</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={enhancedSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3B82F6" 
                  fill="rgba(59, 130, 246, 0.1)"
                  strokeWidth={3}
                  name="Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10B981" 
                  fill="rgba(16, 185, 129, 0.1)"
                  strokeWidth={2}
                  name="Profit"
                />
                <Line 
                  type="monotone" 
                  dataKey="customers" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Customers"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Performance - Enhanced */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Category Insights</h2>
          {dataLoading.products ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading category data...</p>
              </div>
            </div>
          ) : categoryData.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory data</h3>
                <p className="text-gray-500">Add some products to see category breakdown</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value}% (${format(props.payload.sales)})`,
                      'Value'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {categoryData.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{category.value}%</span>
                      <p className="text-xs text-gray-500">{format(category.sales)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Section */}
      {analyticsData && (
        <div className="lg:col-span-2">
          <AIInsightsPanel insights={analyticsData.aiInsights} loading={aiProcessing} />
        </div>
      )}

      {/* Location Performance & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Top Performing Locations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Location Performance</h2>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
              <Eye className="w-4 h-4" />
              View All
            </button>
          </div>
          {dataLoading.locations || dataLoading.sales ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentLocations.length === 0 ? (
            <div className="text-center py-8">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
              <p className="text-gray-500">Add your first location to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentLocations.map((location, index) => (
                <div key={location.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                      <div className={`w-3 h-3 rounded-full ${
                        location.status === 'active' ? 'bg-green-500' : 
                        location.status === 'attention' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-500">{location.manager}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{format(location.locationSales)}</p>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-500">{location.locationAlerts} alerts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Recent Alerts */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
              <Eye className="w-4 h-4" />
              View All
            </button>
          </div>
          {dataLoading.alerts ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-full"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentAlerts.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active alerts</h3>
              <p className="text-gray-500">All systems are running smoothly for {periodInfo.label.toLowerCase()}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.severity === 'high' ? 'bg-red-500' :
                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{alert.location}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Quick Actions</h3>
            <p className="text-blue-700">Analyze {periodInfo.label.toLowerCase()} performance or take action on your business</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              <BarChart3 className="w-4 h-4" />
              View Analytics
            </button>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Brain className="w-4 h-4" />
              AI Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;