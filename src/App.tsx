import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import AuthLayout from './components/auth/AuthLayout';
import LoadingSpinner from './components/LoadingSpinner';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Locations from './components/Locations';
import Inventory from './components/Inventory';
import Analytics from './components/Analytics';
import AIReports from './components/AIReports';
import Alerts from './components/Alerts';
import Sales from './components/Sales';
import Settings from './components/Settings';
import DebugSupabase from './components/DebugSupabase';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showDebug, setShowDebug] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <>
        <AuthLayout />
        {/* Add debug button to auth layout */}
        <button
          onClick={() => setShowDebug(true)}
          className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700"
        >
          Debug Connection
        </button>
        {showDebug && <DebugSupabase />}
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'locations':
        return <Locations />;
      case 'inventory':
        return <Inventory />;
      case 'sales':
        return <Sales />;
      case 'analytics':
        return <Analytics />;
      case 'reports':
        return <AIReports />;
      case 'alerts':
        return <Alerts />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SettingsProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
        {/* Add debug button for logged in users too */}
        <button
          onClick={() => setShowDebug(true)}
          className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 z-40"
        >
          Debug
        </button>
        {showDebug && <DebugSupabase />}
      </div>
    </SettingsProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;