import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { getProfile, ensureProfile } from '@/services/profileService';
import type { ProfileRow } from '@/types/database';

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  isRecovery: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (params: { email: string; password: string }) => Promise<{ error: Error | null }>;
  signUp: (params: { email: string; password: string; redirectTo?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string, redirectTo: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const p = await getProfile(user.id);
    setProfile(p);
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;

    const setSessionAndUser = (s: Session | null) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        setProfile(null);
        return;
      }
      ensureProfile(s.user.id, s.user.email ?? undefined).then(setProfile);
    };

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSessionAndUser(s);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
      setSessionAndUser(s);
      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
      if (s?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        setTimeout(() => {
          ensureProfile(s.user.id, s.user.email ?? undefined).then(setProfile);
        }, 0);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (params: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({ email: params.email, password: params.password });
      return { error: error ?? null };
    },
    []
  );

  const signUp = useCallback(
    async (params: { email: string; password: string; redirectTo?: string }) => {
      const { error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: params.redirectTo ? { emailRedirectTo: params.redirectTo } : undefined,
      });
      return { error: error ?? null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsRecovery(false);
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string, redirectTo: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error ?? null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ?? null };
  }, []);

  const clearRecovery = useCallback(() => setIsRecovery(false), []);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    isRecovery,
    refreshProfile,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    clearRecovery,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
