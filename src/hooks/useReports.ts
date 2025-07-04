import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { apiService } from '../services/apiService';

interface ParsedReportData {
  sales?: number;
  inventory?: Array<{ item: string; count: number; action: 'added' | 'removed' | 'sold' | string }>; // string for other actions
  customer_feedback?: string;
  staff_observations?: string;
  alerts?: string[];
  [key: string]: string | number | boolean | Array<string | number | boolean | Record<string, unknown>> | Record<string, unknown> | undefined | null;
}

interface Report {
  id: string;
  timestamp: string;
  location_id: string;
  location?: {
    name: string;
  };
  staff: string;
  raw_text: string;
  parsed_data: ParsedReportData | null; // Use the new interface, allow null if not parsed
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

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getReports();
      if (apiError) throw new Error(apiError.message || String(apiError));
      setReports(data || []);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addReport = useCallback(async (reportData: {
    location_id: string;
    staff: string;
    raw_text: string;
    timestamp?: string;
  }) => {
    setProcessing(true);
    try {
      const { data, error: apiError } = await apiService.createReport(reportData);
      if (apiError) throw new Error(apiError.message || String(apiError));
      
      await fetchReports();
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    } finally {
      setProcessing(false);
    }
  }, [fetchReports]);

  const parseText = useCallback(async (text: string, confidenceThreshold?: number) => {
    setProcessing(true);
    try {
      const { data, error: apiError } = await apiService.parseText(text, confidenceThreshold);
      if (apiError) throw new Error(apiError.message || String(apiError));
      return { data, error: null };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { data: null, error: err.message };
    } finally {
      setProcessing(false);
    }
  }, []); // parseText does not depend on fetchReports or other hook state

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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