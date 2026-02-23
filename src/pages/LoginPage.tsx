import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';

type AuthMode = 'login' | 'signup' | 'forgot';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  useEffect(() => {
    if (!authLoading && user) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!tokenHash) return;
    setVerifying(true);
    setError(null);
    supabase.auth
      .verifyOtp({
        token_hash: tokenHash,
        type: (type as 'email' | 'magiclink' | 'recovery') || 'email',
      })
      .then(({ error: err }) => {
        setVerifying(false);
        if (err) {
          setError(err.message);
        } else {
          window.history.replaceState({}, document.title, ROUTES.LOGIN);
          window.location.replace(ROUTES.HOME);
        }
      });
  }, [tokenHash, type]);

  const resetForm = () => {
    setError(null);
    setSuccessMessage(null);
    setFullName('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate(ROUTES.HOME, { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);
    const name = fullName.trim() || undefined;
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}${ROUTES.LOGIN}`,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }
    setSuccessMessage('Conta criada. Verifique seu e-mail para confirmar o cadastro.');
    resetForm();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${ROUTES.LOGIN}`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccessMessage('Enviamos um link para redefinir sua senha no seu e-mail.');
  };

  if (verifying) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
        <Helmet>
          <title>Entrar | Aquimaq</title>
        </Helmet>
        <div className="w-10 h-10 border-2 border-agro-200 border-t-agro-600 rounded-full animate-spin" aria-hidden />
        <p className="text-slate-600 mt-4">Confirmando...</p>
      </div>
    );
  }

  if (error && tokenHash) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 max-w-md mx-auto">
        <Helmet>
          <title>Erro | Aquimaq</title>
        </Helmet>
        <p className="text-red-600 font-medium">Falha na confirmação</p>
        <p className="text-slate-600 text-sm mt-2 text-center">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            window.history.replaceState({}, document.title, ROUTES.LOGIN);
          }}
          className="mt-6 px-4 py-2 bg-agro-600 text-white rounded-lg hover:bg-agro-700 transition-colors"
        >
          Voltar ao login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-8">
      <Helmet>
        <title>{mode === 'signup' ? 'Criar conta' : mode === 'forgot' ? 'Recuperar senha' : 'Entrar'} | Aquimaq</title>
        <meta name="description" content="Entre ou crie sua conta Aquimaq." />
      </Helmet>

      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); resetForm(); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'text-agro-600 border-b-2 border-agro-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); resetForm(); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'signup' ? 'text-agro-600 border-b-2 border-agro-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Criar conta
          </button>
        </div>

        {successMessage && (
          <p className="text-agro-600 text-sm mb-4" role="status">{successMessage}</p>
        )}
        {error && (
          <p className="text-red-600 text-sm mb-4" role="alert">{error}</p>
        )}

        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-slate-600 text-sm">Digite seu e-mail para receber o link de redefinição de senha.</p>
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                id="auth-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-agro-500 focus:outline-none focus:ring-2 focus:ring-agro-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-agro-600 text-white font-medium hover:bg-agro-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); resetForm(); }}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              Voltar ao login
            </button>
          </form>
        ) : mode === 'signup' ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
              <input
                id="signup-name"
                type="text"
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-agro-500 focus:outline-none focus:ring-2 focus:ring-agro-500/20"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                id="signup-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-agro-500 focus:outline-none focus:ring-2 focus:ring-agro-500/20"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                id="signup-password"
                type="password"
                placeholder="Mín. 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-agro-500 focus:outline-none focus:ring-2 focus:ring-agro-500/20"
              />
            </div>
            <div>
              <label htmlFor="signup-confirm" className="block text-sm font-medium text-slate-700 mb-1">Confirmar senha</label>
              <input
                id="signup-confirm"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-agro-500 focus:outline-none focus:ring-2 focus:ring-agro-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-agro-600 text-white font-medium hover:bg-agro-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-agro-500 focus:outline-none focus:ring-2 focus:ring-agro-500/20"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                id="login-password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-agro-500 focus:outline-none focus:ring-2 focus:ring-agro-500/20"
              />
            </div>
            <button
              type="button"
              onClick={() => { setMode('forgot'); resetForm(); }}
              className="text-sm text-slate-500 hover:text-agro-600"
            >
              Esqueci a senha
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-agro-600 text-white font-medium hover:bg-agro-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
