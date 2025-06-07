import React from 'react';
import { Brain } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-blue-600 rounded-xl animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">RetailAI Manager</h2>
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-gray-600 mt-2">Loading your dashboard...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;