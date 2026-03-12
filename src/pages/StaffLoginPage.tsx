import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useStore } from '@/contexts/StoreContext';
import { ROUTES } from '@/constants/routes';
import { LayoutDashboard } from 'lucide-react';

const StaffLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      const role = (prof as { role?: string } | null)?.role;
      if (role === 'admin' || role === 'gerente' || role === 'vendedor') {
        navigate(ROUTES.ADMIN, { replace: true });
        return;
      }
      await supabase.auth.signOut();
      setError('Acesso restrito a colaboradores (admin, gerente ou vendedor).');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / marca */}
        <div className="flex flex-col items-center mb-8">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings?.storeName || 'Logo'}
              className="w-14 h-14 rounded-xl object-cover mb-3"
            />
          ) : (
            <div className="w-14 h-14 bg-stone-800 rounded-xl flex items-center justify-center text-white mb-3">
              <LayoutDashboard size={28} />
            </div>
          )}
          <h1 className="text-stone-800 font-semibold text-lg">
            {settings?.storeName || 'Painel'}
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">Acesso ao painel</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="staff-login-email"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                E-mail
              </label>
              <input
                id="staff-login-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="staff-login-password"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Senha
              </label>
              <input
                id="staff-login-password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 text-sm"
              />
            </div>
            <div className="flex flex-col gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <Link
                to={ROUTES.LOGIN}
                className="text-center text-xs text-stone-500 hover:text-stone-700"
              >
                Esqueci a senha
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          É cliente?{' '}
          <Link to={ROUTES.HOME} className="text-stone-600 hover:underline">
            Ir para a loja
          </Link>
        </p>
      </div>
    </div>
  );
};

export default StaffLoginPage;
