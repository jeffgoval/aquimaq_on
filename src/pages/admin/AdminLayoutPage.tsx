import React, { useMemo } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import AdminLayout, { AdminView } from '@/components/admin/AdminLayout';

const AdminLayoutPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeView: AdminView = useMemo(() => {
        const path = location.pathname;
        if (path.includes('/admin/pedidos')) return 'ORDERS';
        if (path.includes('/admin/produtos')) return 'PRODUCTS';
        if (path.includes('/admin/banners')) return 'BANNERS';
        if (path.includes('/admin/usuarios')) return 'USERS';
        if (path.includes('/admin/knowledge-base')) return 'KNOWLEDGE';
        if (path.includes('/admin/atendimento')) return 'SUPPORT';
        if (path.includes('/admin/ia-settings')) return 'AI_SETTINGS';
        if (path.includes('/admin/analytics')) return 'ANALYTICS';
        if (path.includes('/admin/configuracoes')) return 'SETTINGS';
        return 'DASHBOARD';
    }, [location.pathname]);

    const handleNavigate = (view: AdminView) => {
        switch (view) {
            case 'DASHBOARD': navigate('/admin'); break;
            case 'ORDERS': navigate('/admin/pedidos'); break;
            case 'PRODUCTS': navigate('/admin/produtos'); break;
            case 'BANNERS': navigate('/admin/banners'); break;
            case 'USERS': navigate('/admin/usuarios'); break;
            case 'KNOWLEDGE': navigate('/admin/knowledge-base'); break;
            case 'SUPPORT': navigate('/admin/atendimento'); break;
            case 'AI_SETTINGS': navigate('/admin/ia-settings'); break;
            case 'ANALYTICS': navigate('/admin/analytics'); break;
            case 'SETTINGS': navigate('/admin/configuracoes'); break;
        }
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
