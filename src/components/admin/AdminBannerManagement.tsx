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
    Calendar
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import ImageUploader from './ImageUploader';

interface Banner {
    id: string;
    title: string;
    subtitle: string | null;
    image_url: string;
    cta_text: string | null;
    cta_link: string | null;
    color_gradient: string;
    position: number;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
}

const colorOptions = [
    { value: 'from-agro-900 to-agro-800', label: 'Verde Escuro' },
    { value: 'from-stone-900 to-stone-800', label: 'Cinza Escuro' },
    { value: 'from-blue-900 to-blue-800', label: 'Azul Escuro' },
    { value: 'from-amber-900 to-amber-800', label: 'Âmbar Escuro' },
    { value: 'from-violet-900 to-violet-800', label: 'Violeta Escuro' },
];

const AdminBannerManagement: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image_url: '',
        cta_text: '',
        cta_link: '',
        color_gradient: 'from-agro-900 to-agro-800',
        is_active: true,
        starts_at: '',
        ends_at: '',
    });

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .order('position', { ascending: true });

            if (error) throw error;
            setBanners(data || []);
        } catch (error) {
            console.error('Error loading banners:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar banners.' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            image_url: '',
            cta_text: '',
            cta_link: '',
            color_gradient: 'from-agro-900 to-agro-800',
            is_active: true,
            starts_at: '',
            ends_at: '',
        });
    };

    const handleEdit = (banner: Banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            subtitle: banner.subtitle || '',
            image_url: banner.image_url,
            cta_text: banner.cta_text || '',
            cta_link: banner.cta_link || '',
            color_gradient: banner.color_gradient,
            is_active: banner.is_active,
            starts_at: banner.starts_at ? banner.starts_at.split('T')[0] : '',
            ends_at: banner.ends_at ? banner.ends_at.split('T')[0] : '',
        });
        setIsCreating(true);
    };

    const handleCreate = () => {
        setEditingBanner(null);
        resetForm();
        setIsCreating(true);
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingBanner(null);
        resetForm();
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.image_url) {
            setMessage({ type: 'error', text: 'Título e imagem são obrigatórios.' });
            return;
        }

        setSaving(true);

        const bannerData = {
            title: formData.title,
            subtitle: formData.subtitle || null,
            image_url: formData.image_url,
            cta_text: formData.cta_text || null,
            cta_link: formData.cta_link || null,
            color_gradient: formData.color_gradient,
            is_active: formData.is_active,
            starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
            ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
            position: editingBanner?.position ?? banners.length,
        };

        try {
            if (editingBanner) {
                const { error } = await supabase
                    .from('banners')
                    .update(bannerData)
                    .eq('id', editingBanner.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('banners')
                    .insert(bannerData);
                if (error) throw error;
            }

            setMessage({ type: 'success', text: editingBanner ? 'Banner atualizado!' : 'Banner criado!' });
            handleCancel();
            loadBanners();
        } catch (error) {
            console.error('Error saving banner:', error);
            setMessage({ type: 'error', text: 'Erro ao salvar banner.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este banner?')) return;

        try {
            const { error } = await supabase.from('banners').delete().eq('id', id);
            if (error) throw error;
            setMessage({ type: 'success', text: 'Banner excluído.' });
            loadBanners();
        } catch (error) {
            console.error('Error deleting banner:', error);
            setMessage({ type: 'error', text: 'Erro ao excluir banner.' });
        }
    };

    const toggleActive = async (banner: Banner) => {
        try {
            const { error } = await supabase
                .from('banners')
                .update({ is_active: !banner.is_active })
                .eq('id', banner.id);
            if (error) throw error;
            loadBanners();
        } catch (error) {
            console.error('Error toggling banner:', error);
        }
    };

    const handleImagesChange = (images: string[]) => {
        setFormData(prev => ({ ...prev, image_url: images[0] || '' }));
    };

    // Editor Modal/Form
    if (isCreating) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-stone-800">
                            {editingBanner ? 'Editar Banner' : 'Novo Banner'}
                        </h1>
                        <p className="text-stone-400 text-[13px]">Preencha as informações do banner</p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg"
                        aria-label="Fechar formulário"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-5">
                    {/* Image */}
                    <div className="bg-white rounded-xl border border-stone-100 p-5">
                        <h2 className="text-[14px] font-medium text-stone-700 mb-4 flex items-center gap-2">
                            <ImageIcon size={16} className="text-stone-400" />
                            Imagem do Banner
                        </h2>
                        <ImageUploader
                            images={formData.image_url ? [formData.image_url] : []}
                            onChange={handleImagesChange}
                            maxImages={1}
                            bucket="store-assets"
                        />
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
                        <h2 className="text-[14px] font-medium text-stone-700">Conteúdo</h2>

                        <div>
                            <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                Título *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                placeholder="Ex: Safra Garantida 2026"
                            />
                        </div>

                        <div>
                            <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                Subtítulo
                            </label>
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                placeholder="Texto complementar..."
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                    Texto do Botão
                                </label>
                                <input
                                    type="text"
                                    value={formData.cta_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                    placeholder="Ver Promoções"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                    Link do Botão
                                </label>
                                <input
                                    type="text"
                                    value={formData.cta_link}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cta_link: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                    placeholder="/categoria/promocoes"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                Cor de Fundo
                            </label>
                            <select
                                value={formData.color_gradient}
                                onChange={(e) => setFormData(prev => ({ ...prev, color_gradient: e.target.value }))}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 bg-white"
                            >
                                {colorOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
                        <h2 className="text-[14px] font-medium text-stone-700 flex items-center gap-2">
                            <Calendar size={16} className="text-stone-400" />
                            Agendamento (Opcional)
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                    Data Início
                                </label>
                                <input
                                    type="date"
                                    value={formData.starts_at}
                                    onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                    Data Fim
                                </label>
                                <input
                                    type="date"
                                    value={formData.ends_at}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                className="w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
                            />
                            <span className="text-[13px] text-stone-600">Banner ativo</span>
                        </label>
                    </div>

                    {/* Preview */}
                    {formData.image_url && (
                        <div className="bg-white rounded-xl border border-stone-100 p-5">
                            <h2 className="text-[14px] font-medium text-stone-700 mb-4">Preview</h2>
                            <div className="relative h-40 rounded-lg overflow-hidden">
                                <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                                <div className={`absolute inset-0 bg-gradient-to-r ${formData.color_gradient} opacity-80`}></div>
                                <div className="absolute inset-0 flex items-center p-6">
                                    <div className="text-white">
                                        <h3 className="text-xl font-bold">{formData.title || 'Título do Banner'}</h3>
                                        {formData.subtitle && <p className="text-sm opacity-90">{formData.subtitle}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-stone-500 hover:text-stone-700 text-[13px] font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 bg-stone-800 text-white rounded-lg text-[13px] font-medium hover:bg-stone-700 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saving ? 'Salvando...' : 'Salvar Banner'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-stone-800">Banners</h1>
                    <p className="text-stone-400 text-[13px] mt-0.5">
                        Gerencie o carrossel da página inicial
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-[13px] font-medium hover:bg-stone-700"
                >
                    <Plus size={16} />
                    Novo Banner
                </button>
            </div>

            {/* Feedback */}
            {message && (
                <div className={`px-3 py-2 rounded-lg text-[13px] ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Banners Grid */}
            {loading ? (
                <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500 mb-2"></div>
                    <p className="text-stone-400 text-[13px]">Carregando...</p>
                </div>
            ) : banners.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-100 p-8 text-center">
                    <ImageIcon size={40} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-stone-500 text-[13px]">Nenhum banner cadastrado.</p>
                    <button
                        onClick={handleCreate}
                        className="mt-3 text-stone-600 hover:text-stone-800 text-[13px] font-medium"
                    >
                        Criar primeiro banner
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {banners.map((banner) => (
                        <div
                            key={banner.id}
                            className={`bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-4 ${!banner.is_active ? 'opacity-60' : ''}`}
                        >
                            {/* Drag Handle */}
                            <div className="text-stone-300 cursor-move">
                                <GripVertical size={20} />
                            </div>

                            {/* Thumbnail */}
                            <div className="w-24 h-14 rounded-lg overflow-hidden relative flex-shrink-0">
                                <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                                <div className={`absolute inset-0 bg-gradient-to-r ${banner.color_gradient} opacity-60`}></div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[13px] font-medium text-stone-700 truncate">{banner.title}</h3>
                                {banner.subtitle && (
                                    <p className="text-[12px] text-stone-400 truncate">{banner.subtitle}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    {!banner.is_active && (
                                        <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                                            <EyeOff size={10} /> Inativo
                                        </span>
                                    )}
                                    {banner.starts_at && (
                                        <span className="text-[10px] text-stone-400">
                                            De: {new Date(banner.starts_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                    {banner.ends_at && (
                                        <span className="text-[10px] text-stone-400">
                                            Até: {new Date(banner.ends_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => toggleActive(banner)}
                                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg"
                                    title={banner.is_active ? 'Desativar' : 'Ativar'}
                                    aria-label={banner.is_active ? 'Desativar banner' : 'Ativar banner'}
                                >
                                    {banner.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button
                                    onClick={() => handleEdit(banner)}
                                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg"
                                    title="Editar"
                                    aria-label="Editar banner"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Excluir"
                                    aria-label="Excluir banner"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminBannerManagement;

