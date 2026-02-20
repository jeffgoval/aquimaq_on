import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import StoreSettings from '@/components/StoreSettings';

const AdminSettingsPage: React.FC = () => {
    const navigate = useNavigate();

    return <StoreSettings onBack={() => navigate(ROUTES.ADMIN)} />;
};

export default AdminSettingsPage;

