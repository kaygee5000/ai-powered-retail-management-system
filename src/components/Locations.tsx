import React, { useState } from 'react';
import { 
  MapPin, 
  Users, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  Sparkles,
  Brain,
  Wand2
} from 'lucide-react';
import { useLocations } from '../hooks/useLocations';
import { useSales } from '../hooks/useSales';
import { useAlerts } from '../hooks/useAlerts';
import { useCurrency } from '../hooks/useCurrency';
import { aiService } from '../services/aiService'; // Removed GeneratedLocationData
import { 
  calculateLocationSalesTrend, 
  calculateLocationAlertsTrend, 
  formatTrend 
} from '../utils/trendCalculations';
import MetricCard from './analytics/MetricCard';

interface LocationFormData {
  name: string;
  address: string;
  manager: string;
  status: 'active' | 'inactive' | 'attention';
}

// Location type is already imported from '../hooks/useLocations' at the top of the file

const LocationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  location?: Location | null;
  onSave: (data: LocationFormData) => Promise<void>;
}> = ({ isOpen, onClose, location, onSave }) => {
  const [formData, setFormData] = useState<LocationFormData>({
    name: location?.name || '',
    address: location?.address || '',
    manager: location?.manager || '',
    status: location?.status || 'active'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI Generation states
  const [aiDescriptionText, setAiDescriptionText] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiSection, setShowAiSection] = useState(true);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Location name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.manager.trim()) newErrors.manager = 'Manager name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiDescriptionText.trim()) return;

    setAiGenerating(true);
    try {
      const result = await aiService.generateLocationDetails(aiDescriptionText);
      
      if (result.success && result.data) {
        const generatedData = result.data;
        
        // Update form data with AI-generated values
        setFormData(prevData => ({
          name: generatedData.name || prevData.name,
          address: generatedData.address || prevData.address,
          manager: generatedData.manager || prevData.manager,
          status: generatedData.status || prevData.status
        }));

        // Clear the AI description after successful generation
        setAiDescriptionText('');
      } else {
        console.error('AI generation failed:', result.error);
        // Could show an error message to user here
      }
    } catch (error) {
      console.error('Error generating location details:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const getSamplePrompts = () => [
    "Downtown electronics store managed by Sarah Johnson at 123 Main Street",
    "New mall location in Westfield Shopping Center, needs manager assignment",
    "Flagship store at Accra Central, busy location with high foot traffic",
    "Small outlet in Kumasi, managed by local staff, experiencing some challenges"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {location ? 'Edit Location' : 'Add New Location'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Generation Section */}
        {showAiSection && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-900">AI-Powered Generation</h3>
                  <p className="text-sm text-purple-700">Describe your location and let AI fill out the details</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiSection(false)}
                className="text-purple-400 hover:text-purple-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Describe your location
                </label>
                <textarea
                  value={aiDescriptionText}
                  onChange={(e) => setAiDescriptionText(e.target.value)}
                  placeholder="e.g., 'Downtown electronics store managed by Sarah Johnson at 123 Main Street, Accra' or 'New mall location that needs a manager'"
                  className="w-full h-24 px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  disabled={aiGenerating || loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateAI}
                    disabled={!aiDescriptionText.trim() || aiGenerating || loading}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate with AI
                      </>
                    )}
                  </button>
                  
                  {aiGenerating && (
                    <div className="flex items-center gap-2 text-purple-600">
                      <Brain className="w-4 h-4" />
                      <span className="text-sm">AI is analyzing your description...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Prompts */}
              <div>
                <p className="text-xs text-purple-600 mb-2">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {getSamplePrompts().map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setAiDescriptionText(prompt)}
                      className="text-xs bg-white text-purple-600 px-3 py-1 rounded-full border border-purple-200 hover:bg-purple-50 transition-colors"
                      disabled={aiGenerating || loading}
                    >
                      {prompt.length > 50 ? `${prompt.slice(0, 50)}...` : prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!showAiSection && (
          <button
            onClick={() => setShowAiSection(true)}
            className="w-full mb-6 p-3 border-2 border-dashed border-purple-200 rounded-lg text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Use AI to generate location details
          </button>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } ${aiGenerating ? 'bg-gray-50' : ''}`}
              placeholder="Downtown Store"
              disabled={aiGenerating || loading}
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              } ${aiGenerating ? 'bg-gray-50' : ''}`}
              placeholder="123 Main St, City"
              disabled={aiGenerating || loading}
            />
            {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manager
            </label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.manager ? 'border-red-300' : 'border-gray-300'
              } ${aiGenerating ? 'bg-gray-50' : ''}`}
              placeholder="John Doe"
              disabled={aiGenerating || loading}
            />
            {errors.manager && <p className="text-red-600 text-xs mt-1">{errors.manager}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Location['status'] })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                aiGenerating ? 'bg-gray-50' : ''
              }`}
              disabled={aiGenerating || loading}
            >
              <option value="active">Active</option>
              <option value="attention">Needs Attention</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading || aiGenerating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || aiGenerating}
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
                  {location ? 'Update' : 'Create'}
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
  locationName: string;
  onConfirm: () => Promise<void>;
}> = ({ isOpen, onClose, locationName, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting location:', error);
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
          <h2 className="text-xl font-semibold text-gray-900">Delete Location</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>"{locationName}"</strong>? 
          This action cannot be undone and will also delete all associated products, sales, and reports.
        </p>

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

// Define a more specific type for trend objects if possible, for now using any
interface FormattedTrend {
  value: string;
  icon: 'up' | 'down' | 'stable';
  color: string;
  tooltip: string;
}

const LocationCard: React.FC<{ 
  location: Location;
  salesTrend: FormattedTrend | null;
  alertsTrend: FormattedTrend | null;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ location, salesTrend, alertsTrend, onEdit, onDelete }) => {
  const { format } = useCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'attention': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'attention': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{location.name}</h3>
            <p className="text-sm text-gray-500">{location.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(location.status)}`}>
            {getStatusIcon(location.status)}
            {location.status}
          </span>
          <div className="relative group">
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Sales</span>
            </div>
            {salesTrend && (
              <div className="group relative">
                <div className={`flex items-center gap-1 text-xs ${salesTrend.color} cursor-pointer`}>
                  {salesTrend.icon === 'up' && <TrendingUp className="w-3 h-3" />}
                  {salesTrend.icon === 'down' && <TrendingDown className="w-3 h-3" />}
                  {salesTrend.value}
                </div>
                <div className="absolute right-0 bottom-full mb-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  <div className="font-medium mb-1">Sales Trend:</div>
                  <div className="text-gray-300">{salesTrend.tooltip}</div>
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
          <p className="text-lg font-semibold text-gray-900">{format(location.sales || 0)}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-gray-600">Alerts</span>
            </div>
            {alertsTrend && (
              <div className="group relative">
                <div className={`flex items-center gap-1 text-xs ${alertsTrend.color} cursor-pointer`}>
                  {alertsTrend.icon === 'up' && <TrendingUp className="w-3 h-3" />}
                  {alertsTrend.icon === 'down' && <TrendingDown className="w-3 h-3" />}
                  {alertsTrend.value}
                </div>
                <div className="absolute right-0 bottom-full mb-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  <div className="font-medium mb-1">Alerts Trend:</div>
                  <div className="text-gray-300">{alertsTrend.tooltip}</div>
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
          <p className="text-lg font-semibold text-gray-900">{location.alerts || 0}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Manager: {location.manager}</span>
        </div>
        <span className="text-gray-500">Updated {location.last_report}</span>
      </div>
    </div>
  );
};

const Locations: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

  const { locations, loading, addLocation, updateLocation, deleteLocation } = useLocations();
  const { sales } = useSales();
  const { alerts } = useAlerts();
  const { format } = useCurrency();

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || location.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleSaveLocation = async (formData: LocationFormData) => {
    if (editingLocation) {
      await updateLocation(editingLocation.id, formData);
      setEditingLocation(null);
    } else {
      await addLocation(formData);
    }
    setModalOpen(false);
  };

  const handleDeleteLocation = async () => {
    if (deletingLocation) {
      await deleteLocation(deletingLocation.id);
      setDeletingLocation(null);
    }
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    setModalOpen(true);
  };

  const openDeleteModal = (location: Location) => {
    setDeletingLocation(location);
    setDeleteModalOpen(true);
  };

  const openAddModal = () => {
    setEditingLocation(null);
    setModalOpen(true);
  };

  // Calculate trends for each location
  const getLocationTrends = (location: Location) => {
    const salesTrend = calculateLocationSalesTrend(sales, location.id, { periodDays: 7 });
    const alertsTrend = calculateLocationAlertsTrend(alerts, location.id, { periodDays: 7 });
    
    return {
      salesTrend: formatTrend(salesTrend),
      alertsTrend: formatTrend(alertsTrend)
    };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600">Manage and monitor all your store locations</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Summary Cards with Trends */}
      {locations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Active Locations"
            value={locations.filter(l => l.status === 'active').length.toString()}
            change={0} // Would calculate from historical data
            icon={CheckCircle}
            color="bg-green-500"
            trend="stable"
            trendTooltip="Active locations count vs previous period"
          />
          <MetricCard
            title="Need Attention"
            value={locations.filter(l => l.status === 'attention').length.toString()}
            change={0}
            icon={AlertTriangle}
            color="bg-yellow-500"
            trend="stable"
            trendTooltip="Locations requiring attention vs previous period"
          />
          <MetricCard
            title="Total Daily Sales"
            value={format(locations.reduce((sum, l) => sum + (l.sales || 0), 0))}
            change={8.5}
            icon={DollarSign}
            color="bg-blue-500"
            trend="up"
            trendTooltip="Combined sales from all locations vs previous period"
          />
          <MetricCard
            title="Total Inventory Value"
            value={format(locations.reduce((sum, l) => sum + (l.inventory || 0), 0))}
            change={-2.1}
            icon={Package}
            color="bg-purple-500"
            trend="down"
            trendTooltip="Combined inventory value across all locations"
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Attention</option>
            <option>Inactive</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className="w-4 h-4 space-y-1">
              <div className="h-0.5 bg-current rounded"></div>
              <div className="h-0.5 bg-current rounded"></div>
              <div className="h-0.5 bg-current rounded"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Location Grid */}
      {filteredLocations.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'All' ? 'Try adjusting your filters' : 'Get started by adding your first location'}
          </p>
          {!searchTerm && statusFilter === 'All' && (
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add Your First Location
            </button>
          )}
        </div>
      ) : (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {filteredLocations.map((location) => {
            const trends = getLocationTrends(location);
            return (
              <LocationCard 
                key={location.id} 
                location={location}
                salesTrend={trends.salesTrend}
                alertsTrend={trends.alertsTrend}
                onEdit={() => openEditModal(location)}
                onDelete={() => openDeleteModal(location)}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      <LocationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLocation(null);
        }}
        location={editingLocation}
        onSave={handleSaveLocation}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingLocation(null);
        }}
        locationName={deletingLocation?.name || ''}
        onConfirm={handleDeleteLocation}
      />
    </div>
  );
};

export default Locations;