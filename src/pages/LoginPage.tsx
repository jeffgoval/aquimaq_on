import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { Helmet } from 'react-helmet-async';

const LoginPage: React.FC = () => {
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  useEffect(() => {
    if (!pendingRedirect || !profile) return;
    if (redirectTo && redirectTo.startsWith('/')) {
      navigate(redirectTo, { replace: true });
    } else if (profile.role === 'admin' || profile.role === 'gerente') {
      navigate(ROUTES.ADMIN, { replace: true });
    } else {
      navigate(ROUTES.HOME, { replace: true });
    }
    setPendingRedirect(false);
  }, [pendingRedirect, profile, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPendingRedirect(true);
  };

  return (
    <>
      <Helmet>
        <title>Entrar | Aquimaq</title>
        <meta name="description" content="Entre na sua conta Aquimaq." />
      </Helmet>
      <main id="main-content" className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Entrar</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Palavra-passe
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
            />
          </div>
          <div className="flex justify-end">
            <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-agro-600 hover:underline">
              Esqueci a palavra-passe
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-agro-600 text-white font-medium rounded-lg hover:bg-agro-700 focus:ring-2 focus:ring-agro-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Ainda não tem conta?{' '}
          <Link to={ROUTES.REGISTER} className="text-agro-600 font-medium hover:underline">
            Registar
          </Link>
        </p>
      </main>
    </>
  );
};

export default LoginPage;
