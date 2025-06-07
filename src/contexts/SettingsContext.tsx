import React, { createContext, useContext, useEffect } from 'react';
import { useSettings, UserSettings } from '../hooks/useSettings';

interface SettingsContextType {
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

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const settingsHook = useSettings();

  // Apply appearance settings to the document
  useEffect(() => {
    if (!settingsHook.loading && settingsHook.settings.appearance_settings) {
      const { theme, primaryColor } = settingsHook.settings.appearance_settings;
      
      // Apply theme
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      
      // Apply primary color (could be expanded with CSS custom properties)
      document.documentElement.style.setProperty('--primary-color', primaryColor);
    }
  }, [settingsHook.settings.appearance_settings, settingsHook.loading]);

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
};