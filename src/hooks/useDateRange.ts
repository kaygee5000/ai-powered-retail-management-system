import { useState, useCallback } from 'react';
import { DateRange, getDefaultDateRange, getPeriodDaysFromRange, isDateInRange } from '../components/DateRangePicker';

export const useDateRange = (initialRange?: DateRange) => {
  const [dateRange, setDateRange] = useState<DateRange>(initialRange || getDefaultDateRange());

  const updateDateRange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
  }, []);

  // Filter data by date range
  const filterByDateRange = useCallback(<T extends { timestamp: string }>(
    data: T[],
    dateField: keyof T = 'timestamp' as keyof T
  ): T[] => {
    return data.filter(item => {
      const itemDate = new Date(item[dateField] as string);
      return isDateInRange(itemDate, dateRange);
    });
  }, [dateRange]);

  // Get period information
  const getPeriodInfo = useCallback(() => {
    const periodDays = getPeriodDaysFromRange(dateRange);
    const isToday = dateRange.key === 'today';
    const isYesterday = dateRange.key === 'yesterday';
    const isSingleDay = dateRange.start.toDateString() === dateRange.end.toDateString();

    return {
      periodDays,
      isToday,
      isYesterday,
      isSingleDay,
      startDate: dateRange.start,
      endDate: dateRange.end,
      label: dateRange.label
    };
  }, [dateRange]);

  // Format metrics with context
  const formatMetricWithContext = useCallback((value: number, unit: string = '') => {
    const { isToday, isYesterday, isSingleDay, label } = getPeriodInfo();
    
    let contextText = '';
    if (isToday) {
      contextText = 'today';
    } else if (isYesterday) {
      contextText = 'yesterday';
    } else if (isSingleDay) {
      contextText = `on ${dateRange.start.toLocaleDateString()}`;
    } else {
      contextText = `in ${label.toLowerCase()}`;
    }

    return {
      value: `${value}${unit}`,
      context: contextText,
      fullText: `${value}${unit} ${contextText}`
    };
  }, [dateRange, getPeriodInfo]);

  return {
    dateRange,
    updateDateRange,
    filterByDateRange,
    getPeriodInfo,
    formatMetricWithContext,
    // Convenience methods
    periodDays: getPeriodDaysFromRange(dateRange),
    isToday: dateRange.key === 'today',
    isYesterday: dateRange.key === 'yesterday'
  };
};