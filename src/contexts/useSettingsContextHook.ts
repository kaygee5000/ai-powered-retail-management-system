import { useContext } from 'react';
import { SettingsContext, SettingsContextType } from './settingsContextObject'; // Updated import path

export const useSettingsContext = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};
