import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';

const PageFallback = (
  <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50" style={{ minHeight: '50vh', background: '#f9fafb' }}>
    <div className="w-10 h-10 border-2 border-agro-200 border-t-agro-600 rounded-full animate-spin" aria-hidden />
    <p className="text-gray-500 text-sm mt-3">A carregar...</p>
  </div>
);

const AdminGuard: React.FC = () => {
  const { loading, session, profile } = useAuth();

  if (loading) return PageFallback;
  if (!session) return <Navigate to={ROUTES.LOGIN} replace />;
  if (session && profile === null) return PageFallback;
  if (profile && profile.role !== 'admin' && profile.role !== 'gerente') return <Navigate to={ROUTES.LOGIN} replace />;

  return <Outlet />;
};

export default AdminGuard;
