import React, { useState, useEffect } from 'react';
import { Users, Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getUsersAdmin, updateUserRole, type AdminUserRow } from '@/services/adminService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

const ROLE_LABELS: Record<string, string> = {
    cliente: 'Cliente',
    vendedor: 'Vendedor',
    gerente: 'Gerente',
    admin: 'Admin',
};

const ROLE_STYLES: Record<string, string> = {
    admin: 'bg-violet-50 text-violet-700 border-violet-200',
    gerente: 'bg-blue-50 text-blue-700 border-blue-200',
    vendedor: 'bg-amber-50 text-amber-700 border-amber-200',
    cliente: 'bg-stone-50 text-stone-600 border-stone-200',
};

const AdminUsersManagement: React.FC = () => {
    const { isAdmin, isGerente, user: currentUser } = useAuth();
    const [users, setUsers] = useState<AdminUserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getUsersAdmin();
            setUsers(isAdmin ? data : data.filter(u => u.role !== 'admin'));
        } catch {
            showMessage('error', 'Erro ao carregar usuários.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (isGerente && !isAdmin) {
            const target = users.find(u => u.id === userId);
            if (target?.role === 'admin' || newRole === 'admin') {
                showMessage('error', 'Gerentes não podem gerenciar contas de Administrador.');
                return;
            }
        }
        try {
            setUpdatingId(userId);
            await updateUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showMessage('success', 'Permissão atualizada.');
        } catch {
            showMessage('error', 'Erro ao atualizar permissão.');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-stone-800">Usuários</h1>
                    <p className="text-xs text-stone-500 mt-0.5">Gerencie permissões de acesso ao painel administrativo.</p>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <span className={cn(
                            'flex items-center gap-1.5 text-xs font-medium',
                            message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                        )}>
                            {message.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                            {message.text}
                        </span>
                    )}
                    <button
                        onClick={loadUsers}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-stone-100">
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Nome</th>
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400">E-mail</th>
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Cadastro</th>
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Permissão</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-stone-400">
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                ) : users.map(user => {
                                    const isLocked = !isAdmin && (user.role === 'admin' || user.id === currentUser?.id);
                                    const isSelf = user.id === currentUser?.id;
                                    return (
                                        <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-stone-700">
                                                    {user.name || 'Sem nome'}
                                                    {isSelf && <span className="ml-1.5 text-xs text-stone-400">(você)</span>}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-stone-500">
                                                {user.email || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-stone-400">
                                                {user.created_at
                                                    ? new Date(user.created_at).toLocaleDateString('pt-BR')
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {isLocked ? (
                                                        <span className={cn(
                                                            'flex items-center gap-1 text-xs border rounded-full px-2.5 py-0.5 font-medium',
                                                            ROLE_STYLES[user.role] ?? ROLE_STYLES.cliente
                                                        )}>
                                                            <Shield size={10} />
                                                            {ROLE_LABELS[user.role] ?? user.role}
                                                        </span>
                                                    ) : (
                                                        <select
                                                            value={user.role || 'cliente'}
                                                            onChange={e => handleRoleChange(user.id, e.target.value)}
                                                            disabled={updatingId === user.id}
                                                            className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:opacity-50 transition-colors"
                                                        >
                                                            <option value="cliente">Cliente</option>
                                                            <option value="vendedor">Vendedor</option>
                                                            <option value="gerente">Gerente</option>
                                                            {(isAdmin || user.role === 'admin') && (
                                                                <option value="admin">Admin</option>
                                                            )}
                                                        </select>
                                                    )}
                                                    {updatingId === user.id && (
                                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-stone-200 border-t-stone-500" />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsersManagement;
