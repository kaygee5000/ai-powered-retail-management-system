import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const DebugSupabase: React.FC = () => {
  const [status, setStatus] = useState<{
    env: 'success' | 'error' | 'checking';
    connection: 'success' | 'error' | 'checking' | 'pending';
    auth: 'success' | 'error' | 'checking' | 'pending';
    message: string;
  }>({
    env: 'pending',
    connection: 'pending', 
    auth: 'pending',
    message: ''
  });

  const checkEnvironmentVariables = () => {
    setStatus(prev => ({ ...prev, env: 'checking' }));
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      setStatus(prev => ({ 
        ...prev, 
        env: 'error',
        message: `Missing environment variables. URL: ${supabaseUrl ? '✓' : '✗'}, Key: ${supabaseKey ? '✓' : '✗'}`
      }));
      return false;
    }
    
    setStatus(prev => ({ 
      ...prev, 
      env: 'success',
      message: `Environment variables loaded. URL: ${supabaseUrl}, Key: ${supabaseKey.slice(0, 10)}...`
    }));
    return true;
  };

  const testConnection = async () => {
    if (!checkEnvironmentVariables()) return;
    
    setStatus(prev => ({ ...prev, connection: 'checking' }));
    
    try {
      // Try to make a simple request to Supabase
      const { error } = await supabase
        .from('user_settings')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }
      
      setStatus(prev => ({ 
        ...prev, 
        connection: 'success',
        message: prev.message + '\n✓ Successfully connected to Supabase database'
      }));
      
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      setStatus(prev => ({ 
        ...prev, 
        connection: 'error',
        message: prev.message + `\n✗ Connection failed: ${error.message}`
      }));
    }
  };

  const testAuth = async () => {
    setStatus(prev => ({ ...prev, auth: 'checking' }));
    
    try {
      const { data } = await supabase.auth.getSession(); // Removed unused 'error'
      
      setStatus(prev => ({ 
        ...prev, 
        auth: 'success',
        message: prev.message + `\n✓ Auth working. User: ${data.session?.user?.email || 'Not logged in'}`
      }));
      
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      setStatus(prev => ({ 
        ...prev, 
        auth: 'error',
        message: prev.message + `\n✗ Auth failed: ${error.message}`
      }));
    }
  };

  const runAllTests = async () => {
    setStatus({
      env: 'checking',
      connection: 'pending',
      auth: 'pending',
      message: 'Starting diagnostics...'
    });
    
    await testConnection();
    await testAuth();
  };

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'checking': return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Supabase Connection Debug</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            {getStatusIcon(status.env)}
            <span>Environment Variables</span>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusIcon(status.connection)}
            <span>Database Connection</span>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusIcon(status.auth)}
            <span>Authentication</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {status.message || 'Click "Run Diagnostics" to start...'}
          </pre>
        </div>

        <div className="space-y-3">
          <button
            onClick={runAllTests}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Run Diagnostics
          </button>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h3 className="font-medium text-yellow-800 mb-2">Expected Issues in WebContainer:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• CORS errors are common - need Supabase CORS config</li>
              <li>• Some external APIs may be blocked</li>
              <li>• Network timeouts possible</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h3 className="font-medium text-blue-800 mb-2">Current Environment:</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</div>
              <div>Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</div>
              <div>Mode: {import.meta.env.MODE}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugSupabase;