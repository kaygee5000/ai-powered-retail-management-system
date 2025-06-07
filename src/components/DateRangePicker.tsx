import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Clock } from 'lucide-react';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
  key: string;
}

interface DateRangePickerProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedRange,
  onRangeChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const presetRanges: DateRange[] = [
    {
      key: 'today',
      label: 'Today',
      start: new Date(new Date().setHours(0, 0, 0, 0)),
      end: new Date(new Date().setHours(23, 59, 59, 999))
    },
    {
      key: 'yesterday',
      label: 'Yesterday',
      start: new Date(new Date().setDate(new Date().getDate() - 1)),
      end: new Date(new Date().setDate(new Date().getDate() - 1))
    },
    {
      key: 'last5weekdays',
      label: 'Last 5 Weekdays',
      start: (() => {
        const date = new Date();
        let daysBack = 0;
        let weekdaysFound = 0;
        
        while (weekdaysFound < 5) {
          daysBack++;
          const checkDate = new Date();
          checkDate.setDate(date.getDate() - daysBack);
          const dayOfWeek = checkDate.getDay();
          
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
            weekdaysFound++;
          }
        }
        
        const startDate = new Date();
        startDate.setDate(date.getDate() - daysBack);
        return startDate;
      })(),
      end: new Date()
    },
    {
      key: 'thisweek',
      label: 'This Week',
      start: (() => {
        const date = new Date();
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
        return new Date(date.setDate(diff));
      })(),
      end: new Date()
    },
    {
      key: 'lastweek',
      label: 'Last Week',
      start: (() => {
        const date = new Date();
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek - 6; // Previous Monday
        return new Date(date.setDate(diff));
      })(),
      end: (() => {
        const date = new Date();
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek; // Last Sunday
        return new Date(date.setDate(diff));
      })()
    },
    {
      key: 'last7days',
      label: 'Last 7 Days',
      start: new Date(new Date().setDate(new Date().getDate() - 7)),
      end: new Date()
    },
    {
      key: 'last14days',
      label: 'Last 14 Days',
      start: new Date(new Date().setDate(new Date().getDate() - 14)),
      end: new Date()
    },
    {
      key: 'thismonth',
      label: 'This Month',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date()
    },
    {
      key: 'lastmonth',
      label: 'Last Month',
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    },
    {
      key: 'last30days',
      label: 'Last 30 Days',
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date()
    },
    {
      key: 'last90days',
      label: 'Last 90 Days',
      start: new Date(new Date().setDate(new Date().getDate() - 90)),
      end: new Date()
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getDateRangeText = (range: DateRange) => {
    if (range.key === 'today') return 'Today';
    if (range.key === 'yesterday') return 'Yesterday';
    
    const startFormatted = formatDate(range.start);
    const endFormatted = formatDate(range.end);
    
    if (startFormatted === endFormatted) {
      return startFormatted;
    }
    
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors min-w-48"
      >
        <Calendar className="w-4 h-4" />
        <span className="font-medium">{selectedRange.label}</span>
        <span className="text-gray-500 text-sm">({getDateRangeText(selectedRange)})</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
              <Clock className="w-4 h-4" />
              Quick Ranges
            </div>
            
            <div className="py-1">
              {presetRanges.map((range) => (
                <button
                  key={range.key}
                  onClick={() => {
                    onRangeChange(range);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors ${
                    selectedRange.key === range.key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="font-medium">{range.label}</div>
                  <div className="text-xs text-gray-500">{getDateRangeText(range)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;

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