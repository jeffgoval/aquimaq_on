import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { User, Camera, Bell, MapPin, Pencil, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { uploadAvatar } from '@/services/imageUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { ROUTES } from '@/constants/routes';
import AddressEditModal from '@/features/cart/components/AddressEditModal';
import type { ProfileRow } from '@/types/database';

const MAX_AVATAR_SIZE_MB = 3;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

const isAddressComplete = (p: ProfileRow | null): boolean =>
    !!(p?.street && p?.number && p?.city && p?.state);

const AccountPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, profile, refreshProfile } = useAuth();
    const { settings } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);

    const storeName = settings?.storeName || 'Aquimaq';

    // Redirect if unauthenticated
    useEffect(() => {
        if (!authLoading && !user) navigate(ROUTES.LOGIN, { replace: true });
    }, [user, authLoading, navigate]);

    // Populate form from auth metadata + profiles table
    useEffect(() => {
        if (!user) return;
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
                const row = data as any;
                if (row?.name) setFullName(row.name);
                if (row?.avatar_url) setAvatarUrl(row.avatar_url);
            });
    }, [user]);

    // Auto-dismiss success banner
    useEffect(() => {
        if (!success) return;
        const t = setTimeout(() => setSuccess(false), 3000);
        return () => clearTimeout(t);
    }, [success]);

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
        if (uploadErr) { setError(uploadErr); return; }
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
        if (errAuth) { setSaving(false); setError(errAuth.message); return; }
        const { error: errProfile } = await supabase
            .from('profiles')
            .update({ name: name ?? null, avatar_url: avatarUrl || null, updated_at: new Date().toISOString() } as any)
            .eq('id', user.id);
        setSaving(false);
        if (errProfile) { setError(errProfile.message); return; }
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

    const hasAddress = isAddressComplete(profile);

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <Helmet>
                <title>Minha conta | {storeName}</title>
                <meta name="description" content="Edite seu perfil e preferências." />
            </Helmet>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Minha conta</h1>
                <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 rounded-lg bg-agro-50 text-agro-700 text-sm flex items-center gap-2" role="status">
                    <span className="w-1.5 h-1.5 rounded-full bg-agro-500 shrink-0" />
                    Alterações salvas com sucesso.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ── Perfil ── */}
                <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
                        <User size={18} className="text-agro-600" />
                        Perfil
                    </h2>

                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-5">
                        <div className="relative w-20 h-20 shrink-0">
                            <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-300 flex items-center justify-center">
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
                            {/* Upload overlay */}
                            {uploadingPhoto && (
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                    <Loader2 size={22} className="text-white animate-spin" />
                                </div>
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
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60 transition-colors text-sm font-medium"
                            >
                                <Camera size={16} />
                                {uploadingPhoto ? 'Enviando...' : 'Alterar foto'}
                            </button>
                            <p className="text-xs text-slate-400 mt-1.5">JPG, PNG ou WebP · Máx. {MAX_AVATAR_SIZE_MB} MB</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Nome */}
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

                        {/* Email */}
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
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-400 mt-1">Para alterar o e-mail, entre em contato com o suporte.</p>
                        </div>

                        {/* Notificações */}
                        <label className="flex items-center gap-3 cursor-pointer pt-1">
                            <input
                                type="checkbox"
                                checked={emailNotifications}
                                onChange={(e) => setEmailNotifications(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-agro-600 focus:ring-agro-500"
                            />
                            <span className="text-sm text-slate-700 flex items-center gap-1.5">
                                <Bell size={14} className="text-slate-400" />
                                Receber e-mails sobre ofertas e novidades
                            </span>
                        </label>
                    </div>
                </section>

                {/* ── Endereço de Entrega ── */}
                <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <MapPin size={18} className="text-agro-600" />
                            Endereço de entrega
                        </h2>
                        <button
                            type="button"
                            onClick={() => setShowAddressModal(true)}
                            className="flex items-center gap-1.5 text-sm font-medium text-agro-600 hover:text-agro-700 transition-colors"
                        >
                            {hasAddress ? (
                                <><Pencil size={14} /> Editar</>
                            ) : (
                                <><Plus size={14} /> Adicionar</>
                            )}
                        </button>
                    </div>

                    {hasAddress && profile ? (
                        <div className="text-sm text-slate-700 space-y-0.5">
                            <p className="font-medium">{profile.street}, {profile.number}{profile.complement ? ` — ${profile.complement}` : ''}</p>
                            <p className="text-slate-500">{profile.neighborhood} · {profile.city} / {profile.state}</p>
                            <p className="text-slate-400 font-mono text-xs mt-1">{profile.zip_code}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center rounded-lg bg-slate-50 border border-dashed border-slate-200">
                            <MapPin size={28} className="text-slate-300 mb-2" />
                            <p className="text-sm text-slate-500 mb-3">Nenhum endereço cadastrado</p>
                            <button
                                type="button"
                                onClick={() => setShowAddressModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-agro-600 text-white text-sm font-medium rounded-lg hover:bg-agro-700 transition-colors"
                            >
                                <Plus size={15} />
                                Adicionar endereço
                            </button>
                        </div>
                    )}
                </section>

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 rounded-lg bg-agro-600 text-white font-medium hover:bg-agro-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        {saving ? 'Salvando...' : 'Salvar perfil'}
                    </button>
                </div>
            </form>

            {/* Address modal */}
            {showAddressModal && profile && (
                <AddressEditModal
                    user={{
                        ...profile,
                        address: {
                            street: profile.street || '',
                            number: profile.number || '',
                            complement: profile.complement || '',
                            district: profile.neighborhood || '',
                            city: profile.city || '',
                            state: profile.state || '',
                            zip: profile.zip_code || '',
                        },
                    }}
                    onClose={() => setShowAddressModal(false)}
                    onSave={async (updatedData) => {
                        const addr = updatedData.address!;
                        const { error: saveErr } = await supabase
                            .from('profiles')
                            .update({
                                street: addr.street,
                                number: addr.number,
                                complement: addr.complement,
                                neighborhood: addr.district,
                                city: addr.city,
                                state: addr.state,
                                zip_code: addr.zip,
                            } as any)
                            .eq('id', profile.id);
                        if (saveErr) throw saveErr;
                        await refreshProfile();
                        setShowAddressModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default AccountPage;
