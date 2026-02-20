import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { AdminView, ADMIN_VIEW_TO_PATH } from '@/components/admin/AdminLayout';

const AdminDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const handleNavigate = (view: AdminView) => navigate(ADMIN_VIEW_TO_PATH[view]);
    return <AdminDashboard onNavigate={handleNavigate} />;
};

export default AdminDashboardPage;

