import React from 'react';
import { Users } from 'lucide-react';

const AdminUsersManagement: React.FC = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-stone-100">
                    <Users size={24} className="text-stone-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-stone-900">Usuários</h2>
                    <p className="text-sm text-stone-500">Gestão de utilizadores da loja</p>
                </div>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-stone-500">
                Área de gestão de usuários. Pode ser expandida com listagem, roles e edição.
            </div>
        </div>
    );
};

export default AdminUsersManagement;
