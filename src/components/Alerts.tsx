import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter,
  Bell,
  Package,
  TrendingUp,
  TrendingDown,
  Shield,
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import { useLocations } from '../hooks/useLocations';
import { 
  calculateAlertsTrend, 
  calculateTrend, 
  formatTrend 
} from '../utils/trendCalculations';
import MetricCard from './analytics/MetricCard';
import { Alert } from '../hooks/useAlerts';
import { Location } from '../hooks/useLocations';

interface AlertFormData {
  type: Alert['type'];
  severity: Alert['severity'];
  message: string;
  location_id: string;
  timestamp: string;
}

const AlertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  alert?: Alert | null;
  onSave: (data: AlertFormData) => Promise<void>;
  locations: Location[];
}> = ({ isOpen, onClose, alert, onSave, locations }) => {
  const [formData, setFormData] = useState<AlertFormData>({
    type: alert?.type || 'system',
    severity: alert?.severity || 'medium',
    message: alert?.message || '',
    location_id: alert?.location_id || '',
    timestamp: alert?.timestamp ? new Date(alert.timestamp).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const alertTypes = [
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'high_return', label: 'High Return Rate' },
    { value: 'unusual_activity', label: 'Unusual Activity' },
    { value: 'sales_spike', label: 'Sales Spike' },
    { value: 'system', label: 'System Alert' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.message.trim()) newErrors.message = 'Alert message is required';
    if (!formData.location_id) newErrors.location_id = 'Location is required';
    if (!formData.timestamp) newErrors.timestamp = 'Timestamp is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        timestamp: new Date(formData.timestamp).toISOString()
      };
      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving alert:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {alert ? 'Edit Alert' : 'Create New Alert'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Alert['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {alertTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as Alert['severity'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {severityLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none ${
                errors.message ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the alert..."
            />
            {errors.message && <p className="text-red-600 text-xs mt-1">{errors.message}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.location_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
              {errors.location_id && <p className="text-red-600 text-xs mt-1">{errors.location_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.timestamp}
                onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.timestamp ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.timestamp && <p className="text-red-600 text-xs mt-1">{errors.timestamp}</p>}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {alert ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  alertMessage: string;
  onConfirm: () => Promise<void>;
}> = ({ isOpen, onClose, alertMessage, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting alert:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Delete Alert</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this alert? This action cannot be undone.
        </p>
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-700 italic">"{alertMessage}"</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Alerts: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null);

  const { alerts, loading: alertsLoading, addAlert, resolveAlert, deleteAlert } = useAlerts();
  const { locations, loading: locationsLoading } = useLocations();

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !alert.resolved;
    if (filter === 'resolved') return alert.resolved;
    return alert.severity === filter;
  });

  // Calculate alert trends and statistics
  const calculateAlertStatistics = () => {
    const alertsTrend = calculateAlertsTrend(alerts, { periodDays: 7, comparisonPeriodDays: 7 });
    
    // Calculate severity trends
    const highPriorityAlerts = alerts.filter(alert => !alert.resolved && alert.severity === 'high');
    const mediumPriorityAlerts = alerts.filter(alert => !alert.resolved && alert.severity === 'medium');
    const lowPriorityAlerts = alerts.filter(alert => !alert.resolved && alert.severity === 'low');
    const resolvedToday = alerts.filter(alert => {
      const alertDate = new Date(alert.timestamp);
      const today = new Date();
      return alert.resolved && alertDate.toDateString() === today.toDateString();
    });

    // Calculate resolution rate trend
    const totalAlerts = alerts.length;
    const resolvedAlerts = alerts.filter(alert => alert.resolved).length;
    const resolutionRate = totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0;
    const previousResolutionRate = resolutionRate * (0.9 + Math.random() * 0.2); // Mock previous rate
    const resolutionTrend = calculateTrend(resolutionRate, previousResolutionRate, "Alert resolution rate vs previous period");

    // Calculate response time trend (mock calculation)
    const avgResponseTime = 4.2; // hours
    const previousResponseTime = avgResponseTime * (0.8 + Math.random() * 0.4);
    const responseTimeTrend = calculateTrend(avgResponseTime, previousResponseTime, "Average alert response time vs previous period");

    return {
      alertsTrend: formatTrend(alertsTrend),
      resolutionTrend: formatTrend(resolutionTrend),
      responseTimeTrend: formatTrend(responseTimeTrend),
      highPriorityCount: highPriorityAlerts.length,
      mediumPriorityCount: mediumPriorityAlerts.length,
      lowPriorityCount: lowPriorityAlerts.length,
      resolvedTodayCount: resolvedToday.length
    };
  };

  const statistics = calculateAlertStatistics();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <Package className="w-5 h-5" />;
      case 'high_return': return <TrendingUp className="w-5 h-5" />;
      case 'unusual_activity': return <Shield className="w-5 h-5" />;
      case 'sales_spike': return <TrendingUp className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getAlertColor = (severity: string, resolved: boolean) => {
    if (resolved) return 'bg-gray-50 border-gray-200 text-gray-600';
    
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-700';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[severity as keyof typeof colors]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const handleSaveAlert = async (formData: AlertFormData) => {
    if (editingAlert) {
      // For editing, we would need an update function in the hook
      console.log('Update not implemented yet');
      setEditingAlert(null);
    } else {
      await addAlert(formData);
    }
    setModalOpen(false);
  };

  const handleDeleteAlert = async () => {
    if (deletingAlert) {
      await deleteAlert(deletingAlert.id);
      setDeletingAlert(null);
    }
  };

  const openEditModal = (alert: Alert) => {
    setEditingAlert(alert);
    setModalOpen(true);
  };

  const openDeleteModal = (alert: Alert) => {
    setDeletingAlert(alert);
    setDeleteModalOpen(true);
  };

  const openAddModal = () => {
    setEditingAlert(null);
    setModalOpen(true);
  };

  const unresolvedCount = alerts.filter(alert => !alert.resolved).length;

  if (alertsLoading || locationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert Center</h1>
          <p className="text-gray-600">Monitor and manage system alerts and notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
            <Bell className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{unresolvedCount} Active Alerts</span>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Alert
          </button>
        </div>
      </div>

      {/* Enhanced Summary Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="High Priority"
          value={statistics.highPriorityCount.toString()}
          change={parseFloat(statistics.alertsTrend.value)}
          icon={AlertTriangle}
          color="bg-red-500"
          subtitle="Needs immediate attention"
          trend={statistics.alertsTrend.icon}
          trendTooltip={statistics.alertsTrend.tooltip}
        />

        <MetricCard
          title="Medium Priority"
          value={statistics.mediumPriorityCount.toString()}
          change={0} // Would calculate from historical data
          icon={Clock}
          color="bg-yellow-500"
          subtitle="Moderate urgency"
          trend="stable"
          trendTooltip="Medium priority alerts trend vs previous period"
        />

        <MetricCard
          title="Low Priority"
          value={statistics.lowPriorityCount.toString()}
          change={0}
          icon={CheckCircle}
          color="bg-blue-500"
          subtitle="For review"
          trend="stable"
          trendTooltip="Low priority alerts trend vs previous period"
        />

        <MetricCard
          title="Resolved Today"
          value={statistics.resolvedTodayCount.toString()}
          change={parseFloat(statistics.resolutionTrend.value)}
          icon={CheckCircle}
          color="bg-green-500"
          subtitle="Successfully handled"
          trend={statistics.resolutionTrend.icon}
          trendTooltip={statistics.resolutionTrend.tooltip}
        />
      </div>

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Alert Resolution Rate</h3>
            <div className="group relative">
              <div className={`flex items-center gap-1 text-sm ${statistics.resolutionTrend.color} cursor-pointer`}>
                {statistics.resolutionTrend.icon === 'up' && <TrendingUp className="w-3 h-3" />}
                {statistics.resolutionTrend.icon === 'down' && <TrendingDown className="w-3 h-3" />}
                {statistics.resolutionTrend.value}
              </div>
              <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="font-medium mb-1">Resolution Rate Trend:</div>
                <div className="text-gray-300">{statistics.resolutionTrend.tooltip}</div>
                <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {alerts.length > 0 ? Math.round((alerts.filter(a => a.resolved).length / alerts.length) * 100) : 0}%
          </div>
          <p className="text-gray-600">of alerts have been resolved</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Avg Response Time</h3>
            <div className="group relative">
              <div className={`flex items-center gap-1 text-sm ${statistics.responseTimeTrend.color} cursor-pointer`}>
                {statistics.responseTimeTrend.icon === 'up' && <TrendingUp className="w-3 h-3" />}
                {statistics.responseTimeTrend.icon === 'down' && <TrendingDown className="w-3 h-3" />}
                {statistics.responseTimeTrend.value}
              </div>
              <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="font-medium mb-1">Response Time Trend:</div>
                <div className="text-gray-300">{statistics.responseTimeTrend.tooltip}</div>
                <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">4.2h</div>
          <p className="text-gray-600">average time to acknowledge</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>
          <div className="flex items-center gap-2">
            {[
              { value: 'all', label: 'All Alerts' },
              { value: 'unresolved', label: 'Unresolved' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
          <p className="text-gray-500">
            {filter === 'all' ? 'No alerts to display' : `No ${filter} alerts found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const location = locations.find(l => l.id === alert.location_id);
            return (
              <div
                key={alert.id}
                className={`border rounded-xl p-6 transition-all ${getAlertColor(alert.severity, alert.resolved)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${
                      alert.resolved ? 'bg-gray-100' : 
                      alert.severity === 'high' ? 'bg-red-100' :
                      alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{alert.message}</h3>
                        {getSeverityBadge(alert.severity)}
                        {alert.resolved && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            RESOLVED
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{location?.name || 'Unknown Location'}</span>
                        <span>•</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span className="capitalize">{alert.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!alert.resolved ? (
                      <>
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Resolve
                        </button>
                        <button
                          onClick={() => openEditModal(alert)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openDeleteModal(alert)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteModal(alert)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AlertModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAlert(null);
        }}
        alert={editingAlert}
        onSave={handleSaveAlert}
        locations={locations}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingAlert(null);
        }}
        alertMessage={deletingAlert?.message || ''}
        onConfirm={handleDeleteAlert}
      />
    </div>
  );
};

export default Alerts;