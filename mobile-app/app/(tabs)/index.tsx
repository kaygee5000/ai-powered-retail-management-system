import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  DollarSign,
  Store,
  AlertTriangle,
  Package,
  TrendingUp,
  Calendar,
  LogOut,
  Brain,
  BarChart3,
} from 'lucide-react-native';
import { useAuth } from '../../providers/AuthProvider';
import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';
import { MetricCard } from '../../components/MetricCard';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { useProducts, useLocations, useSales, useAlerts, useAnalytics } from '../../hooks/useApi';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: products, loading: productsLoading, refetch: refetchProducts } = useProducts();
  const { data: locations, loading: locationsLoading, refetch: refetchLocations } = useLocations();
  const { data: sales, loading: salesLoading, refetch: refetchSales } = useSales();
  const { data: alerts, loading: alertsLoading, refetch: refetchAlerts } = useAlerts();
  const { data: analytics, loading: analyticsLoading, refetch: refetchAnalytics } = useAnalytics();

  const loading = productsLoading || locationsLoading || salesLoading || alertsLoading || analyticsLoading;

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProducts(),
      refetchLocations(),
      refetchSales(),
      refetchAlerts(),
      refetchAnalytics(),
    ]);
    setRefreshing(false);
  };

  // Calculate metrics from the data
  const totalSales = sales?.reduce((sum: number, sale: any) => sum + sale.total, 0) || 0;
  const totalLocations = locations?.filter((l: any) => l.status === 'active').length || 0;
  const activeAlerts = alerts?.filter((a: any) => !a.resolved).length || 0;
  const inventoryValue = products?.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0) || 0;
  const lowStockItems = products?.filter((p: any) => p.stock <= p.min_stock) || [];

  // Recent sales (last 5)
  const recentSales = sales?.slice(0, 5) || [];

  // Recent alerts (last 5 unresolved)
  const recentAlerts = alerts?.filter((a: any) => !a.resolved).slice(0, 5) || [];

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          {user && <Text style={styles.userEmail}>{user.email}</Text>}
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Metrics Cards */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.metricsRow}>
        <MetricCard
          title="Total Sales"
          value={`$${totalSales.toFixed(2)}`}
          change={8.5}
          icon={DollarSign}
          color={Colors.green500}
        />
        <MetricCard
          title="Active Locations"
          value={totalLocations.toString()}
          change={0}
          icon={Store}
          color={Colors.primary}
        />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard
          title="Active Alerts"
          value={activeAlerts.toString()}
          change={-12.3}
          icon={AlertTriangle}
          color={Colors.red500}
        />
        <MetricCard
          title="Inventory Value"
          value={`$${inventoryValue.toFixed(0)}`}
          change={3.2}
          icon={Package}
          color={Colors.purple500}
        />
      </View>

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
          <View style={styles.lowStockItems}>
            {lowStockItems.slice(0, 3).map((item: any) => (
              <Text key={item.id} style={styles.lowStockItem}>
                • {item.name} ({item.stock} left)
              </Text>
            ))}
            {lowStockItems.length > 3 && (
              <Text style={styles.lowStockMore}>
                +{lowStockItems.length - 3} more items
              </Text>
            )}
          </View>
        </Card>
      )}

      {/* Recent Sales */}
      <Card title="Recent Sales">
        {recentSales.length > 0 ? (
          recentSales.map((sale: any) => (
            <View key={sale.id} style={styles.saleItem}>
              <View style={styles.saleInfo}>
                <Text style={styles.saleAmount}>${sale.total.toFixed(2)}</Text>
                <Text style={styles.saleDetails}>
                  {sale.items} items • {sale.staff}
                </Text>
                <Text style={styles.saleDate}>
                  {new Date(sale.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.saleLocation}>
                <Store size={16} color={Colors.gray500} />
                <Text style={styles.saleLocationText}>
                  {sale.location?.name || 'Unknown'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No sales data"
            description="Sales will appear here once you start recording them"
          />
        )}
      </Card>

      {/* Recent Alerts */}
      <Card title="Recent Alerts">
        {recentAlerts.length > 0 ? (
          recentAlerts.map((alert: any) => (
            <View key={alert.id} style={styles.alertItem}>
              <View
                style={[
                  styles.alertSeverity,
                  {
                    backgroundColor:
                      alert.severity === 'high'
                        ? Colors.red500
                        : alert.severity === 'medium'
                        ? Colors.yellow500
                        : Colors.primary,
                  },
                ]}
              />
              <View style={styles.alertContent}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertMeta}>
                  {alert.location?.name} • {new Date(alert.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.alertSeverityText}>
                {alert.severity.toUpperCase()}
              </Text>
            </View>
          ))
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="No active alerts"
            description="All systems are running smoothly"
          />
        )}
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/inventory')}
          >
            <Package size={24} color={Colors.primary} />
            <Text style={styles.quickActionText}>Manage Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/sales')}
          >
            <TrendingUp size={24} color={Colors.green500} />
            <Text style={styles.quickActionText}>Record Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/reports')}
          >
            <Brain size={24} color={Colors.purple500} />
            <Text style={styles.quickActionText}>AI Report</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  signOutButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginHorizontal: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 8,
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
  lowStockItems: {
    gap: 4,
  },
  lowStockItem: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  lowStockMore: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  saleInfo: {
    flex: 1,
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.green500,
  },
  saleDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  saleDate: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 2,
  },
  saleLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saleLocationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  alertSeverity: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  alertMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  alertSeverityText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  quickAction: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});