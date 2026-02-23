import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { User, Mail, Camera, Bell } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { uploadAvatar } from '@/services/imageUtils';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';

const MAX_AVATAR_SIZE_MB = 3;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }
    if (user) {
      const metaName = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;
      const metaAvatar = user.user_metadata?.avatar_url as string | undefined;
      setFullName(metaName ?? '');
      setAvatarUrl(metaAvatar ?? '');
      setEmailNotifications((user.user_metadata?.preferences?.email_notifications as boolean) ?? true);
      supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.name) setFullName(data.name);
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    }
  }, [user, authLoading, navigate]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      setError('Escolha uma imagem (JPG, PNG ou WebP).');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      setError(`A foto deve ter no máximo ${MAX_AVATAR_SIZE_MB} MB.`);
      return;
    }
    setError(null);
    setUploadingPhoto(true);
    const { url, error: uploadErr } = await uploadAvatar(file, user.id);
    setUploadingPhoto(false);
    e.target.value = '';
    if (uploadErr) {
      setError(uploadErr);
      return;
    }
    setAvatarUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const name = fullName.trim() || undefined;
    const { error: errAuth } = await supabase.auth.updateUser({
      data: {
        full_name: name,
        avatar_url: avatarUrl || undefined,
        preferences: {
          ...((user.user_metadata?.preferences as object) ?? {}),
          email_notifications: emailNotifications,
        },
      },
    });
    if (errAuth) {
      setSaving(false);
      setError(errAuth.message);
      return;
    }
    const { error: errProfile } = await supabase
      .from('profiles')
      .update({
        name: name ?? null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setSaving(false);
    if (errProfile) {
      setError(errProfile.message);
      return;
    }
    setSuccess(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
        <div className="w-10 h-10 border-2 border-agro-200 border-t-agro-600 rounded-full animate-spin" aria-hidden />
        <p className="text-slate-600 mt-4">Carregando...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Helmet>
        <title>Minha conta | Aquimaq</title>
        <meta name="description" content="Edite seu perfil e preferências." />
      </Helmet>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Minha conta</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-agro-50 text-agro-700 text-sm" role="status">
          Alterações salvas com sucesso.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Perfil */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User size={20} />
            Perfil
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="account-name" className="block text-sm font-medium text-slate-700 mb-1">
                Nome completo
              </label>
              <input
                id="account-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-agro-500 focus:outline-none focus:ring-2 focus:ring-agro-500/20"
              />
            </div>
            <div>
              <label htmlFor="account-email" className="block text-sm font-medium text-slate-700 mb-1">
                E-mail
              </label>
              <input
                id="account-email"
                type="email"
                value={user.email ?? ''}
                readOnly
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600"
              />
              <p className="text-xs text-slate-500 mt-1">Para alterar o e-mail, entre em contato com o suporte.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sua foto
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-300 flex-shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Sua foto"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : (
                    <User size={36} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    onChange={handlePhotoChange}
                    className="sr-only"
                    aria-label="Escolher foto"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60 transition-colors"
                  >
                    <Camera size={18} />
                    {uploadingPhoto ? 'Enviando...' : 'Escolher foto'}
                  </button>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG ou WebP. Máx. {MAX_AVATAR_SIZE_MB} MB.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Preferências */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Bell size={20} />
            Preferências
          </h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-agro-600 focus:ring-agro-500"
            />
            <span className="text-slate-700">Receber e-mails sobre ofertas e novidades</span>
          </label>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-agro-600 text-white font-medium hover:bg-agro-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountPage;
