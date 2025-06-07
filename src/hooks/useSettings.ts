import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export interface UserSettings {
  id: string;
  user_id: string;
  profile_data: {
    name: string;
    phone: string;
    role: string;
  };
  notification_preferences: {
    lowStock: boolean;
    highSales: boolean;
    unusualActivity: boolean;
    dailyReports: boolean;
    weeklyReports: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
  ai_settings: {
    confidenceThreshold: number;
    autoProcessReports: boolean;
    enableVoiceInput: boolean;
    language: string;
    timezone: string;
    currency: string;
    country: string;
  };
  security_settings: {
    twoFactorAuth: boolean;
    passwordExpiry: number;
    sessionTimeout: number;
    loginAttempts: number;
  };
  appearance_settings: {
    theme: string;
    primaryColor: string;
    compactMode: boolean;
  };
  created_at: string;
  updated_at: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>({
    id: '',
    user_id: '',
    profile_data: {
      name: '',
      phone: '',
      role: 'Store Owner'
    },
    notification_preferences: {
      lowStock: true,
      highSales: true,
      unusualActivity: true,
      dailyReports: false,
      weeklyReports: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    },
    ai_settings: {
      confidenceThreshold: 85,
      autoProcessReports: true,
      enableVoiceInput: true,
      language: 'en',
      timezone: 'Africa/Accra',
      currency: 'GHS',
      country: 'GH'
    },
    security_settings: {
      twoFactorAuth: false,
      passwordExpiry: 90,
      sessionTimeout: 30,
      loginAttempts: 5
    },
    appearance_settings: {
      theme: 'light',
      primaryColor: 'blue',
      compactMode: false
    },
    created_at: '',
    updated_at: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiService.getSettings();
      if (apiError) throw new Error(apiError);
      
      if (data) {
        setSettings(data);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (profileData: Partial<UserSettings['profile_data']>) => {
    setSaving(true);
    try {
      const { data, error: apiError } = await apiService.updateSettings({
        profile_data: { ...settings.profile_data, ...profileData }
      });
      
      if (apiError) throw new Error(apiError);
      
      if (data) {
        setSettings(data);
      }
      
      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationPreferences = async (preferences: Partial<UserSettings['notification_preferences']>) => {
    setSaving(true);
    try {
      const { data, error: apiError } = await apiService.updateSettings({
        notification_preferences: { ...settings.notification_preferences, ...preferences }
      });
      
      if (apiError) throw new Error(apiError);
      
      if (data) {
        setSettings(data);
      }
      
      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  const updateAISettings = async (aiSettings: Partial<UserSettings['ai_settings']>) => {
    setSaving(true);
    try {
      const { data, error: apiError } = await apiService.updateSettings({
        ai_settings: { ...settings.ai_settings, ...aiSettings }
      });
      
      if (apiError) throw new Error(apiError);
      
      if (data) {
        setSettings(data);
      }
      
      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  const updateSecuritySettings = async (securitySettings: Partial<UserSettings['security_settings']>) => {
    setSaving(true);
    try {
      const { data, error: apiError } = await apiService.updateSettings({
        security_settings: { ...settings.security_settings, ...securitySettings }
      });
      
      if (apiError) throw new Error(apiError);
      
      if (data) {
        setSettings(data);
      }
      
      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  const updateAppearanceSettings = async (appearanceSettings: Partial<UserSettings['appearance_settings']>) => {
    setSaving(true);
    try {
      const { data, error: apiError } = await apiService.updateSettings({
        appearance_settings: { ...settings.appearance_settings, ...appearanceSettings }
      });
      
      if (apiError) throw new Error(apiError);
      
      if (data) {
        setSettings(data);
      }
      
      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    saving,
    error,
    fetchSettings,
    updateProfileData,
    updateNotificationPreferences,
    updateAISettings,
    updateSecuritySettings,
    updateAppearanceSettings
  };
};