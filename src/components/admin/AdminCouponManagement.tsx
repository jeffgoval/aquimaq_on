import React, { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2, X, Save, ToggleLeft, ToggleRight, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { formatCurrency } from '@/utils/format';
import type { Coupon } from '@/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn } from '@/utils/cn';

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

const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">{label}</label>
        {children}
    </div>
);

const AdminCouponManagement: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Coupon | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [formData, setFormData] = useState<CouponForm>(emptyForm());

    useEffect(() => { loadCoupons(); }, []);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setCoupons((data ?? []) as Coupon[]);
        } catch {
            showMessage('error', 'Erro ao carregar cupons.');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const openCreate = () => { setFormData(emptyForm()); setEditing(null); setIsCreating(true); };

    const openEdit = (coupon: Coupon) => {
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_purchase_amount: coupon.min_purchase_amount,
            max_uses: coupon.max_uses,
            expiration_date: coupon.expiration_date ? coupon.expiration_date.slice(0, 10) : null,
            active: coupon.active,
        });
        setEditing(coupon);
        setIsCreating(false);
    };

    const closeForm = () => { setEditing(null); setIsCreating(false); };

    const handleSave = async () => {
        if (!formData.code.trim()) { showMessage('error', 'O código do cupom é obrigatório.'); return; }
        if (formData.discount_value <= 0) { showMessage('error', 'O valor do desconto deve ser maior que zero.'); return; }
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
                const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id);
                if (error) throw error;
                showMessage('success', 'Cupom atualizado.');
            } else {
                const { error } = await supabase.from('coupons').insert(payload);
                if (error) throw error;
                showMessage('success', 'Cupom criado.');
            }
            await loadCoupons();
            closeForm();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao salvar cupom.';
            showMessage('error', msg.includes('duplicate') ? 'Este código já existe.' : msg);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (coupon: Coupon) => {
        try {
            const { error } = await supabase.from('coupons').update({ active: !coupon.active }).eq('id', coupon.id);
            if (error) throw error;
            setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c));
        } catch {
            showMessage('error', 'Erro ao alterar status do cupom.');
        }
    };

    const doDelete = async (id: string) => {
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
        <>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-stone-800">Cupons de Desconto</h1>
                    <p className="text-xs text-stone-500 mt-0.5">Crie e gerencie códigos promocionais para os clientes.</p>
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
                    {!isFormOpen && (
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Plus size={15} /> Novo Cupom
                        </button>
                    )}
                </div>
            </div>

            {/* Form */}
            {isFormOpen && (
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-stone-800">
                            {editing ? 'Editar Cupom' : 'Novo Cupom'}
                        </h2>
                        <button onClick={closeForm} className="text-stone-400 hover:text-stone-600 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Código *">
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                    placeholder="Ex: VERAO20"
                                    className={cn(inputCls, 'uppercase font-mono')}
                                />
                            </Field>
                            <Field label="Tipo de desconto *">
                                <select
                                    value={formData.discount_type}
                                    onChange={e => setFormData(p => ({ ...p, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                                    className={inputCls}
                                >
                                    <option value="percentage">Percentual (%)</option>
                                    <option value="fixed">Valor fixo (R$)</option>
                                </select>
                            </Field>
                            <Field label={`Valor do desconto * ${formData.discount_type === 'percentage' ? '(%)' : '(R$)'}`}>
                                <input
                                    type="number"
                                    min={0.01}
                                    step={formData.discount_type === 'percentage' ? 1 : 0.01}
                                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                                    value={formData.discount_value}
                                    onChange={e => setFormData(p => ({ ...p, discount_value: parseFloat(e.target.value) || 0 }))}
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Compra mínima (R$)">
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={formData.min_purchase_amount}
                                    onChange={e => setFormData(p => ({ ...p, min_purchase_amount: parseFloat(e.target.value) || 0 }))}
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Usos máximos (vazio = ilimitado)">
                                <input
                                    type="number"
                                    min={1}
                                    value={formData.max_uses ?? ''}
                                    onChange={e => setFormData(p => ({ ...p, max_uses: e.target.value ? parseInt(e.target.value) : null }))}
                                    placeholder="Ilimitado"
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Data de expiração">
                                <input
                                    type="date"
                                    value={formData.expiration_date ?? ''}
                                    onChange={e => setFormData(p => ({ ...p, expiration_date: e.target.value || null }))}
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={e => setFormData(p => ({ ...p, active: e.target.checked }))}
                                className="w-4 h-4 accent-stone-700"
                            />
                            <span className="text-sm text-stone-700">Cupom ativo</span>
                        </label>
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Save size={14} /> {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                                onClick={closeForm}
                                className="px-4 py-2 border border-stone-200 text-stone-600 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="py-14 flex flex-col items-center gap-3 text-stone-400">
                        <Tag size={28} className="text-stone-200" />
                        <p className="text-sm">Nenhum cupom cadastrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-stone-100">
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Código</th>
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Desconto</th>
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400 hidden sm:table-cell">Mín.</th>
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400 hidden md:table-cell">Usos</th>
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400 hidden lg:table-cell">Validade</th>
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400 text-center">Status</th>
                                    <th className="px-4 py-3 text-xs font-medium text-stone-400 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {coupons.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-mono font-semibold text-stone-800 text-xs bg-stone-100 px-2 py-0.5 rounded">
                                                {coupon.code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-stone-700">
                                            {coupon.discount_type === 'percentage'
                                                ? `${coupon.discount_value}%`
                                                : formatCurrency(coupon.discount_value)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-stone-500 hidden sm:table-cell">
                                            {coupon.min_purchase_amount > 0 ? formatCurrency(coupon.min_purchase_amount) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-stone-500 hidden md:table-cell">
                                            {coupon.used_count}{coupon.max_uses !== null ? ` / ${coupon.max_uses}` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-stone-500 hidden lg:table-cell">
                                            {coupon.expiration_date
                                                ? new Date(coupon.expiration_date).toLocaleDateString('pt-BR')
                                                : 'Sem expiração'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleActive(coupon)}
                                                title={coupon.active ? 'Desativar' : 'Ativar'}
                                                className={cn(
                                                    'transition-colors',
                                                    coupon.active ? 'text-emerald-600 hover:text-emerald-700' : 'text-stone-300 hover:text-stone-500'
                                                )}
                                            >
                                                {coupon.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(coupon)}
                                                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(coupon.id)}
                                                    disabled={deletingId === coupon.id}
                                                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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

        <ConfirmDialog
            open={!!confirmDeleteId}
            title="Excluir cupom"
            description="Tem certeza que deseja excluir este cupom? Essa ação não pode ser desfeita."
            confirmLabel="Excluir"
            onCancel={() => setConfirmDeleteId(null)}
            onConfirm={() => { if (confirmDeleteId) doDelete(confirmDeleteId); setConfirmDeleteId(null); }}
        />
        </>
    );
};

export default AdminCouponManagement;
