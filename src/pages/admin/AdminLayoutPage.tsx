import React, { useMemo } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import AdminLayout, { AdminView } from '@/components/admin/AdminLayout';
import { ROUTES } from '@/constants/routes';
import { ADMIN_VIEW_TO_PATH } from '@/components/admin/AdminLayout';

const AdminLayoutPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeView: AdminView = useMemo(() => {
        const path = location.pathname;
        if (path.includes(ROUTES.ADMIN_ORDERS)) return 'ORDERS';
        if (path.includes(ROUTES.ADMIN_PRODUCTS)) return 'PRODUCTS';
        if (path.includes(ROUTES.ADMIN_BANNERS)) return 'BANNERS';
        if (path.includes(ROUTES.ADMIN_USERS)) return 'USERS';
        if (path.includes(ROUTES.ADMIN_ANALYTICS)) return 'ANALYTICS';
        if (path.includes(ROUTES.ADMIN_SETTINGS)) return 'SETTINGS';
        return 'DASHBOARD';
    }, [location.pathname]);

    const handleNavigate = (view: AdminView) => {
        navigate(ADMIN_VIEW_TO_PATH[view]);
    };

    return (
        <AdminLayout
            activeView={activeView}
            onNavigate={handleNavigate}
        >
            <Outlet />
        </AdminLayout>
    );
};

export default AdminLayoutPage;
