import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { TooltipProps, Payload } from 'recharts'; // Import TooltipProps and Payload
import { useCurrency } from '../../hooks/useCurrency';

interface AdvancedChartProps {
  type: 'line' | 'area' | 'bar' | 'pie';
  data: Array<Record<string, string | number>>;
  title: string;
  height?: number;
  colors?: string[];
  dataKey?: string;
  xAxisKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  loading?: boolean;
}

const AdvancedChart: React.FC<AdvancedChartProps> = ({
  type,
  data,
  title,
  height = 300,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  dataKey = 'value',
  xAxisKey = 'name',
  showGrid = true,
  showLegend = false,
  loading = false
}) => {
  const { format } = useCurrency();

  const customTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((pItem: Payload<number, string>, index: number) => (
            <p key={index} className="text-sm" style={{ color: pItem.color || pItem.payload?.fill || pItem.fill || colors[index % colors.length] }}>
              {`${pItem.name}: ${
                typeof pItem.value === 'number' &&
                (String(pItem.name).toLowerCase().includes('revenue') ||
                 String(pItem.name).toLowerCase().includes('sales') ||
                 String(pItem.name).toLowerCase().includes('value'))
                  ? format(pItem.value)
                  : pItem.value
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="animate-pulse">
          <div className={`bg-gray-200 rounded`} style={{ height: `${height}px` }}></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-2xl">📊</span>
            </div>
            <p className="text-gray-500">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3\" stroke="#f0f0f0" />}
            <XAxis dataKey={xAxisKey} stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip content={customTooltip} />
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={colors[0]} 
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: colors[0] }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3\" stroke="#f0f0f0" />}
            <XAxis dataKey={xAxisKey} stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip content={customTooltip} />
            {showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={colors[0]} 
              fill={`${colors[0]}20`}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3\" stroke="#f0f0f0" />}
            <XAxis dataKey={xAxisKey} stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip content={customTooltip} />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height * 0.3, 120)}
              dataKey={dataKey}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={customTooltip} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default AdvancedChart;