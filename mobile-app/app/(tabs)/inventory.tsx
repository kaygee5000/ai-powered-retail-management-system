import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  TrendingDown,
  MapPin,
  Hash,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { MetricCard } from '../../components/MetricCard';
import { useProducts, useLocations } from '../../hooks/useApi';

export default function InventoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: products, loading: productsLoading, refetch: refetchProducts } = useProducts();
  const { data: locations, loading: locationsLoading, refetch: refetchLocations } = useLocations();

  const loading = productsLoading || locationsLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProducts(), refetchLocations()]);
    setRefreshing(false);
  };

  // Filter products based on search query
  const filteredProducts = products?.filter((product: any) => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculate metrics
  const totalProducts = products?.length || 0;
  const lowStockItems = products?.filter((p: any) => p.stock <= p.min_stock) || [];
  const totalUnits = products?.reduce((sum: number, p: any) => sum + p.stock, 0) || 0;
  const totalValue = products?.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0) || 0;

  const getStockStatus = (product: any) => {
    if (product.stock <= product.min_stock) return 'low';
    if (product.stock <= product.min_stock * 1.5) return 'medium';
    return 'good';
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'low': return Colors.red500;
      case 'medium': return Colors.yellow500;
      case 'good': return Colors.green500;
      default: return Colors.gray500;
    }
  };

  const getLocationName = (locationId: string) => {
    const location = locations?.find((l: any) => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>Manage your product inventory</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Metrics */}
        <View style={styles.metricsRow}>
          <MetricCard
            title="Total Products"
            value={totalProducts.toString()}
            icon={Package}
            color={Colors.primary}
          />
          <MetricCard
            title="Low Stock"
            value={lowStockItems.length.toString()}
            icon={AlertTriangle}
            color={Colors.red500}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Total Units"
            value={totalUnits.toLocaleString()}
            icon={Package}
            color={Colors.green500}
          />
          <MetricCard
            title="Total Value"
            value={`$${totalValue.toFixed(0)}`}
            icon={Package}
            color={Colors.purple500}
          />
        </View>

        {/* Search */}
        <Card>
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.gray500} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Card>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={20} color={Colors.red500} />
              <Text style={styles.alertTitle}>Low Stock Alert</Text>
            </View>
            <Text style={styles.alertDescription}>
              {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low on stock
            </Text>
            <View style={styles.lowStockList}>
              {lowStockItems.slice(0, 3).map((item: any) => (
                <View key={item.id} style={styles.lowStockItem}>
                  <Text style={styles.lowStockName}>{item.name}</Text>
                  <Text style={styles.lowStockStock}>
                    {item.stock} / {item.min_stock} min
                  </Text>
                </View>
              ))}
              {lowStockItems.length > 3 && (
                <Text style={styles.lowStockMore}>
                  +{lowStockItems.length - 3} more items
                </Text>
              )}
            </View>
          </Card>
        )}

        {/* Products List */}
        <Card title="Products">
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title={searchQuery ? "No products found" : "No products yet"}
              description={searchQuery ? "Try adjusting your search" : "Add your first product to get started"}
            />
          ) : (
            <View style={styles.productsList}>
              {filteredProducts.map((product: any) => {
                const stockStatus = getStockStatus(product);
                const stockColor = getStockColor(stockStatus);

                return (
                  <View key={product.id} style={styles.productItem}>
                    <View style={styles.productHeader}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <View style={styles.productMeta}>
                          <Hash size={12} color={Colors.gray500} />
                          <Text style={styles.productSku}>{product.sku}</Text>
                          <Text style={styles.productCategory}> • {product.category}</Text>
                        </View>
                        <View style={styles.productLocation}>
                          <MapPin size={12} color={Colors.gray500} />
                          <Text style={styles.productLocationText}>
                            {getLocationName(product.location_id)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.productPrice}>
                        <Text style={styles.priceValue}>${product.price.toFixed(2)}</Text>
                      </View>
                    </View>

                    <View style={styles.productFooter}>
                      <View style={styles.stockInfo}>
                        <Text style={styles.stockLabel}>Stock:</Text>
                        <View style={[styles.stockBadge, { backgroundColor: stockColor + '20' }]}>
                          <Text style={[styles.stockText, { color: stockColor }]}>
                            {product.stock} units
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.minStock}>
                        Min: {product.min_stock}
                      </Text>
                    </View>

                    {stockStatus === 'low' && (
                      <View style={styles.lowStockWarning}>
                        <TrendingDown size={16} color={Colors.red500} />
                        <Text style={styles.lowStockWarningText}>
                          Stock is running low!
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  alertCard: {
    backgroundColor: Colors.red500 + '10',
    borderColor: Colors.red500 + '30',
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.red500,
    marginLeft: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  lowStockList: {
    gap: 8,
  },
  lowStockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  lowStockName: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  lowStockStock: {
    fontSize: 14,
    color: Colors.red500,
    fontWeight: '500',
  },
  lowStockMore: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: 8,
  },
  productsList: {
    gap: 16,
  },
  productItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  productCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  productLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productLocationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  productPrice: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.green500,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  minStock: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  lowStockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.red500 + '15',
    borderRadius: 6,
    gap: 6,
  },
  lowStockWarningText: {
    fontSize: 12,
    color: Colors.red500,
    fontWeight: '500',
  },
});