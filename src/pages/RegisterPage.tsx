import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : '';

const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signUp({ email, password, redirectTo });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <>
        <Helmet>
          <title>Registo | Aquimaq</title>
        </Helmet>
        <main id="main-content" className="max-w-md mx-auto px-4 py-12">
          <div className="p-4 rounded-lg bg-green-50 text-green-800">
            <p className="font-medium">Conta criada</p>
            <p className="text-sm mt-1">
              Se a confirmação de email estiver ativa, verifique a sua caixa de entrada e clique no link para confirmar.
            </p>
          </div>
          <p className="mt-6 text-center text-gray-600 text-sm">
            <Link to="/login" className="text-agro-600 font-medium hover:underline">
              Ir para entrar
            </Link>
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Registar | Aquimaq</title>
        <meta name="description" content="Crie a sua conta Aquimaq." />
      </Helmet>
      <main id="main-content" className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Registar</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
              Palavra-passe
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres.</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-agro-600 text-white font-medium rounded-lg hover:bg-agro-700 focus:ring-2 focus:ring-agro-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'A criar conta...' : 'Registar'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Já tem conta?{' '}
          <Link to="/login" className="text-agro-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </main>
    </>
  );
};

export default RegisterPage;
