import { ParsedReportData } from '../hooks/useReports'; // Import ParsedReportData

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string;
          name: string;
          address: string;
          manager: string;
          status: 'active' | 'inactive' | 'attention';
          sales: number;
          inventory: number;
          last_report: string;
          alerts: number;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          manager: string;
          status?: 'active' | 'inactive' | 'attention';
          sales?: number;
          inventory?: number;
          last_report?: string;
          alerts?: number;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          manager?: string;
          status?: 'active' | 'inactive' | 'attention';
          sales?: number;
          inventory?: number;
          last_report?: string;
          alerts?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          sku: string;
          category: string;
          price: number;
          stock: number;
          min_stock: number;
          location_id: string;
          last_updated: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          sku: string;
          category: string;
          price: number;
          stock: number;
          min_stock: number;
          location_id: string;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          sku?: string;
          category?: string;
          price?: number;
          stock?: number;
          min_stock?: number;
          location_id?: string;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          timestamp: string;
          location_id: string;
          total: number;
          items: number;
          staff: string;
          payment_method: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          timestamp: string;
          location_id: string;
          total: number;
          items: number;
          staff: string;
          payment_method: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          timestamp?: string;
          location_id?: string;
          total?: number;
          items?: number;
          staff?: string;
          payment_method?: string;
          created_at?: string;
          user_id?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          type: 'low_stock' | 'high_return' | 'unusual_activity' | 'sales_spike' | 'system';
          severity: 'low' | 'medium' | 'high';
          message: string;
          location_id: string;
          timestamp: string;
          resolved: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          type: 'low_stock' | 'high_return' | 'unusual_activity' | 'sales_spike' | 'system';
          severity: 'low' | 'medium' | 'high';
          message: string;
          location_id: string;
          timestamp: string;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          type?: 'low_stock' | 'high_return' | 'unusual_activity' | 'sales_spike' | 'system';
          severity?: 'low' | 'medium' | 'high';
          message?: string;
          location_id?: string;
          timestamp?: string;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          timestamp: string;
          location_id: string;
          staff: string;
          raw_text: string;
          parsed_data: ParsedReportData | null;
          confidence: number;
          status: 'processed' | 'pending' | 'flagged';
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          timestamp: string;
          location_id: string;
          staff: string;
          raw_text: string;
          parsed_data?: ParsedReportData | null;
          confidence: number;
          status?: 'processed' | 'pending' | 'flagged';
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          timestamp?: string;
          location_id?: string;
          staff?: string;
          raw_text?: string;
          parsed_data?: ParsedReportData | null;
          confidence?: number;
          status?: 'processed' | 'pending' | 'flagged';
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      inventory_adjustments: {
        Row: {
          id: string;
          product_id: string;
          quantity_change: number;
          reason: 'damaged' | 'expired' | 'theft' | 'restock' | 'recount' | 'promotion' | 'transfer' | 'other';
          notes: string | null;
          timestamp: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity_change: number;
          reason: 'damaged' | 'expired' | 'theft' | 'restock' | 'recount' | 'promotion' | 'transfer' | 'other';
          notes?: string | null;
          timestamp?: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          quantity_change?: number;
          reason?: 'damaged' | 'expired' | 'theft' | 'restock' | 'recount' | 'promotion' | 'transfer' | 'other';
          notes?: string | null;
          timestamp?: string;
          created_at?: string;
          user_id?: string;
        };
      };
      sales_returns: {
        Row: {
          id: string;
          original_sale_id: string | null;
          product_id: string | null;
          quantity_returned: number | null;
          refund_amount: number;
          reason: 'defective' | 'wrong_item' | 'customer_change_mind' | 'damaged' | 'expired' | 'duplicate' | 'other';
          notes: string | null;
          timestamp: string;
          location_id: string;
          staff: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          original_sale_id?: string | null;
          product_id?: string | null;
          quantity_returned?: number | null;
          refund_amount: number;
          reason: 'defective' | 'wrong_item' | 'customer_change_mind' | 'damaged' | 'expired' | 'duplicate' | 'other';
          notes?: string | null;
          timestamp?: string;
          location_id: string;
          staff: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          original_sale_id?: string | null;
          product_id?: string | null;
          quantity_returned?: number | null;
          refund_amount?: number;
          reason?: 'defective' | 'wrong_item' | 'customer_change_mind' | 'damaged' | 'expired' | 'duplicate' | 'other';
          notes?: string | null;
          timestamp?: string;
          location_id?: string;
          staff?: string;
          created_at?: string;
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}