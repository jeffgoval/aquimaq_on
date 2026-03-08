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
  refreshProfile: () => Promise<void>;
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

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as ProfileRow;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
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

  // Re-fetch profile when role changes externally (e.g. admin changes role in Supabase Dashboard).
  // Uses visibilitychange (instant when user switches back to tab) + 60s interval as fallback.
  useEffect(() => {
    if (!state.user?.id) return;

    const userId = state.user.id;

    const doRefresh = async () => {
      const updated = await fetchProfile(userId);
      setState(prev => {
        if (prev.profile?.role !== updated?.role) {
          return { ...prev, profile: updated };
        }
        return prev;
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') doRefresh();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(doRefresh, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [state.user?.id, fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore error
    }
    setState({ user: null, session: null, profile: null, loading: false });
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const updatedProfile = await fetchProfile(session.user.id);
    setState(prev => ({ ...prev, profile: updatedProfile }));
  }, [fetchProfile]);

  const value: AuthContextValue = {
    ...state,
    signOut,
    refreshProfile,
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
