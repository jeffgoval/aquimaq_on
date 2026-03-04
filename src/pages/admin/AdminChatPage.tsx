import React from 'react';
import { MessageSquare } from 'lucide-react';
import AdminChatPanel from '@/components/admin/AdminChatPanel';

const AdminChatPage: React.FC = () => {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2">
          <MessageSquare className="text-stone-400" size={24} />
          Atendimento Omnichannel
        </h1>
        <p className="text-xs text-stone-400">Atendimento web e WhatsApp com handoff entre vendedores.</p>
      </div>

      <div className="flex-1 min-h-0">
        <AdminChatPanel />
      </div>
    </div>
  );
};

export default AdminChatPage;
