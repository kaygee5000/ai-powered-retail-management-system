import React, { createContext, useEffect, useState, useCallback } from 'react'; // Added useCallback
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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

  const updateAuthState = useCallback((authData: AuthSession | null) => {
    if (authData) {
      setUser(authData.user);
      setSession(authData.session);
    } else {
      setUser(null);
      setSession(null);
    }
  }, []);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check failed:', error);
        updateAuthState(null);
      } else if (session) {
        updateAuthState({
          user: session.user,
          session: session,
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      } else {
        updateAuthState(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      updateAuthState(null);
    } finally {
      setLoading(false);
    }
  }, [updateAuthState]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { data: null, error: error.message };
      }

      if (data.session) {
        updateAuthState({
          user: data.user,
          session: data.session,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }

      return { data: { user: data.user, session: data.session, access_token: data.session?.access_token || '' }, error: null };
    } catch (e: unknown) {
      const errorMessage = String(e instanceof Error ? e.message : e);
      return { data: null, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        return { data: null, error: error.message };
      }

      // Only update auth state if user is immediately confirmed
      if (data.session) {
        updateAuthState({
          user: data.user!,
          session: data.session,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }
      
      return { data: { user: data.user!, session: data.session, access_token: data.session?.access_token || '' }, error: null };
    } catch (e: unknown) {
      const errorMessage = String(e instanceof Error ? e.message : e);
      return { data: null, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      updateAuthState(null);
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: null, error: null };
    } catch (e: unknown) {
      const errorMessage = String(e instanceof Error ? e.message : e);
      // Still clear local state even if API call fails
      updateAuthState(null);
      return { data: null, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (e: unknown) {
      const errorMessage = String(e instanceof Error ? e.message : e);
      return { data: null, error: errorMessage };
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        updateAuthState({
          user: session.user,
          session: session,
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      } else if (event === 'SIGNED_OUT') {
        updateAuthState(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        updateAuthState({
          user: session.user,
          session: session,
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [updateAuthState]);

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