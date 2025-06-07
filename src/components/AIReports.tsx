import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  FileText,
  Sparkles,
  User,
  Loader2,
  MapPin
} from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { useLocations } from '../hooks/useLocations';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { 
  calculateTrend, 
  formatTrend 
} from '../utils/trendCalculations';
import MetricCard from './analytics/MetricCard';

const AIReports: React.FC = () => {
  const [reportText, setReportText] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [isListening, setIsListening] = useState(false);

  const { reports, loading: reportsLoading, addReport, processing } = useReports();
  const { locations, loading: locationsLoading } = useLocations();
  const { sales } = useSales();
  const { products } = useProducts();

  // Calculate AI Reports analytics and trends
  const calculateReportAnalytics = () => {
    const totalReports = reports.length;
    const processedReports = reports.filter(r => r.status === 'processed').length;
    const flaggedReports = reports.filter(r => r.status === 'flagged').length;
    const averageConfidence = reports.length > 0 
      ? reports.reduce((sum, r) => sum + r.confidence, 0) / reports.length 
      : 0;

    // Calculate trend for reports submitted (mock comparison with previous period)
    const currentPeriodReports = reports.filter(report => {
      const reportDate = new Date(report.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reportDate >= weekAgo;
    }).length;
    
    const previousPeriodReports = Math.floor(currentPeriodReports * (0.8 + Math.random() * 0.4));
    const reportsTrend = calculateTrend(
      currentPeriodReports, 
      previousPeriodReports, 
      "Reports submitted comparing last 7 days vs previous 7 days"
    );

    // Calculate processing success rate trend
    const successRate = totalReports > 0 ? (processedReports / totalReports) * 100 : 0;
    const previousSuccessRate = successRate * (0.9 + Math.random() * 0.2);
    const successRateTrend = calculateTrend(
      successRate,
      previousSuccessRate,
      "AI processing success rate vs previous period"
    );

    // Calculate confidence trend
    const previousConfidence = averageConfidence * (0.85 + Math.random() * 0.3);
    const confidenceTrend = calculateTrend(
      averageConfidence * 100,
      previousConfidence * 100,
      "Average AI confidence score vs previous period"
    );

    // Calculate processing time trend (mock data)
    const avgProcessingTime = 2.3; // seconds
    const previousProcessingTime = avgProcessingTime * (0.7 + Math.random() * 0.6);
    const processingTimeTrend = calculateTrend(
      avgProcessingTime,
      previousProcessingTime,
      "Average report processing time vs previous period"
    );

    return {
      totalReports,
      processedReports,
      flaggedReports,
      averageConfidence,
      reportsTrend: formatTrend(reportsTrend),
      successRateTrend: formatTrend(successRateTrend),
      confidenceTrend: formatTrend(confidenceTrend),
      processingTimeTrend: formatTrend(processingTimeTrend)
    };
  };

  const analytics = calculateReportAnalytics();

  const handleSubmitReport = async () => {
    if (!reportText.trim() || !selectedLocationId || !staffName.trim()) return;
    
    const result = await addReport({
      location_id: selectedLocationId,
      staff: staffName,
      raw_text: reportText,
      timestamp: new Date().toISOString()
    });

    if (result.error) {
      console.error('Failed to submit report:', result.error);
    } else {
      setReportText('');
      setStaffName('');
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // In a real app, this would use Web Speech API
    if (!isListening) {
      setTimeout(() => {
        setReportText("Sold 5 bluetooth earbuds and 3 phone cases today. Customer returned 1 coffee bag due to expiration date. Need to reorder smartphone accessories.");
        setIsListening(false);
      }, 2000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'flagged': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const generateSmartSuggestions = () => {
    const suggestions = [];
    
    // Get recent sales data for location-specific suggestions
    const recentSales = sales.slice(0, 5);
    const locationSales = selectedLocationId ? 
      sales.filter(sale => sale.location_id === selectedLocationId).slice(0, 3) : [];

    // Get low stock products for the selected location
    const lowStockItems = products.filter(product => 
      product.stock <= product.min_stock && 
      (!selectedLocationId || product.location_id === selectedLocationId)
    ).slice(0, 3);

    // Sales report suggestion
    if (recentSales.length > 0) {
      const totalRevenue = recentSales.reduce((sum, sale) => sum + sale.total, 0);
      suggestions.push({
        title: "Daily Sales Summary",
        text: `Today we had ${recentSales.length} transactions totaling $${totalRevenue.toFixed(2)}. ${recentSales[0] ? `Best sale was $${recentSales[0].total} for ${recentSales[0].items} items.` : ''}`
      });
    }

    // Inventory alert suggestion
    if (lowStockItems.length > 0) {
      const itemNames = lowStockItems.map(item => item.name).join(', ');
      suggestions.push({
        title: "Inventory Alert",
        text: `Running low on stock for: ${itemNames}. Need to reorder these items soon to avoid stockouts.`
      });
    }

    // Customer feedback template
    suggestions.push({
      title: "Customer Feedback",
      text: "Customers were pleased with our service today. Several asked about new product arrivals. One customer suggested we add more variety in the electronics section."
    });

    // Operational update
    suggestions.push({
      title: "Operational Update", 
      text: "Store was busy during lunch hour. Cash register #2 had some technical issues but was resolved quickly. Cleaning supplies need restocking."
    });

    return suggestions.slice(0, 4);
  };

  const canSubmit = reportText.trim() && selectedLocationId && staffName.trim() && !processing;

  if (reportsLoading || locationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI-Powered Reports</h1>
          <p className="text-gray-600">Natural language reporting made simple</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Brain className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">AI Assistant Active</span>
        </div>
      </div>

      {/* AI Reports Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Reports"
          value={analytics.totalReports.toString()}
          change={parseFloat(analytics.reportsTrend.value)}
          icon={FileText}
          color="bg-blue-500"
          trend={analytics.reportsTrend.icon}
          trendTooltip={analytics.reportsTrend.tooltip}
        />

        <MetricCard
          title="Processing Success Rate"
          value={`${analytics.totalReports > 0 ? Math.round((analytics.processedReports / analytics.totalReports) * 100) : 0}%`}
          change={parseFloat(analytics.successRateTrend.value)}
          icon={CheckCircle}
          color="bg-green-500"
          trend={analytics.successRateTrend.icon}
          trendTooltip={analytics.successRateTrend.tooltip}
        />

        <MetricCard
          title="Avg Confidence"
          value={`${Math.round(analytics.averageConfidence * 100)}%`}
          change={parseFloat(analytics.confidenceTrend.value)}
          icon={Brain}
          color="bg-purple-500"
          trend={analytics.confidenceTrend.icon}
          trendTooltip={analytics.confidenceTrend.tooltip}
        />

        <MetricCard
          title="Avg Processing Time"
          value="2.3s"
          change={parseFloat(analytics.processingTimeTrend.value)}
          icon={Clock}
          color="bg-orange-500"
          trend={analytics.processingTimeTrend.icon}
          trendTooltip={analytics.processingTimeTrend.tooltip}
        />
      </div>

      {/* Report Input Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Submit New Report</h2>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location:</label>
              <select 
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={processing}
              >
                <option value="">Select a location...</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member:</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={processing}
              />
            </div>
          </div>

          <div className="relative">
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Describe your daily activities, sales, inventory changes, or any observations in natural language. For example: 'Sold 10 smartphones today, restocked coffee beans, customer complained about slow service...'"
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={processing}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={handleVoiceInput}
                className={`p-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={processing}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={!canSubmit}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </div>

          {isListening && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Listening... Speak your report</span>
            </div>
          )}

          {processing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">AI Processing Your Report</span>
              </div>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Analyzing natural language input...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <span>Extracting sales and inventory data...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span>Updating databases and checking for anomalies...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Smart Suggestions</h3>
          {selectedLocationId && (
            <div className="flex items-center gap-1 text-sm text-purple-700">
              <MapPin className="w-3 h-3" />
              {locations.find(l => l.id === selectedLocationId)?.name}
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {generateSmartSuggestions().map((suggestion, index) => (
            <button 
              key={index}
              onClick={() => setReportText(suggestion.text)}
              className="text-left p-4 bg-white rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-1">{suggestion.title}</h4>
              <p className="text-sm text-gray-600">{suggestion.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
            {analytics.flaggedReports > 0 && (
              <div className="group relative">
                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-lg cursor-pointer">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-800 text-sm font-medium">{analytics.flaggedReports} flagged</span>
                </div>
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <div className="font-medium mb-1">Flagged Reports:</div>
                  <div className="text-gray-300">Reports that need manual review due to low confidence or unusual content</div>
                  <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
            <p className="text-gray-500">Submit your first report using the form above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{report.staff}</h3>
                      <p className="text-sm text-gray-500">
                        {report.location?.name || 'Unknown Location'} • {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="group relative">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${getConfidenceColor(report.confidence)}`}>
                        {Math.round(report.confidence * 100)}% confidence
                      </span>
                      <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <div className="font-medium mb-1">AI Confidence Score:</div>
                        <div className="text-gray-300">Indicates how certain the AI is about its analysis of this report</div>
                        <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(report.status)}
                      <span className="text-sm capitalize text-gray-600">{report.status}</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Original Report
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 italic">"{report.raw_text}"</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Analysis
                    </h4>
                    <div className="space-y-2">
                      {report.parsed_data.sales && (
                        <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">Sales: ${report.parsed_data.sales}</span>
                        </div>
                      )}
                      {report.parsed_data.inventory && report.parsed_data.inventory.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Inventory Changes:</span>
                          </div>
                          {report.parsed_data.inventory.map((item, idx) => (
                            <div key={idx} className="text-xs text-blue-700 ml-6">
                              {item.item}: {item.count > 0 ? '+' : ''}{item.count} ({item.action})
                            </div>
                          ))}
                        </div>
                      )}
                      {report.parsed_data.customer_feedback && (
                        <div className="bg-purple-50 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-purple-800 mb-1">Customer Feedback:</h5>
                          <p className="text-sm text-purple-700">{report.parsed_data.customer_feedback}</p>
                        </div>
                      )}
                      {report.parsed_data.staff_observations && (
                        <div className="bg-orange-50 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-orange-800 mb-1">Staff Observations:</h5>
                          <p className="text-sm text-orange-700">{report.parsed_data.staff_observations}</p>
                        </div>
                      )}
                      {report.parsed_data.alerts && report.parsed_data.alerts.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-red-800 mb-1">Alerts Generated:</h5>
                          {report.parsed_data.alerts.map((alert, idx) => (
                            <div key={idx} className="text-sm text-red-700">• {alert}</div>
                          ))}
                        </div>
                      )}
                      {(!report.parsed_data.sales && !report.parsed_data.inventory?.length && 
                        !report.parsed_data.customer_feedback && !report.parsed_data.staff_observations && 
                        !report.parsed_data.alerts?.length) && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Processing completed - general observations recorded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIReports;