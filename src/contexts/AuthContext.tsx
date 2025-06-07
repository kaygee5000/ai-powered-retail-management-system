import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthSession {
  user: User;
  session: Session;
  access_token: string;
  refresh_token?: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Token management
  const getStoredTokens = () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      return { accessToken, refreshToken };
    } catch (error) {
      return { accessToken: null, refreshToken: null };
    }
  };

  const storeTokens = (accessToken: string, refreshToken?: string) => {
    try {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    } catch (error) {
      console.warn('Failed to store auth tokens:', error);
    }
  };

  const clearTokens = () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.warn('Failed to clear auth tokens:', error);
    }
  };

  const updateAuthState = (authData: AuthSession | null) => {
    if (authData) {
      setUser(authData.user);
      setSession(authData.session);
      storeTokens(authData.access_token, authData.refresh_token);
    } else {
      setUser(null);
      setSession(null);
      clearTokens();
    }
  };

  const checkSession = async () => {
    setLoading(true);
    try {
      const { accessToken, refreshToken } = getStoredTokens();
      
      if (!accessToken) {
        setLoading(false);
        return;
      }

      // Try to get session with current token
      const { data: sessionData, error: sessionError } = await apiService.getSession(accessToken);
      
      if (sessionError || !sessionData?.user) {
        // Try to refresh token if available
        if (refreshToken) {
          const { data: refreshData, error: refreshError } = await apiService.refreshToken(refreshToken);
          
          if (refreshError || !refreshData) {
            clearTokens();
          } else {
            updateAuthState(refreshData);
          }
        } else {
          clearTokens();
        }
      } else {
        // Session is valid
        updateAuthState({
          user: sessionData.user,
          session: sessionData.session,
          access_token: accessToken
        });
      }
    } catch (error) {
      console.error('Session check failed:', error);
      clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await apiService.signIn(email, password);
      
      if (error) {
        return { data: null, error };
      }

      updateAuthState(data);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await apiService.signUp(email, password);
      
      if (error) {
        return { data: null, error };
      }

      // Only update auth state if user is immediately confirmed
      if (data.user?.email_confirmed_at) {
        updateAuthState(data);
      }
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { accessToken } = getStoredTokens();
      
      if (accessToken) {
        await apiService.signOut(accessToken);
      }
      
      updateAuthState(null);
      return { error: null };
    } catch (error: any) {
      // Still clear local state even if API call fails
      updateAuthState(null);
      return { error: error.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await apiService.resetPassword(email);
      return { data, error };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  // Auto-refresh token before expiry
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      const { refreshToken } = getStoredTokens();
      
      if (refreshToken && user) {
        try {
          const { data, error } = await apiService.refreshToken(refreshToken);
          
          if (!error && data) {
            updateAuthState(data);
          }
        } catch (error) {
          console.warn('Auto token refresh failed:', error);
        }
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  useEffect(() => {
    checkSession();
  }, []);

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};