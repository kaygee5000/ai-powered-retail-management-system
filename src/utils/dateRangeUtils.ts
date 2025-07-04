// src/utils/dateRangeUtils.ts

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
  key: string;
}

// Helper function to get default date range
export const getDefaultDateRange = (): DateRange => {
  return {
    key: 'last7days',
    label: 'Last 7 Days',
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date()
  };
};

// Helper function to check if date is within range
export const isDateInRange = (date: Date, range: DateRange): boolean => {
  const checkDate = new Date(date);
  return checkDate >= range.start && checkDate <= range.end;
};

// Helper function to get period days from date range
export const getPeriodDaysFromRange = (range: DateRange): number => {
  const diffTime = Math.abs(range.end.getTime() - range.start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
};
