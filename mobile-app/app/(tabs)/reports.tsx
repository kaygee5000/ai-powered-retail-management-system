import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import {
  Brain,
  MessageSquare,
  Mic,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  MapPin,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { MetricCard } from '../../components/MetricCard';
import { useApi, useLocations } from '../../hooks/useApi';
import { apiService } from '../../services/apiService';

export default function ReportsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [reportText, setReportText] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const { data: reports, loading: reportsLoading, refetch: refetchReports } = useApi(() => apiService.getReports());
  const { data: locations, loading: locationsLoading } = useLocations();

  const loading = reportsLoading || locationsLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchReports();
    setRefreshing(false);
  };

  const handleSubmitReport = async () => {
    if (!reportText.trim() || !selectedLocationId || !staffName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await apiService.createReport({
        location_id: selectedLocationId,
        staff: staffName,
        raw_text: reportText,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        Alert.alert('Error', 'Failed to submit report');
      } else {
        Alert.alert('Success', 'Report submitted successfully');
        setReportText('');
        setStaffName('');
        await refetchReports();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Mock voice input - in a real app, this would use speech recognition
    if (!isListening) {
      setTimeout(() => {
        setReportText("Sold 5 bluetooth earbuds and 3 phone cases today. Customer returned 1 coffee bag due to expiration date. Need to reorder smartphone accessories.");
        setIsListening(false);
      }, 2000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return CheckCircle;
      case 'pending': return Clock;
      case 'flagged': return AlertTriangle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return Colors.green500;
      case 'pending': return Colors.yellow500;
      case 'flagged': return Colors.red500;
      default: return Colors.gray500;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return Colors.green500;
    if (confidence >= 0.7) return Colors.yellow500;
    return Colors.red500;
  };

  const getLocationName = (locationId: string) => {
    const location = locations?.find((l: any) => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  // Calculate metrics
  const totalReports = reports?.length || 0;
  const processedReports = reports?.filter((r: any) => r.status === 'processed').length || 0;
  const flaggedReports = reports?.filter((r: any) => r.status === 'flagged').length || 0;
  const averageConfidence = reports?.length > 0 
    ? reports.reduce((sum: number, r: any) => sum + r.confidence, 0) / reports.length 
    : 0;

  const samplePrompts = [
    "Sold 10 smartphones today, restocked coffee beans, customer complained about slow service",
    "Daily sales were good, need to reorder phone accessories, cash register had issues",
    "Customer was pleased with service, electronics section popular, cleaning supplies low",
    "Busy lunch hour, register #2 problems resolved, need more staff training"
  ];

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI Reports</Text>
          <Text style={styles.subtitle}>AI-powered business insights</Text>
        </View>
        <View style={styles.aiIndicator}>
          <Brain size={20} color={Colors.purple500} />
          <Text style={styles.aiText}>AI Active</Text>
        </View>
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
            title="Total Reports"
            value={totalReports.toString()}
            icon={FileText}
            color={Colors.primary}
          />
          <MetricCard
            title="Success Rate"
            value={`${totalReports > 0 ? Math.round((processedReports / totalReports) * 100) : 0}%`}
            icon={CheckCircle}
            color={Colors.green500}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Avg Confidence"
            value={`${Math.round(averageConfidence * 100)}%`}
            icon={Brain}
            color={Colors.purple500}
          />
          <MetricCard
            title="Flagged Reports"
            value={flaggedReports.toString()}
            icon={AlertTriangle}
            color={Colors.red500}
          />
        </View>

        {/* Submit Report */}
        <Card title="Submit New Report">
          <View style={styles.formContainer}>
            {/* Location and Staff */}
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Location</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity style={styles.picker}>
                    <Text style={styles.pickerText}>
                      {selectedLocationId ? getLocationName(selectedLocationId) : 'Select location'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Staff Member</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your name"
                  value={staffName}
                  onChangeText={setStaffName}
                />
              </View>
            </View>

            {/* Report Text */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Report Description</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe your daily activities, sales, inventory changes, or observations..."
                  multiline
                  numberOfLines={4}
                  value={reportText}
                  onChangeText={setReportText}
                  textAlignVertical="top"
                />
                <View style={styles.textAreaActions}>
                  <TouchableOpacity
                    style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                    onPress={handleVoiceInput}
                  >
                    <Mic size={20} color={isListening ? Colors.red500 : Colors.gray500} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, (!reportText.trim() || !selectedLocationId || !staffName.trim()) && styles.submitButtonDisabled]}
                    onPress={handleSubmitReport}
                    disabled={!reportText.trim() || !selectedLocationId || !staffName.trim() || submitting}
                  >
                    {submitting ? (
                      <Text style={styles.submitButtonText}>Submitting...</Text>
                    ) : (
                      <>
                        <Send size={16} color={Colors.white} />
                        <Text style={styles.submitButtonText}>Submit</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {isListening && (
              <View style={styles.listeningIndicator}>
                <View style={styles.listeningDot} />
                <Text style={styles.listeningText}>Listening... Speak your report</Text>
              </View>
            )}

            {/* Sample Prompts */}
            <View style={styles.promptsContainer}>
              <View style={styles.promptsHeader}>
                <Sparkles size={16} color={Colors.purple500} />
                <Text style={styles.promptsTitle}>Try these examples:</Text>
              </View>
              <View style={styles.promptsList}>
                {samplePrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.promptItem}
                    onPress={() => setReportText(prompt)}
                  >
                    <Text style={styles.promptText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Card>

        {/* Recent Reports */}
        <Card title="Recent Reports">
          {!reports || reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No reports yet"
              description="Submit your first report using the form above"
            />
          ) : (
            <View style={styles.reportsList}>
              {reports.map((report: any) => {
                const StatusIcon = getStatusIcon(report.status);
                const statusColor = getStatusColor(report.status);
                const confidenceColor = getConfidenceColor(report.confidence);

                return (
                  <View key={report.id} style={styles.reportItem}>
                    <View style={styles.reportHeader}>
                      <View style={styles.reportInfo}>
                        <View style={styles.reportTitleRow}>
                          <User size={14} color={Colors.gray500} />
                          <Text style={styles.reportStaff}>{report.staff}</Text>
                        </View>
                        <View style={styles.reportMetaRow}>
                          <MapPin size={12} color={Colors.gray500} />
                          <Text style={styles.reportLocation}>
                            {getLocationName(report.location_id)}
                          </Text>
                          <Text style={styles.reportDate}>
                            • {new Date(report.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reportStatus}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                          <StatusIcon size={12} color={statusColor} />
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {report.status}
                          </Text>
                        </View>
                        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '20' }]}>
                          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                            {Math.round(report.confidence * 100)}%
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.reportContent}>
                      <Text style={styles.reportText}>"{report.raw_text}"</Text>
                      
                      {report.parsed_data && Object.keys(report.parsed_data).length > 0 && (
                        <View style={styles.aiAnalysis}>
                          <View style={styles.aiAnalysisHeader}>
                            <Brain size={14} color={Colors.purple500} />
                            <Text style={styles.aiAnalysisTitle}>AI Analysis</Text>
                          </View>
                          
                          {report.parsed_data.sales && (
                            <View style={styles.analysisItem}>
                              <Text style={styles.analysisLabel}>Sales:</Text>
                              <Text style={styles.analysisValue}>${report.parsed_data.sales}</Text>
                            </View>
                          )}
                          
                          {report.parsed_data.inventory && report.parsed_data.inventory.length > 0 && (
                            <View style={styles.analysisItem}>
                              <Text style={styles.analysisLabel}>Inventory Changes:</Text>
                              {report.parsed_data.inventory.slice(0, 2).map((item: any, idx: number) => (
                                <Text key={idx} style={styles.inventoryItem}>
                                  • {item.item}: {item.count > 0 ? '+' : ''}{item.count} ({item.action})
                                </Text>
                              ))}
                            </View>
                          )}
                          
                          {report.parsed_data.customer_feedback && (
                            <View style={styles.analysisItem}>
                              <Text style={styles.analysisLabel}>Customer Feedback:</Text>
                              <Text style={styles.analysisValue}>{report.parsed_data.customer_feedback}</Text>
                            </View>
                          )}
                        </View>
                      )}
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
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.purple500 + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  aiText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.purple500,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  formContainer: {
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 8,
  },
  picker: {
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textAreaContainer: {
    position: 'relative',
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 100,
    paddingBottom: 50,
  },
  textAreaActions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: Colors.red500 + '20',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.red500 + '15',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red500,
  },
  listeningText: {
    fontSize: 14,
    color: Colors.red500,
    fontWeight: '500',
  },
  promptsContainer: {
    marginTop: 8,
  },
  promptsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  promptsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.purple500,
  },
  promptsList: {
    gap: 8,
  },
  promptItem: {
    backgroundColor: Colors.purple500 + '10',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.purple500 + '20',
  },
  promptText: {
    fontSize: 14,
    color: Colors.purple500,
  },
  reportsList: {
    gap: 16,
  },
  reportItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reportStaff: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reportDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reportStatus: {
    alignItems: 'flex-end',
    gap: 4,
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
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportContent: {
    gap: 12,
  },
  reportText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  aiAnalysis: {
    backgroundColor: Colors.purple500 + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiAnalysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.purple500,
  },
  analysisItem: {
    gap: 4,
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  analysisValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inventoryItem: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
});