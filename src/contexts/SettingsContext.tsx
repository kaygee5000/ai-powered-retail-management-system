import React, { useEffect } from 'react'; // Removed createContext
import { useSettings } from '../hooks/useSettings';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SettingsContext, SettingsContextType } from './settingsContextObject'; // Import from new file

// SettingsContextType is now imported
// SettingsContext is now imported
// useSettingsContext hook has been moved to src/contexts/useSettingsContextHook.ts

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