import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface Report {
  id: string;
  timestamp: string;
  location_id: string;
  location?: {
    name: string;
  };
  staff: string;
  raw_text: string;
  parsed_data: any;
  confidence: number;
  status: 'processed' | 'pending' | 'flagged';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getReports();
      if (apiError) throw new Error(apiError);
      setReports(data || []);
    } catch (err: any) {
      setError(err.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const addReport = async (reportData: {
    location_id: string;
    staff: string;
    raw_text: string;
    timestamp?: string;
  }) => {
    setProcessing(true);
    try {
      const { data, error: apiError } = await apiService.createReport(reportData);
      if (apiError) throw new Error(apiError);
      
      // Refresh the reports list
      await fetchReports();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    } finally {
      setProcessing(false);
    }
  };

  const parseText = async (text: string, confidenceThreshold?: number) => {
    setProcessing(true);
    try {
      const { data, error: apiError } = await apiService.parseText(text, confidenceThreshold);
      if (apiError) throw new Error(apiError);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    loading,
    processing,
    error,
    fetchReports,
    addReport,
    parseText
  };
};