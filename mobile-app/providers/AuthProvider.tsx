import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { apiService } from '../services/apiService';
import { supabase } from '../lib/supabase';
import { router, useSegments } from 'expo-router';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === '(auth)';

      if (user && !inAuthGroup) {
        // User is logged in, but not in the auth group, redirect to home
        router.replace('/(tabs)');
      } else if (!user && inAuthGroup) {
        // User is not logged in, and is in the auth group, stay there
      } else if (!user && !inAuthGroup) {
        // User is not logged in, and not in the auth group, redirect to login
        router.replace('/(auth)/login');
      }
    }
  }, [loading, user, segments]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await apiService.signIn(email, password);
    setLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await apiService.signUp(email, password);
    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await apiService.signOut();
    setLoading(false);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};