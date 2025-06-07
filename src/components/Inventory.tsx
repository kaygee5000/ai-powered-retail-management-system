import React, { useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download,
  Plus,
  ArrowUpDown,
  MapPin,
  Calendar,
  TrendingDown,
  TrendingUp,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  Sparkles,
  Wand2,
  Brain
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useLocations } from '../hooks/useLocations';
import { useCurrency } from '../hooks/useCurrency';
import { 
  calculateInventoryTrend, 
  calculateInventoryUnitsTrend, 
  calculateLowStockTrend, 
  calculateProductCountTrend, 
  formatTrend 
} from '../utils/trendCalculations';
import MetricCard from './analytics/MetricCard';
import { aiService, GeneratedProductData } from '../services/aiService';

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  location_id: string;
}

const ProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  onSave: (data: ProductFormData) => Promise<void>;
  locations: any[];
}> = ({ isOpen, onClose, product, onSave, locations }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    price: product?.price || 0,
    stock: product?.stock || 0,
    min_stock: product?.min_stock || 0,
    location_id: product?.location_id || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { symbol } = useCurrency();

  // AI Generation states
  const [aiDescriptionText, setAiDescriptionText] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiSection, setShowAiSection] = useState(!product); // Show AI section for new products

  const categories = ['Electronics', 'Beauty', 'Food & Beverage', 'Accessories', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Other'];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
    if (formData.min_stock < 0) newErrors.min_stock = 'Minimum stock cannot be negative';
    if (!formData.location_id) newErrors.location_id = 'Location is required';
    
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
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiDescriptionText.trim()) return;

    setAiGenerating(true);
    try {
      const result = await aiService.generateProductDetails(aiDescriptionText);
      
      if (result.success && result.data) {
        const generatedData = result.data;
        
        // Update form data with AI-generated values
        setFormData(prevData => ({
          name: generatedData.name || prevData.name,
          sku: generatedData.sku || prevData.sku,
          category: generatedData.category || prevData.category,
          price: generatedData.price || prevData.price,
          stock: generatedData.stock || prevData.stock,
          min_stock: generatedData.min_stock || prevData.min_stock,
          location_id: prevData.location_id // Keep existing location
        }));

        // Clear the AI description after successful generation
        setAiDescriptionText('');
      } else {
        console.error('AI generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error generating product details:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const getSamplePrompts = () => [
    "iPhone 15 Pro 128GB space black, premium smartphone, $999, 25 units in stock",
    "Organic coconut oil beauty cream for skincare, $34.99, natural ingredients",
    "Wireless Bluetooth headphones with noise cancellation, $129, electronics",
    "Artisan coffee beans Ethiopian single origin, $18.50 per bag, food item"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
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
                  <h3 className="font-medium text-purple-900">AI-Powered Product Generation</h3>
                  <p className="text-sm text-purple-700">Describe your product and let AI fill out the details</p>
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
                  Describe your product
                </label>
                <textarea
                  value={aiDescriptionText}
                  onChange={(e) => setAiDescriptionText(e.target.value)}
                  placeholder="e.g., 'iPhone 15 Pro 128GB space black, premium smartphone, $999, 25 units in stock' or 'Organic coffee beans from Ethiopia, fair trade, $18.50'"
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
                      <span className="text-sm">AI is analyzing your product...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Prompts */}
              <div>
                <p className="text-xs text-purple-600 mb-2">Try these examples:</p>
                <div className="grid grid-cols-1 gap-2">
                  {getSamplePrompts().map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setAiDescriptionText(prompt)}
                      className="text-xs bg-white text-purple-600 px-3 py-2 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors text-left"
                      disabled={aiGenerating || loading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!showAiSection && !product && (
          <button
            onClick={() => setShowAiSection(true)}
            className="w-full mb-6 p-3 border-2 border-dashed border-purple-200 rounded-lg text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Use AI to generate product details
          </button>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } ${aiGenerating ? 'bg-gray-50' : ''}`}
                placeholder="Wireless Earbuds"
                disabled={aiGenerating || loading}
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sku ? 'border-red-300' : 'border-gray-300'
                } ${aiGenerating ? 'bg-gray-50' : ''}`}
                placeholder="WE-001"
                disabled={aiGenerating || loading}
              />
              {errors.sku && <p className="text-red-600 text-xs mt-1">{errors.sku}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                } ${aiGenerating ? 'bg-gray-50' : ''}`}
                disabled={aiGenerating || loading}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ({symbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                } ${aiGenerating ? 'bg-gray-50' : ''}`}
                placeholder="29.99"
                disabled={aiGenerating || loading}
              />
              {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.stock ? 'border-red-300' : 'border-gray-300'
                } ${aiGenerating ? 'bg-gray-50' : ''}`}
                placeholder="100"
                disabled={aiGenerating || loading}
              />
              {errors.stock && <p className="text-red-600 text-xs mt-1">{errors.stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.min_stock ? 'border-red-300' : 'border-gray-300'
                } ${aiGenerating ? 'bg-gray-50' : ''}`}
                placeholder="20"
                disabled={aiGenerating || loading}
              />
              {errors.min_stock && <p className="text-red-600 text-xs mt-1">{errors.min_stock}</p>}
            </div>
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
              } ${aiGenerating ? 'bg-gray-50' : ''}`}
              disabled={aiGenerating || loading}
            >
              <option value="">Select location</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
            {errors.location_id && <p className="text-red-600 text-xs mt-1">{errors.location_id}</p>}
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
                  {product ? 'Update' : 'Create'}
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
  productName: string;
  onConfirm: () => Promise<void>;
}> = ({ isOpen, onClose, productName, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting product:', error);
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
          <h2 className="text-xl font-semibold text-gray-900">Delete Product</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>"{productName}"</strong>? 
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

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);

  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { locations, loading: locationsLoading } = useLocations();
  const { format } = useCurrency();

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const lowStockItems = products.filter(p => p.stock <= p.min_stock);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);

  // Calculate trends safely
  const inventoryTrend = calculateInventoryTrend(products, [], { periodDays: 7 });
  const unitsTrend = calculateInventoryUnitsTrend(products, [], { periodDays: 7 });
  const lowStockTrend = calculateLowStockTrend(products, [], { periodDays: 7 });
  const productCountTrend = calculateProductCountTrend(products, [], { periodDays: 7 });

  const getStockStatus = (product: any) => {
    if (product.stock <= product.min_stock) return 'low';
    if (product.stock <= product.min_stock * 1.5) return 'medium';
    return 'good';
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'good': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleSaveProduct = async (formData: ProductFormData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, formData);
      setEditingProduct(null);
    } else {
      await addProduct(formData);
    }
    setModalOpen(false);
  };

  const handleDeleteProduct = async () => {
    if (deletingProduct) {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const openDeleteModal = (product: any) => {
    setDeletingProduct(product);
    setDeleteModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  if (productsLoading || locationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage inventory across all locations</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Summary Cards with Live Trends */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={products.length.toString()}
          change={productCountTrend.change}
          icon={Package}
          color="bg-blue-500"
          trend={formatTrend(productCountTrend).icon}
          trendTooltip={formatTrend(productCountTrend).tooltip}
        />

        <MetricCard
          title="Low Stock Items"
          value={lowStockItems.length.toString()}
          change={lowStockTrend.change}
          icon={AlertTriangle}
          color="bg-red-500"
          trend={formatTrend(lowStockTrend).icon}
          trendTooltip={formatTrend(lowStockTrend).tooltip}
        />

        <MetricCard
          title="Total Units"
          value={totalUnits.toLocaleString()}
          change={unitsTrend.change}
          icon={Package}
          color="bg-green-500"
          trend={formatTrend(unitsTrend).icon}
          trendTooltip={formatTrend(unitsTrend).tooltip}
        />

        <MetricCard
          title="Total Value"
          value={format(totalValue)}
          change={inventoryTrend.change}
          icon={Package}
          color="bg-purple-500"
          trend={formatTrend(inventoryTrend).icon}
          trendTooltip={formatTrend(inventoryTrend).tooltip}
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock</option>
              <option value="price">Sort by Price</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowUpDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory !== 'All' ? 'Try adjusting your filters' : 'Get started by adding your first product'}
          </p>
          {!searchTerm && selectedCategory === 'All' && (
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Product</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">SKU</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Category</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Price</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Stock</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Location</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const location = locations.find(l => l.id === product.location_id);
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-500">ID: {product.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-mono text-sm">{product.sku}</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900">{format(product.price)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{product.stock}</span>
                          <span className="text-xs text-gray-500">/ {product.min_stock} min</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(stockStatus)}`}>
                          {stockStatus === 'low' ? 'Low Stock' : stockStatus === 'medium' ? 'Medium' : 'In Stock'}
                          {stockStatus === 'low' && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {location?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(product)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={handleSaveProduct}
        locations={locations}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingProduct(null);
        }}
        productName={deletingProduct?.name || ''}
        onConfirm={handleDeleteProduct}
      />
    </div>
  );
};

export default Inventory;