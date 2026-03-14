import React, { useState, useEffect } from 'react';
import {
    Image as ImageIcon,
    Plus,
    GripVertical,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    X,
    Save,
    Calendar,
    Timer,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import {
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    type Banner,
} from '@/services/bannerService';
import { getStoreSettings, saveStoreSettings } from '@/services/storeSettingsService';
import ImageUploader from './ImageUploader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn } from '@/utils/cn';

const colorOptions = [
    { value: 'from-agro-900 to-agro-800', label: 'Verde Escuro' },
    { value: 'from-stone-900 to-stone-800', label: 'Cinza Escuro' },
    { value: 'from-blue-900 to-blue-800', label: 'Azul Escuro' },
    { value: 'from-amber-900 to-amber-800', label: 'Âmbar Escuro' },
    { value: 'from-violet-900 to-violet-800', label: 'Violeta Escuro' },
];

const SLIDE_INTERVAL_OPTIONS = [
    { value: 3000, label: '3 s' },
    { value: 5000, label: '5 s' },
    { value: 8000, label: '8 s' },
];

const inputCls = 'w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300';

const SectionCard: React.FC<{ title: string; description?: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
    title, description, icon, children
}) => (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                {icon}{title}
            </h3>
            {description && <p className="text-xs text-stone-500 mt-0.5">{description}</p>}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">{label}</label>
        {children}
    </div>
);

