import React, { useState, useEffect } from 'react';
import { Users, Shield, RefreshCw } from 'lucide-react';
import { getUsersAdmin, updateUserRole, type AdminUserRow } from '@/services/adminService';

const AdminUsersManagement: React.FC = () => {
    const [users, setUsers] = useState<AdminUserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getUsersAdmin();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar usuários.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            setUpdatingId(userId);
            await updateUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setMessage({ type: 'success', text: 'Permissão atualizada.' });
            setTimeout(() => setMessage(null), 2000);
        } catch (error) {
            console.error('Error updating role:', error);
            setMessage({ type: 'error', text: 'Erro ao atualizar permissão.' });
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-stone-100">
                        <Users size={24} className="text-stone-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-stone-800">Usuários</h2>
                        <p className="text-sm text-stone-500 mt-0.5">Gestão de utilizadores da loja e permissões</p>
                    </div>
                </div>
                <button
                    onClick={loadUsers}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-[13px] font-medium"
                >
                    <RefreshCw size={14} />
                    Atualizar
                </button>
            </div>

            {/* Feedback */}
            {message && (
                <div className={`px-3 py-2 rounded-lg text-[13px] ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500 mb-2"></div>
                        <p className="text-stone-400 text-[13px]">Carregando usuários...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-stone-100">
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Nome</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Email</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Data de Cadastro</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Permissão (Role)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-stone-400 text-[13px]">
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                ) : users.map(user => (
                                    <tr key={user.id} className="hover:bg-stone-25">
                                        <td className="px-4 py-3">
                                            <p className="text-[13px] font-medium text-stone-700">{user.name || 'Sem nome'}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[13px] text-stone-600">{user.email || '—'}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[12px] text-stone-400">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-stone-400" />
                                                <select
                                                    value={user.role || 'cliente'}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    disabled={updatingId === user.id}
                                                    className={`
                                                        px-2 py-1 bg-stone-50 border border-stone-200 rounded text-[12px] font-medium cursor-pointer text-stone-700
                                                        focus:ring-1 focus:ring-stone-300 focus:outline-none focus:bg-white
                                                        ${updatingId === user.id ? 'opacity-50' : ''}
                                                    `}
                                                >
                                                    <option value="cliente">Cliente</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="vendedor">Vendedor</option>
                                                    <option value="gerente">Gerente</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsersManagement;
