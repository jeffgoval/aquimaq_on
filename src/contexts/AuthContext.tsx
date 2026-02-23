import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  const updateFromSession = useCallback((session: Session | null) => {
    setState({
      user: session?.user ?? null,
      session: session ?? null,
      loading: false,
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateFromSession(session);
    });

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
      // ignora erro; limpamos estado na mesma
    }
    setState({ user: null, session: null, loading: false });
  }, []);

  const value: AuthContextValue = {
    ...state,
    signOut,
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
