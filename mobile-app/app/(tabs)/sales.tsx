import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Calendar,
  User,
  CreditCard,
  MapPin,
  Plus,
  Clock,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { MetricCard } from '../../components/MetricCard';
import { useSales, useLocations } from '../../hooks/useApi';

export default function SalesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const { data: sales, loading: salesLoading, refetch: refetchSales } = useSales();
  const { data: locations, loading: locationsLoading, refetch: refetchLocations } = useLocations();

  const loading = salesLoading || locationsLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSales(), refetchLocations()]);
    setRefreshing(false);
  };

  // Filter sales based on time filter
  const filteredSales = sales?.filter((sale: any) => {
    if (timeFilter === 'all') return true;
    
    const saleDate = new Date(sale.timestamp);
    const now = new Date();
    
    if (timeFilter === 'today') {
      return saleDate.toDateString() === now.toDateString();
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return saleDate >= weekAgo;
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return saleDate >= monthAgo;
    }
    
    return true;
  }) || [];

  // Calculate metrics
  const totalSales = filteredSales.reduce((sum: number, sale: any) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const totalItems = filteredSales.reduce((sum: number, sale: any) => sum + sale.items, 0);
  const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const getLocationName = (locationId: string) => {
    const location = locations?.find((l: any) => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return DollarSign;
      case 'credit card':
      case 'debit card':
        return CreditCard;
      default:
        return CreditCard;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sales</Text>
          <Text style={styles.subtitle}>Track your sales performance</Text>
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
        {/* Time Filter */}
        <Card>
          <View style={styles.filterContainer}>
            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  timeFilter === filter.key && styles.filterButtonActive,
                ]}
                onPress={() => setTimeFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    timeFilter === filter.key && styles.filterButtonTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <MetricCard
            title="Total Sales"
            value={`$${totalSales.toFixed(2)}`}
            icon={DollarSign}
            color={Colors.green500}
          />
          <MetricCard
            title="Transactions"
            value={totalTransactions.toString()}
            icon={ShoppingCart}
            color={Colors.primary}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Items Sold"
            value={totalItems.toString()}
            icon={ShoppingCart}
            color={Colors.purple500}
          />
          <MetricCard
            title="Avg Order Value"
            value={`$${averageOrderValue.toFixed(2)}`}
            icon={TrendingUp}
            color={Colors.yellow500}
          />
        </View>

        {/* Sales List */}
        <Card title={`Sales (${filteredSales.length})`}>
          {filteredSales.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title={timeFilter === 'all' ? "No sales yet" : "No sales found"}
              description={timeFilter === 'all' 
                ? "Record your first sale to get started" 
                : "Try adjusting your time filter"
              }
            />
          ) : (
            <View style={styles.salesList}>
              {filteredSales.map((sale: any) => {
                const PaymentIcon = getPaymentMethodIcon(sale.payment_method);

                return (
                  <View key={sale.id} style={styles.saleItem}>
                    <View style={styles.saleHeader}>
                      <View style={styles.saleInfo}>
                        <Text style={styles.saleAmount}>${sale.total.toFixed(2)}</Text>
                        <View style={styles.saleDetails}>
                          <ShoppingCart size={12} color={Colors.gray500} />
                          <Text style={styles.saleItemsText}>
                            {sale.items} item{sale.items > 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.saleMeta}>
                        <Text style={styles.saleDate}>{formatDate(sale.timestamp)}</Text>
                        <Text style={styles.saleTime}>{formatTime(sale.timestamp)}</Text>
                      </View>
                    </View>

                    <View style={styles.saleMiddle}>
                      <View style={styles.saleLocationRow}>
                        <MapPin size={14} color={Colors.gray500} />
                        <Text style={styles.saleLocation}>
                          {getLocationName(sale.location_id)}
                        </Text>
                      </View>
                      <View style={styles.saleStaffRow}>
                        <User size={14} color={Colors.gray500} />
                        <Text style={styles.saleStaff}>{sale.staff}</Text>
                      </View>
                    </View>

                    <View style={styles.saleFooter}>
                      <View style={styles.paymentMethod}>
                        <PaymentIcon size={14} color={Colors.gray500} />
                        <Text style={styles.paymentMethodText}>{sale.payment_method}</Text>
                      </View>
                      <Text style={styles.saleId}>#{sale.id.slice(0, 8)}</Text>
                    </View>
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
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  salesList: {
    gap: 16,
  },
  saleItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.green500,
    marginBottom: 4,
  },
  saleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saleItemsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  saleMeta: {
    alignItems: 'flex-end',
  },
  saleDate: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  saleTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  saleMiddle: {
    gap: 8,
    marginBottom: 12,
  },
  saleLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saleLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  saleStaffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saleStaff: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  saleId: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: 'monospace',
  },
});