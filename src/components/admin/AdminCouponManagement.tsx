import React, { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2, X, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { formatCurrency } from '@/utils/format';
import type { Coupon } from '@/types';

type CouponForm = Omit<Coupon, 'id' | 'used_count'>;

const emptyForm = (): CouponForm => ({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase_amount: 0,
    max_uses: null,
    expiration_date: null,
    active: true,
});

const AdminCouponManagement: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Coupon | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [formData, setFormData] = useState<CouponForm>(emptyForm());

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setCoupons((data ?? []) as Coupon[]);
        } catch (err) {
            showMessage('error', 'Erro ao carregar cupons.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const openCreate = () => {
        setFormData(emptyForm());
        setEditing(null);
        setIsCreating(true);
    };

    const openEdit = (coupon: Coupon) => {
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_purchase_amount: coupon.min_purchase_amount,
            max_uses: coupon.max_uses,
            expiration_date: coupon.expiration_date
                ? coupon.expiration_date.slice(0, 10)
                : null,
            active: coupon.active,
        });
        setEditing(coupon);
        setIsCreating(false);
    };

    const closeForm = () => {
        setEditing(null);
        setIsCreating(false);
    };

    const handleSave = async () => {
        if (!formData.code.trim()) {
            showMessage('error', 'O código do cupom é obrigatório.');
            return;
        }
        if (formData.discount_value <= 0) {
            showMessage('error', 'O valor do desconto deve ser maior que zero.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                code: formData.code.trim().toUpperCase(),
                discount_type: formData.discount_type,
                discount_value: formData.discount_value,
                min_purchase_amount: formData.min_purchase_amount ?? 0,
                max_uses: formData.max_uses ?? null,
                expiration_date: formData.expiration_date
                    ? new Date(formData.expiration_date + 'T23:59:59').toISOString()
                    : null,
                active: formData.active,
            };

            if (editing) {
                const { error } = await supabase
                    .from('coupons')
                    .update(payload)
                    .eq('id', editing.id);
                if (error) throw error;
                showMessage('success', 'Cupom atualizado com sucesso.');
            } else {
                const { error } = await supabase
                    .from('coupons')
                    .insert(payload);
                if (error) throw error;
                showMessage('success', 'Cupom criado com sucesso.');
            }

            await loadCoupons();
            closeForm();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao salvar cupom.';
            showMessage('error', msg.includes('duplicate') ? 'Este código de cupom já existe.' : msg);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (coupon: Coupon) => {
        try {
            const { error } = await supabase
                .from('coupons')
                .update({ active: !coupon.active })
                .eq('id', coupon.id);
            if (error) throw error;
            setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c));
        } catch {
            showMessage('error', 'Erro ao alterar status do cupom.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este cupom?')) return;
        setDeletingId(id);
        try {
            const { error } = await supabase.from('coupons').delete().eq('id', id);
            if (error) throw error;
            setCoupons(prev => prev.filter(c => c.id !== id));
            showMessage('success', 'Cupom excluído.');
        } catch {
            showMessage('error', 'Erro ao excluir cupom.');
        } finally {
            setDeletingId(null);
        }
    };

    const isFormOpen = isCreating || !!editing;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Tag size={20} className="text-agro-700" />
                    <h1 className="text-xl font-bold text-gray-900">Cupons de Desconto</h1>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-agro-600 hover:bg-agro-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    <Plus size={16} /> Novo Cupom
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Form */}
            {isFormOpen && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">
                            {editing ? 'Editar Cupom' : 'Novo Cupom'}
                        </h2>
                        <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Código *</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                placeholder="Ex: VERÃO20"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agro-400 uppercase font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Desconto *</label>
                            <select
                                value={formData.discount_type}
                                onChange={e => setFormData(p => ({ ...p, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agro-400"
                            >
                                <option value="percentage">Percentual (%)</option>
                                <option value="fixed">Valor fixo (R$)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Valor do Desconto * {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
                            </label>
                            <input
                                type="number"
                                min={0.01}
                                step={formData.discount_type === 'percentage' ? 1 : 0.01}
                                max={formData.discount_type === 'percentage' ? 100 : undefined}
                                value={formData.discount_value}
                                onChange={e => setFormData(p => ({ ...p, discount_value: parseFloat(e.target.value) || 0 }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agro-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Compra Mínima (R$)</label>
                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={formData.min_purchase_amount}
                                onChange={e => setFormData(p => ({ ...p, min_purchase_amount: parseFloat(e.target.value) || 0 }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agro-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Usos Máximos (vazio = ilimitado)</label>
                            <input
                                type="number"
                                min={1}
                                value={formData.max_uses ?? ''}
                                onChange={e => setFormData(p => ({ ...p, max_uses: e.target.value ? parseInt(e.target.value) : null }))}
                                placeholder="Ilimitado"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agro-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Data de Expiração</label>
                            <input
                                type="date"
                                value={formData.expiration_date ?? ''}
                                onChange={e => setFormData(p => ({ ...p, expiration_date: e.target.value || null }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agro-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={e => setFormData(p => ({ ...p, active: e.target.checked }))}
                                className="w-4 h-4 accent-agro-600"
                            />
                            <span className="text-sm text-gray-700">Cupom ativo</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-agro-600 hover:bg-agro-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:bg-gray-300"
                        >
                            <Save size={15} /> {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                            onClick={closeForm}
                            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando cupons...</div>
                ) : coupons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                        <Tag size={32} className="text-gray-200" />
                        <p className="text-sm">Nenhum cupom cadastrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Desconto</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Mín.</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Usos</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Validade</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {coupons.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-mono font-bold text-gray-900 text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                {coupon.code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-agro-700">
                                            {coupon.discount_type === 'percentage'
                                                ? `${coupon.discount_value}%`
                                                : formatCurrency(coupon.discount_value)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                                            {coupon.min_purchase_amount > 0
                                                ? formatCurrency(coupon.min_purchase_amount)
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                                            {coupon.used_count}
                                            {coupon.max_uses !== null ? ` / ${coupon.max_uses}` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">
                                            {coupon.expiration_date
                                                ? new Date(coupon.expiration_date).toLocaleDateString('pt-BR')
                                                : 'Sem expiração'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleActive(coupon)}
                                                title={coupon.active ? 'Desativar' : 'Ativar'}
                                                className={`transition-colors ${coupon.active ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-300 hover:text-gray-500'}`}
                                            >
                                                {coupon.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(coupon)}
                                                    className="p-1.5 text-gray-400 hover:text-agro-600 hover:bg-agro-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    disabled={deletingId === coupon.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
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

export default AdminCouponManagement;
