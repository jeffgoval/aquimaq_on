import React from 'react';
import { useNavigate } from 'react-router-dom';
import StoreSettings from '@/components/StoreSettings';

const AdminSettingsPage: React.FC = () => {
    const navigate = useNavigate();

    return <StoreSettings onBack={() => navigate('/admin')} />;
};

export default AdminSettingsPage;

