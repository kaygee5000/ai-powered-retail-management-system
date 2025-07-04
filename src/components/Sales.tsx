import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  User,
  MapPin,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  TrendingUp,
  Clock,
  Receipt
} from 'lucide-react';
import { useSales, Sale } from '../hooks/useSales';
import { useLocations, Location } from '../hooks/useLocations';
import { useCurrency } from '../hooks/useCurrency';
import { 
  calculateSalesTrend, 
  calculateOrdersTrend, 
  calculateItemsSoldTrend, 
  calculateAOVTrend, 
  formatTrend 
} from '../utils/trendCalculations';
import MetricCard from './analytics/MetricCard';

interface SaleFormData {
  timestamp: string;
  location_id: string;
  total: number;
  items: number;
  staff: string;
  payment_method: string;
}

const SaleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale | null;
  onSave: (data: SaleFormData) => Promise<void>;
  locations: Location[];
}> = ({ isOpen, onClose, sale, onSave, locations }) => {
  const [formData, setFormData] = useState<SaleFormData>({
    timestamp: sale?.timestamp ? new Date(sale.timestamp).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    location_id: sale?.location_id || '',
    total: sale?.total || 0,
    items: sale?.items || 1,
    staff: sale?.staff || '',
    payment_method: sale?.payment_method || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { symbol } = useCurrency();

  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Digital Wallet', 'Bank Transfer', 'Gift Card'];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.timestamp) newErrors.timestamp = 'Timestamp is required';
    if (!formData.location_id) newErrors.location_id = 'Location is required';
    if (formData.total <= 0) newErrors.total = 'Total must be greater than 0';
    if (formData.items <= 0) newErrors.items = 'Items must be greater than 0';
    if (!formData.staff.trim()) newErrors.staff = 'Staff name is required';
    if (!formData.payment_method) newErrors.payment_method = 'Payment method is required';
    
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
      console.error('Error saving sale:', error);
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
            {sale ? 'Edit Sale' : 'Record New Sale'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount ({symbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.total ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="99.99"
              />
              {errors.total && <p className="text-red-600 text-xs mt-1">{errors.total}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Items
              </label>
              <input
                type="number"
                min="1"
                value={formData.items}
                onChange={(e) => setFormData({ ...formData, items: parseInt(e.target.value) || 1 })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.items ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1"
              />
              {errors.items && <p className="text-red-600 text-xs mt-1">{errors.items}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff Member
            </label>
            <input
              type="text"
              value={formData.staff}
              onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.staff ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="John Doe"
            />
            {errors.staff && <p className="text-red-600 text-xs mt-1">{errors.staff}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.payment_method ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select payment method</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            {errors.payment_method && <p className="text-red-600 text-xs mt-1">{errors.payment_method}</p>}
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
                  {sale ? 'Update' : 'Record'}
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
  saleTotal: number;
  onConfirm: () => Promise<void>;
}> = ({ isOpen, onClose, saleTotal, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const { format } = useCurrency();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting sale:', error);
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
            <Receipt className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Delete Sale</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this sale record for <strong>{format(saleTotal)}</strong>? 
          This action cannot be undone.
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

const Sales: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const { sales, loading: salesLoading, addSale, updateSale, deleteSale } = useSales();
  const { locations, loading: locationsLoading } = useLocations();
  const { format } = useCurrency();

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.staff.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.location?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.payment_method.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      return matchesSearch && new Date(sale.timestamp).toDateString() === today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return matchesSearch && new Date(sale.timestamp) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return matchesSearch && new Date(sale.timestamp) >= monthAgo;
    }
    
    return matchesSearch;
  });

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = filteredSales.reduce((sum, sale) => sum + sale.items, 0);
  const averageValue = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

  // Calculate trends with 7-day periods
  const salesTrend = calculateSalesTrend(sales, { periodDays: 7 });
  const ordersTrend = calculateOrdersTrend(sales, { periodDays: 7 });
  const itemsTrend = calculateItemsSoldTrend(sales, { periodDays: 7 });
  const aovTrend = calculateAOVTrend(sales, { periodDays: 7 });

  const handleSaveSale = async (formData: SaleFormData) => {
    if (editingSale) {
      await updateSale(editingSale.id, formData);
      setEditingSale(null);
    } else {
      await addSale(formData);
    }
    setModalOpen(false);
  };

  const handleDeleteSale = async () => {
    if (deletingSale) {
      await deleteSale(deletingSale.id);
      setDeletingSale(null);
    }
  };

  const openEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setModalOpen(true);
  };

  const openDeleteModal = (sale: Sale) => {
    setDeletingSale(sale);
    setDeleteModalOpen(true);
  };

  const openAddModal = () => {
    setEditingSale(null);
    setModalOpen(true);
  };

  if (salesLoading || locationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600">Track and manage sales transactions</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Sale
        </button>
      </div>

      {/* Summary Cards with Live Trends */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sales"
          value={format(totalSales)}
          change={salesTrend.change}
          icon={DollarSign}
          color="bg-green-500"
          trend={formatTrend(salesTrend).icon}
          trendTooltip={formatTrend(salesTrend).tooltip}
        />

        <MetricCard
          title="Total Transactions"
          value={filteredSales.length.toString()}
          change={ordersTrend.change}
          icon={ShoppingCart}
          color="bg-blue-500"
          trend={formatTrend(ordersTrend).icon}
          trendTooltip={formatTrend(ordersTrend).tooltip}
        />

        <MetricCard
          title="Items Sold"
          value={totalItems.toString()}
          change={itemsTrend.change}
          icon={Receipt}
          color="bg-purple-500"
          trend={formatTrend(itemsTrend).icon}
          trendTooltip={formatTrend(itemsTrend).tooltip}
        />

        <MetricCard
          title="Average Order Value"
          value={format(averageValue)}
          change={aovTrend.change}
          icon={TrendingUp}
          color="bg-orange-500"
          trend={formatTrend(aovTrend).icon}
          trendTooltip={formatTrend(aovTrend).tooltip}
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || dateFilter !== 'all' ? 'Try adjusting your filters' : 'Record your first sale to get started'}
          </p>
          {!searchTerm && dateFilter === 'all' && (
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Record Your First Sale
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Date & Time</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Location</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Total</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Items</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Staff</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Payment</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(sale.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(sale.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{sale.location?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-lg font-semibold text-green-600">{format(sale.total)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-900">{sale.items}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{sale.staff}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{sale.payment_method}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEditModal(sale)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(sale)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <SaleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSale(null);
        }}
        sale={editingSale}
        onSave={handleSaveSale}
        locations={locations}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingSale(null);
        }}
        saleTotal={deletingSale?.total || 0}
        onConfirm={handleDeleteSale}
      />
    </div>
  );
};

export default Sales;