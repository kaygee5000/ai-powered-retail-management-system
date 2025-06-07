import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Store,
  MapPin,
  User,
  Plus,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { useLocations } from '../../hooks/useApi';

export default function LocationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: locations, loading, refetch } = useLocations();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.green500;
      case 'attention':
        return Colors.yellow500;
      case 'inactive':
        return Colors.red500;
      default:
        return Colors.gray500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'attention':
        return AlertTriangle;
      case 'inactive':
        return Clock;
      default:
        return Clock;
    }
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Locations</Text>
          <Text style={styles.subtitle}>Manage your store locations</Text>
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
        {!locations || locations.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No locations yet"
            description="Add your first location to get started"
          />
        ) : (
          <View style={styles.locationsList}>
            {locations.map((location: any, index: number) => {
              const StatusIcon = getStatusIcon(location.status);
              const statusColor = getStatusColor(location.status);

              return (
                <Card key={location.id} style={styles.locationCard}>
                  <View style={styles.locationHeader}>
                    <View style={styles.locationInfo}>
                      <View style={styles.locationTitleRow}>
                        <Text style={styles.locationName}>{location.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                          <StatusIcon size={12} color={statusColor} />
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {location.status}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.locationDetails}>
                        <MapPin size={14} color={Colors.gray500} />
                        <Text style={styles.locationAddress}>{location.address}</Text>
                      </View>
                      <View style={styles.locationDetails}>
                        <User size={14} color={Colors.gray500} />
                        <Text style={styles.locationManager}>Manager: {location.manager}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.moreButton}>
                      <MoreVertical size={20} color={Colors.gray500} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.locationStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>${(location.sales || 0).toFixed(0)}</Text>
                      <Text style={styles.statLabel}>Sales</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>${(location.inventory || 0).toFixed(0)}</Text>
                      <Text style={styles.statLabel}>Inventory</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{location.alerts || 0}</Text>
                      <Text style={styles.statLabel}>Alerts</Text>
                    </View>
                  </View>

                  <View style={styles.locationFooter}>
                    <Text style={styles.lastReport}>
                      Last report: {location.last_report || 'Never'}
                    </Text>
                    <Text style={styles.locationIndex}>#{index + 1}</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
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
  locationsList: {
    gap: 16,
  },
  locationCard: {
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  locationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  locationManager: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  moreButton: {
    padding: 4,
  },
  locationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  locationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  lastReport: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  locationIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});