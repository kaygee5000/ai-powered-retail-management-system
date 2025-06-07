import React, { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  loading?: boolean;
  trendTooltip?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  subtitle,
  trend,
  loading = false,
  trendTooltip
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isPositive = change > 0;
  const changeColor = isPositive ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="w-3 h-3" />;
      case 'down':
        return <ArrowDownIcon className="w-3 h-3" />;
      case 'stable':
        return <MinusIcon className="w-3 h-3" />;
      default:
        if (isPositive) return <ArrowUpIcon className="w-3 h-3" />;
        if (change < 0) return <ArrowDownIcon className="w-3 h-3" />;
        return <MinusIcon className="w-3 h-3" />;
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${color}`}>
              <div className="w-6 h-6 bg-white/30 rounded"></div>
            </div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="relative">
          <div 
            className={`flex items-center gap-1 text-sm font-medium ${changeColor} cursor-pointer`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {getTrendIcon()}
            {change !== 0 && `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
          </div>
          
          {/* Tooltip */}
          {showTooltip && trendTooltip && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10">
              <div className="font-medium mb-1">Trend Calculation:</div>
              <div className="text-gray-300">{trendTooltip}</div>
              {/* Arrow pointing up */}
              <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-gray-600 text-sm">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;