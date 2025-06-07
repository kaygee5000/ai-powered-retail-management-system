import { useSettingsContext } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

export const useCurrency = () => {
  const { settings } = useSettingsContext();
  
  const currencyCode = settings.ai_settings.currency || 'GHS';
  const countryCode = settings.ai_settings.country || 'GH';

  const format = (
    amount: number, 
    options: {
      showSymbol?: boolean;
      showCode?: boolean;
      decimals?: number;
    } = {}
  ): string => {
    return formatCurrency(amount, currencyCode, {
      showSymbol: true,
      showCode: false,
      decimals: 2,
      locale: 'en-GH',
      ...options
    });
  };

  const symbol = getCurrencySymbol(currencyCode);

  return {
    format,
    symbol,
    currencyCode,
    countryCode
  };
};