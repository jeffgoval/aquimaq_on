import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { ProfileRow, UserRole } from '@/types/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isGerente: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string, retries = 5) => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
            // Wait and retry if profile is not yet created by trigger
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
              continue;
            }
          }
          throw error;
        }
        return data as ProfileRow;
      } catch (error) {
        console.error(`Error fetching profile (attempt ${i + 1}):`, error);
        if (i === retries - 1) return null;
      }
    }
    return null;
  }, []);

  const updateFromSession = useCallback(async (session: Session | null) => {
    if (!session) {
      setState({
        user: null,
        session: null,
        profile: null,
        loading: false,
      });
      return;
    }

    const profile = await fetchProfile(session.user.id);

    setState({
      user: session.user,
      session: session,
      profile: profile,
      loading: false,
    });
  }, [fetchProfile]);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateFromSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateFromSession(session);
    });

    return () => subscription.unsubscribe();
  }, [updateFromSession]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore error
    }
    setState({ user: null, session: null, profile: null, loading: false });
  }, []);

  const value: AuthContextValue = {
    ...state,
    signOut,
    isAdmin: state.profile?.role === 'admin',
    isGerente: state.profile?.role === 'gerente',
    hasRole: (roles: UserRole[]) => roles.includes(state.profile?.role || 'cliente'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
