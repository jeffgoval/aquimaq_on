import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import UserProfile from '@/components/UserProfile';
import { Helmet } from 'react-helmet-async';
import type { Cliente } from '@/types';
import type { ProfileRow } from '@/types/database';
import { updateProfile } from '@/services/profileService';

function profileToCliente(profile: ProfileRow, emailFromAuth?: string | null): Cliente {
  return {
    id: profile.id,
    name: profile.full_name || profile.name || 'Utilizador',
    phone: profile.phone || '',
    document: profile.document_number || '',
    stateRegistration: profile.state_registration ?? undefined,
    email: profile.email || emailFromAuth || undefined,
    avatar_url: profile.avatar_url ?? undefined,
    role: profile.role,
    address: profile.cep
      ? {
          zip: profile.cep,
          street: profile.address || '',
          number: profile.address_number || '',
          complement: profile.address_complement ?? undefined,
          district: profile.neighborhood || '',
          city: profile.city || '',
          state: profile.state || '',
        }
      : undefined,
  };
}

function clienteToProfileUpdate(c: Cliente): Partial<ProfileRow> {
  return {
    full_name: c.name || null,
    name: c.name || null,
    email: c.email || null,
    phone: c.phone || null,
    document_number: c.document || null,
    state_registration: c.stateRegistration || null,
    avatar_url: c.avatar_url || null,
    cep: c.address?.zip || null,
    address: c.address?.street || null,
    address_number: c.address?.number || null,
    address_complement: c.address?.complement || null,
    neighborhood: c.address?.district || null,
    city: c.address?.city || null,
    state: c.address?.state || null,
  };
}

const ProfilePage: React.FC = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();

  const cliente = useMemo(() => {
    if (!profile || !user) return null;
    return profileToCliente(profile, user.email);
  }, [profile, user]);

  const handleUpdateUser = async (updatedUser: Cliente) => {
    if (!user) return;
    const payload = clienteToProfileUpdate(updatedUser);
    await updateProfile(user.id, payload);
    await refreshProfile();
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-2 border-agro-200 border-t-agro-600 rounded-full animate-spin" aria-hidden />
        <p className="text-gray-500 text-sm mt-3">A carregar...</p>
      </div>
    );
  }

  if (!user || !profile || !cliente) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <>
      <Helmet>
        <title>Minha Conta | Aquimaq</title>
        <meta name="description" content="Gerencie seus dados pessoais e preferências." />
      </Helmet>
      <UserProfile user={cliente} onUpdateUser={handleUpdateUser} onLogout={() => signOut()} />
    </>
  );
};

export default ProfilePage;
