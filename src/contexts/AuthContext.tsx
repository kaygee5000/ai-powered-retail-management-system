import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'; // Added useCallback
import { User, Session } from '@supabase/supabase-js';
import { apiService } from '../services/apiService';

export interface AuthContextType { // Exported AuthContextType
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse<AuthSession>>;
  signUp: (email: string, password: string) => Promise<AuthResponse<AuthSession>>; // Or a specific type if signUp returns different data
  signOut: () => Promise<AuthResponse<null>>; // No specific data on signOut success
  resetPassword: (email: string) => Promise<AuthResponse<null>>; // Supabase resetPassword doesn't return significant data on success
}

// Define a generic response type for auth operations
export interface AuthError {
  message: string;
  status?: number; // Optional status code
  // [key: string]: any; // Temporarily removed index signature
}
export interface AuthResponse<T> {
  data: T | null;
  error: AuthError | string | null;
}


export const AuthContext = createContext<AuthContextType | undefined>(undefined); // Export AuthContext

// useAuth hook has been moved to src/contexts/useAuthHook.ts

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

  // Token management - these helpers don't depend on state/props, so they are stable
  const getStoredTokens = useCallback(() => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      return { accessToken, refreshToken };
    } catch {
      return { accessToken: null, refreshToken: null };
    }
  }, []);

  const storeTokens = useCallback((accessToken: string, refreshToken?: string) => {
    try {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    } catch (error) {
      console.warn('Failed to store auth tokens:', error);
    }
  }, []);

  const clearTokens = useCallback(() => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.warn('Failed to clear auth tokens:', error);
    }
  }, []);

  const updateAuthState = useCallback((authData: AuthSession | null) => {
    if (authData) {
      setUser(authData.user);
      setSession(authData.session);
      storeTokens(authData.access_token, authData.refresh_token);
    } else {
      setUser(null);
      setSession(null);
      clearTokens();
    }
  }, [storeTokens, clearTokens]);

  const checkSession = useCallback(async () => {
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
  }, [getStoredTokens, updateAuthState, clearTokens]); // Added missing ')' and dependency array

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await apiService.signIn(email, password);
      
      if (error) {
        return { data: null, error };
      }

      updateAuthState(data);
      return { data, error: null };
    } catch (e: unknown) {
      const errorMessage = String(e instanceof Error ? e.message : e);
      return { data: null, error: errorMessage };
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
    } catch (e: unknown) {
      const errorMessage = String(e instanceof Error ? e.message : e);
      return { data: null, error: errorMessage };
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
    } catch (e: unknown) {
      const errorMessage = String(e instanceof Error ? e.message : e);
      // Still clear local state even if API call fails
      updateAuthState(null);
      return { error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await apiService.resetPassword(email);
      return { data, error };
    } catch (e: unknown) {
      const errorMessage = String(e instanceof Error ? e.message : e);
      return { data: null, error: errorMessage };
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
  }, [user, updateAuthState, getStoredTokens]); // Added updateAuthState and getStoredTokens

  useEffect(() => {
    checkSession();
  }, [checkSession]); // Added checkSession

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