import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/database';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-2 border-agro-200 border-t-agro-600 rounded-full animate-spin" aria-hidden />
                <p className="text-gray-500 text-sm mt-3">Verificando permissões...</p>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    // Role check if required
    if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
        // If user is logged in but doesn't have the role, redirect to home or a specific unauthorized page
        // For now, redirect to HOME
        return <Navigate to={ROUTES.HOME} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
