import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminKnowledgeBase from '@/components/admin/AdminKnowledgeBase';

const AdminKnowledgeBasePage: React.FC = () => {
  return (
    <AdminLayout>
      <AdminKnowledgeBase />
    </AdminLayout>
  );
};

export default AdminKnowledgeBasePage;