const AdminBannerManagement: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [draggedBannerId, setDraggedBannerId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [slideIntervalMs, setSlideIntervalMs] = useState(5000);
    const [savingInterval, setSavingInterval] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image_urls: [] as string[],
        cta_text: '',
        cta_link: '',
        color_gradient: 'from-agro-900 to-agro-800',
        is_active: true,
        starts_at: '',
        ends_at: '',
    });

    useEffect(() => { loadInitialData(); }, []);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [bannerData, storeSettings] = await Promise.all([getBanners(), getStoreSettings()]);
            setBanners(bannerData);
            setSlideIntervalMs(storeSettings?.bannerSlideIntervalMs ?? 5000);
        } catch {
            showMessage('error', 'Erro ao carregar banners.');
        } finally {
            setLoading(false);
        }
    };

    const loadBanners = async () => {
        try {
            setLoading(true);
            setBanners(await getBanners());
        } catch {
            showMessage('error', 'Erro ao carregar banners.');
        } finally {
            setLoading(false);
        }
    };

    const handleSlideIntervalChange = async (nextValue: number) => {
        setSlideIntervalMs(nextValue);
        setSavingInterval(true);
        const result = await saveStoreSettings({ bannerSlideIntervalMs: nextValue });
        setSavingInterval(false);
        if (result.success) {
            showMessage('success', 'Tempo de transição atualizado.');
        } else {
            showMessage('error', result.error || 'Erro ao salvar tempo de transição.');
        }
    };

    const resetForm = () => setFormData({
        title: '', subtitle: '', image_urls: [], cta_text: '', cta_link: '',
        color_gradient: 'from-agro-900 to-agro-800', is_active: true, starts_at: '', ends_at: '',
    });

    const handleEdit = (banner: Banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            subtitle: banner.subtitle || '',
            image_urls: banner.image_url ? [banner.image_url] : [],
            cta_text: banner.cta_text || '',
            cta_link: banner.cta_link || '',
            color_gradient: banner.color_gradient,
            is_active: banner.is_active,
            starts_at: banner.starts_at ? banner.starts_at.split('T')[0] : '',
            ends_at: banner.ends_at ? banner.ends_at.split('T')[0] : '',
        });
        setIsCreating(true);
    };

    const handleCreate = () => { setEditingBanner(null); resetForm(); setIsCreating(true); };

    const handleCancel = () => { setIsCreating(false); setEditingBanner(null); resetForm(); };

    const handleSave = async () => {
        if (!formData.title.trim() || formData.image_urls.length === 0) {
            showMessage('error', 'Título e pelo menos uma imagem são obrigatórios.');
            return;
        }
        setSaving(true);
        const bannerData = {
            title: formData.title,
            subtitle: formData.subtitle || null,
            cta_text: formData.cta_text || null,
            cta_link: formData.cta_link || null,
            color_gradient: formData.color_gradient,
            is_active: formData.is_active,
            starts_at: formData.starts_at ? new Date(formData.starts_at + 'T12:00:00Z').toISOString() : null,
            ends_at: formData.ends_at ? new Date(formData.ends_at + 'T12:00:00Z').toISOString() : null,
        };
        try {
            if (editingBanner) {
                await updateBanner(editingBanner.id, { ...bannerData, image_url: formData.image_urls[0], position: editingBanner.position ?? 0 });
            } else {
                const startPosition = banners.length;
                await Promise.all(
                    formData.image_urls.map((imageUrl, index) =>
                        createBanner({ ...bannerData, image_url: imageUrl, position: startPosition + index })
                    )
                );
            }
            showMessage('success', editingBanner ? 'Banner atualizado.' : `${formData.image_urls.length} banner(s) criado(s).`);
            handleCancel();
            loadBanners();
        } catch {
            showMessage('error', 'Erro ao salvar banner.');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteBanner(deletingId);
            showMessage('success', 'Banner excluído.');
            loadBanners();
        } catch {
            showMessage('error', 'Erro ao excluir banner.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedBannerId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedBannerId || draggedBannerId === targetId) return;
        const sourceIndex = banners.findIndex(b => b.id === draggedBannerId);
        const targetIndex = banners.findIndex(b => b.id === targetId);
        if (sourceIndex === -1 || targetIndex === -1) return;
        const newBanners = [...banners];
        const [moved] = newBanners.splice(sourceIndex, 1);
        newBanners.splice(targetIndex, 0, moved);
        const updated = newBanners.map((b, i) => ({ ...b, position: i }));
        setBanners(updated);
        setDraggedBannerId(null);
        try {
            await Promise.all(updated.map(b => updateBanner(b.id, { position: b.position })));
            showMessage('success', 'Ordem atualizada.');
        } catch {
            showMessage('error', 'Erro ao reordenar banners.');
            loadBanners();
        }
    };

    const toggleActive = async (banner: Banner) => {
        try {
            await toggleBannerActive(banner.id, !banner.is_active);
            loadBanners();
        } catch {
            showMessage('error', 'Erro ao alterar banner.');
        }
    };

    // ── Form view ──
    if (isCreating) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-stone-800">
                            {editingBanner ? 'Editar Banner' : 'Novo Banner'}
                        </h1>
                        <p className="text-xs text-stone-500 mt-0.5">Preencha as informações do banner</p>
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
                        <button onClick={handleCancel} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <SectionCard title="Imagem do Banner" icon={<ImageIcon size={14} className="text-stone-400" />}>
                    <ImageUploader
                        images={formData.image_urls}
                        onChange={images => setFormData(p => ({ ...p, image_urls: images }))}
                        maxImages={editingBanner ? 1 : 8}
                        bucket="store-assets"
                    />
                </SectionCard>

                <SectionCard title="Conteúdo">
                    <div className="space-y-4">
                        <Field label="Título *">
                            <input type="text" value={formData.title}
                                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                className={inputCls} placeholder="Ex: Safra Garantida 2026" />
                        </Field>
                        <Field label="Subtítulo">
                            <input type="text" value={formData.subtitle}
                                onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))}
                                className={inputCls} placeholder="Texto complementar..." />
                        </Field>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Field label="Texto do botão">
                                <input type="text" value={formData.cta_text}
                                    onChange={e => setFormData(p => ({ ...p, cta_text: e.target.value }))}
                                    className={inputCls} placeholder="Ver Promoções" />
                            </Field>
                            <Field label="Link do botão">
                                <input type="text" value={formData.cta_link}
                                    onChange={e => setFormData(p => ({ ...p, cta_link: e.target.value }))}
                                    className={inputCls} placeholder="/categoria/promocoes" />
                            </Field>
                        </div>
                        <Field label="Cor de fundo">
                            <select value={formData.color_gradient}
                                onChange={e => setFormData(p => ({ ...p, color_gradient: e.target.value }))}
                                className={cn(inputCls, 'bg-white')}>
                                {colorOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </SectionCard>

                <SectionCard
                    title="Agendamento"
                    description="Opcional — define o período em que o banner será exibido automaticamente."
                    icon={<Calendar size={14} className="text-stone-400" />}
                >
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Field label="Data início">
                                <input type="date" value={formData.starts_at}
                                    onChange={e => setFormData(p => ({ ...p, starts_at: e.target.value }))}
                                    className={inputCls} />
                            </Field>
                            <Field label="Data fim">
                                <input type="date" value={formData.ends_at}
                                    onChange={e => setFormData(p => ({ ...p, ends_at: e.target.value }))}
                                    className={inputCls} />
                            </Field>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.is_active}
                                onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                                className="w-4 h-4 accent-stone-700" />
                            <span className="text-sm text-stone-700">Banner ativo</span>
                        </label>
                    </div>
                </SectionCard>

                {formData.image_urls.length > 0 && (
                    <SectionCard title={`Preview${!editingBanner && formData.image_urls.length > 1 ? ` — ${formData.image_urls.length} slides serão criados` : ''}`}>
                        <div className="relative aspect-[4/1] md:aspect-[21/9] rounded-lg overflow-hidden">
                            <img src={formData.image_urls[0]} alt="" className="w-full h-full object-cover" />
                            <div className={`absolute inset-0 bg-gradient-to-r ${formData.color_gradient} opacity-80`} />
                            <div className="absolute inset-0 flex items-center p-6">
                                <div className="text-white">
                                    <h3 className="text-xl font-bold">{formData.title || 'Título do Banner'}</h3>
                                    {formData.subtitle && <p className="text-sm opacity-90">{formData.subtitle}</p>}
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                )}

                <div className="flex items-center justify-end gap-3">
                    <button onClick={handleCancel} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 font-medium transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors">
                        <Save size={14} />
                        {saving ? 'Salvando...' : 'Salvar Banner'}
                    </button>
                </div>
            </div>
        );
    }

    // ── List view ──
    return (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-stone-800">Banners</h1>
                    <p className="text-xs text-stone-500 mt-0.5">Gerencie o carrossel da página inicial. Arraste para reordenar.</p>
                </div>
                <div className="flex items-center gap-2">
                    {message && (
                        <span className={cn(
                            'flex items-center gap-1.5 text-xs font-medium',
                            message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                        )}>
                            {message.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                            {message.text}
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-lg bg-white">
                        <Timer size={13} className="text-stone-400" />
                        <span className="text-xs text-stone-500">Transição:</span>
                        <select
                            value={slideIntervalMs}
                            onChange={e => handleSlideIntervalChange(Number(e.target.value))}
                            disabled={savingInterval}
                            className="text-xs bg-transparent text-stone-700 outline-none"
                        >
                            {SLIDE_INTERVAL_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors">
                        <Plus size={15} />
                        Novo Banner
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
                </div>
            ) : banners.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 py-14 flex flex-col items-center gap-3 text-stone-400">
                    <ImageIcon size={28} className="text-stone-200" />
                    <p className="text-sm">Nenhum banner cadastrado.</p>
                    <button onClick={handleCreate} className="text-sm text-stone-600 hover:text-stone-800 font-medium transition-colors">
                        Criar primeiro banner
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {banners.map(banner => (
                        <div
                            key={banner.id}
                            draggable
                            onDragStart={e => handleDragStart(e, banner.id)}
                            onDragOver={handleDragOver}
                            onDrop={e => handleDrop(e, banner.id)}
                            className={cn(
                                'bg-white rounded-xl border p-4 flex items-center gap-4 transition-all cursor-move',
                                !banner.is_active && 'opacity-60',
                                draggedBannerId === banner.id
                                    ? 'opacity-50 border-dashed border-stone-400'
                                    : 'border-stone-200'
                            )}
                        >
                            <GripVertical size={18} className="text-stone-300 shrink-0" />

                            <div className="w-20 h-12 rounded-lg overflow-hidden relative shrink-0">
                                <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                                <div className={`absolute inset-0 bg-gradient-to-r ${banner.color_gradient} opacity-60`} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-700 truncate">{banner.title}</p>
                                {banner.subtitle && (
                                    <p className="text-xs text-stone-400 truncate">{banner.subtitle}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    {!banner.is_active && (
                                        <span className="flex items-center gap-0.5 text-xs text-stone-400">
                                            <EyeOff size={10} /> Inativo
                                        </span>
                                    )}
                                    {banner.starts_at && (
                                        <span className="text-xs text-stone-400">
                                            De: {new Date(banner.starts_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                    {banner.ends_at && (
                                        <span className="text-xs text-stone-400">
                                            Até: {new Date(banner.ends_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => toggleActive(banner)}
                                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                                    title={banner.is_active ? 'Desativar' : 'Ativar'}>
                                    {banner.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                                </button>
                                <button onClick={() => handleEdit(banner)}
                                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                                    title="Editar">
                                    <Pencil size={15} />
                                </button>
                                <button onClick={() => setDeletingId(banner.id)}
                                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={!!deletingId}
                title="Excluir banner"
                description="Tem certeza que deseja excluir este banner? Essa ação não pode ser desfeita."
                confirmLabel="Excluir"
                onCancel={() => setDeletingId(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default AdminBannerManagement;
