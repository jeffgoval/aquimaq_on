import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { Helmet } from 'react-helmet-async';

const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/atualizar-password` : '';

const ForgotPasswordPage: React.FC = () => {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await resetPasswordForEmail(email, redirectTo);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <>
        <Helmet>
          <title>Recuperar palavra-passe | Aquimaq</title>
        </Helmet>
        <main id="main-content" className="max-w-md mx-auto px-4 py-12">
          <div className="p-4 rounded-lg bg-green-50 text-green-800">
            <p className="font-medium">Email enviado</p>
            <p className="text-sm mt-1">
              Se existir uma conta com esse email, receberá um link para redefinir a palavra-passe.
            </p>
          </div>
          <p className="mt-6 text-center text-gray-600 text-sm">
            <Link to={ROUTES.LOGIN} className="text-agro-600 font-medium hover:underline">
              Voltar a entrar
            </Link>
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Recuperar palavra-passe | Aquimaq</title>
        <meta name="description" content="Recupere a sua palavra-passe Aquimaq." />
      </Helmet>
      <main id="main-content" className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Recuperar palavra-passe</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-agro-600 text-white font-medium rounded-lg hover:bg-agro-700 focus:ring-2 focus:ring-agro-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'A enviar...' : 'Enviar link de recuperação'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          <Link to={ROUTES.LOGIN} className="text-agro-600 font-medium hover:underline">
            Voltar a entrar
          </Link>
        </p>
      </main>
    </>
  );
};

export default ForgotPasswordPage;
