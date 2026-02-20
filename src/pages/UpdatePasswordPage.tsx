import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { Helmet } from 'react-helmet-async';

const UpdatePasswordPage: React.FC = () => {
  const { updatePassword, isRecovery, clearRecovery } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('Mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    clearRecovery();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Nova palavra-passe | Aquimaq</title>
        <meta name="description" content="Defina a sua nova palavra-passe." />
      </Helmet>
      <main id="main-content" className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova palavra-passe</h1>
        {!isRecovery && (
          <p className="text-gray-600 text-sm mb-4">
            Aceda a esta página através do link enviado por email para redefinir a palavra-passe.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="update-password" className="block text-sm font-medium text-gray-700 mb-1">
              Nova palavra-passe
            </label>
            <input
              id="update-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
            />
          </div>
          <div>
            <label htmlFor="update-confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar palavra-passe
            </label>
            <input
              id="update-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-agro-600 text-white font-medium rounded-lg hover:bg-agro-700 focus:ring-2 focus:ring-agro-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'A guardar...' : 'Guardar palavra-passe'}
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

export default UpdatePasswordPage;
