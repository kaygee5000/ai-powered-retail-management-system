import { createContext } from 'react';
import { UserSettings } from '../hooks/useSettings';

export interface SettingsContextType {
  settings: UserSettings;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateProfileData: (profileData: Partial<UserSettings['profile_data']>) => Promise<{ success: boolean; error: string | null }>;
  updateNotificationPreferences: (preferences: Partial<UserSettings['notification_preferences']>) => Promise<{ success: boolean; error: string | null }>;
  updateAISettings: (aiSettings: Partial<UserSettings['ai_settings']>) => Promise<{ success: boolean; error: string | null }>;
  updateSecuritySettings: (securitySettings: Partial<UserSettings['security_settings']>) => Promise<{ success: boolean; error: string | null }>;
  updateAppearanceSettings: (appearanceSettings: Partial<UserSettings['appearance_settings']>) => Promise<{ success: boolean; error: string | null }>;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
