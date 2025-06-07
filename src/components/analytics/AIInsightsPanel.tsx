import React, { useState } from 'react';
import { 
  Brain, 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Target,
  Loader2
} from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

interface AIInsight {
  keyFindings: string[];
  recommendations: Array<{ type: string; title: string; description: string; impact: string }>;
  anomalies: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>;
  opportunities: Array<{ title: string; description: string; potentialValue: number }>;
}

interface AIInsightsPanelProps {
  insights: AIInsight;
  loading: boolean;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights, loading }) => {
  const [activeTab, setActiveTab] = useState('findings');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const { format } = useCurrency();

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'growth': return <TrendingUp className="w-4 h-4" />;
      case 'inventory': return <Target className="w-4 h-4" />;
      case 'customer': return <Sparkles className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'findings', label: 'Key Findings', icon: Brain, count: insights.keyFindings.length },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, count: insights.recommendations.length },
    { id: 'opportunities', label: 'Opportunities', icon: TrendingUp, count: insights.opportunities.length },
    { id: 'anomalies', label: 'Alerts', icon: AlertTriangle, count: insights.anomalies.length }
  ];

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-purple-900">AI-Powered Insights</h3>
          <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Brain className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-purple-900">AI-Powered Insights</h3>
        <div className="ml-auto flex items-center gap-1 text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          Live Analysis
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-purple-700 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'findings' && (
          <div className="space-y-3">
            {insights.keyFindings.length > 0 ? (
              insights.keyFindings.map((finding, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-purple-100">
                  <p className="text-gray-800">{finding}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No key findings available yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            {insights.recommendations.length > 0 ? (
              insights.recommendations.map((rec, index) => (
                <div key={index} className="bg-white rounded-lg border border-purple-100 overflow-hidden">
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          {getRecommendationIcon(rec.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{rec.title}</h4>
                          <p className="text-sm text-blue-600">{rec.impact}</p>
                        </div>
                      </div>
                      {expandedItems.has(index) ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  {expandedItems.has(index) && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <p className="text-gray-700 mt-3">{rec.description}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recommendations available yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="space-y-3">
            {insights.opportunities.length > 0 ? (
              insights.opportunities.map((opp, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{opp.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{opp.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {format(opp.potentialValue)}
                      </div>
                      <div className="text-xs text-gray-500">Potential Value</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No opportunities identified yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div className="space-y-3">
            {insights.anomalies.length > 0 ? (
              insights.anomalies.map((anomaly, index) => (
                <div key={index} className={`rounded-lg p-4 border ${getSeverityColor(anomaly.severity)}`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    <div>
                      <div className="font-medium capitalize">{anomaly.type} Alert</div>
                      <div className="text-sm">{anomaly.description}</div>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs font-medium uppercase">{anomaly.severity}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No anomalies detected</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;