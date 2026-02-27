import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/database';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, profile, loading, refreshProfile } = useAuth();
    const location = useLocation();
    const [refreshing, setRefreshing] = useState(false);
    const [didRefresh, setDidRefresh] = useState(false);

    const hasAccess = !allowedRoles || (!!profile && allowedRoles.includes(profile.role));

    // If user is logged in but role doesn't match, try refreshing profile once.
    // This handles the case where an admin just changed the user's role externally.
    useEffect(() => {
        if (!loading && user && !hasAccess && !didRefresh && !refreshing) {
            setRefreshing(true);
            refreshProfile().finally(() => {
                setRefreshing(false);
                setDidRefresh(true);
            });
        }
    }, [loading, user, hasAccess, didRefresh, refreshing, refreshProfile]);

    if (loading || refreshing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-2 border-agro-200 border-t-agro-600 rounded-full animate-spin" aria-hidden />
                <p className="text-gray-500 text-sm mt-3">Verificando permissões...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    if (!hasAccess) {
        return <Navigate to={ROUTES.HOME} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
