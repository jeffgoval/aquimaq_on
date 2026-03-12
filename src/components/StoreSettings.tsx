import React, { useState, useEffect } from 'react';
import { Save, Store, MapPin, FileText, Phone, Upload, Mail, Instagram, Facebook, Youtube, CreditCard, Clock, Star, TrendingUp, Truck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/services/supabase';
import { maskCEP, maskDocument, maskPhone } from '@/utils/masks';
import { fetchAddressByCEP } from '@/services/addressService';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface StoreSettingsProps {
    onBack: () => void;
}

/** Formulário alinhado a StoreSettings (camelCase) para evitar duplicação */
interface StoreConfig {
    storeName: string;
    razaoSocial: string;
    description: string;
    cnpj: string;
    phone: string;
    whatsapp: string;
    email: string;
    openingHours: string;
    address: {
        zip: string;
        street: string;
        number: string;
        complement: string;
        district: string;
        city: string;
        state: string;
    };
    socialMedia: {
        instagram: string;
        facebook: string;
        youtube: string;
    };
    logoUrl?: string;
    maxInstallments: number;
    acceptedPaymentTypes: string[];
    reclameAquiUrl: string;
    freeShippingThreshold: number;
    crossSellEnabled: boolean;
    crossSellCategory: string;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bank_transfer: 'PIX',
    ticket: 'Boleto',
};

const ALL_PAYMENT_TYPES = ['credit_card', 'debit_card', 'bank_transfer', 'ticket'];

type SettingsTab = 'empresa' | 'endereco' | 'pagamento' | 'vendas';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'empresa', label: 'Empresa', icon: <Store size={16} /> },
    { id: 'endereco', label: 'Endereço', icon: <MapPin size={16} /> },
    { id: 'pagamento', label: 'Pagamento', icon: <CreditCard size={16} /> },
    { id: 'vendas', label: 'Marketing', icon: <TrendingUp size={16} /> },
];

const StoreSettings: React.FC<StoreSettingsProps> = ({ onBack }) => {
    const { settings, isLoading: isLoadingSettings, saveSettings } = useStoreSettings();
    const [formData, setFormData] = useState<StoreConfig>({
        storeName: '',
        razaoSocial: '',
        description: '',
        cnpj: '',
        phone: '',
        whatsapp: '',
        email: '',
        openingHours: '',
        address: {
            zip: '',
            street: '',
            number: '',
            complement: '',
            district: '',
            city: '',
            state: ''
        },
        socialMedia: {
            instagram: '',
            facebook: '',
            youtube: ''
        },
        logoUrl: '',
        maxInstallments: 12,
        acceptedPaymentTypes: ['credit_card', 'debit_card', 'bank_transfer', 'ticket'],
        reclameAquiUrl: '',
        freeShippingThreshold: 350,
        crossSellEnabled: true,
        crossSellCategory: '',
    });

    // Sync formData with loaded settings (camelCase)
    useEffect(() => {
        if (settings) {
            setFormData({
                storeName: settings.storeName,
                razaoSocial: settings.razaoSocial || '',
                description: settings.description ?? '',
                cnpj: maskDocument(settings.cnpj || ''),
                phone: maskPhone(settings.phone || ''),
                whatsapp: maskPhone(settings.whatsapp ?? '') || '',
                email: settings.email || '',
                openingHours: settings.openingHours || '',
                address: {
                    zip: maskCEP(settings.address.zip || ''),
                    street: settings.address.street || '',
                    number: settings.address.number || '',
                    complement: settings.address.complement || '',
                    district: settings.address.district || '',
                    city: settings.address.city || '',
                    state: settings.address.state || ''
                },
                socialMedia: {
                    instagram: settings.socialMedia?.instagram || '',
                    facebook: settings.socialMedia?.facebook || '',
                    youtube: settings.socialMedia?.youtube || ''
                },
                logoUrl: settings.logoUrl || '',
                maxInstallments: settings.maxInstallments ?? 12,
                acceptedPaymentTypes: settings.acceptedPaymentTypes ?? ['credit_card', 'debit_card', 'bank_transfer', 'ticket'],
                reclameAquiUrl: settings.reclameAquiUrl || '',
                freeShippingThreshold: settings.freeShippingThreshold ?? 350,
                crossSellEnabled: settings.crossSellEnabled ?? true,
                crossSellCategory: settings.crossSellCategory ?? '',
            });
        }
    }, [settings]);

    const [activeTab, setActiveTab] = useState<SettingsTab>('empresa');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'phone') formattedValue = maskPhone(value);
        if (name === 'cnpj') formattedValue = maskDocument(value);

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;

        try {
            setIsLoading(true);
            const { error: uploadError } = await supabase.storage
                .from('store-assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('store-assets')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, logoUrl: data.publicUrl }));
            setMessage({ type: 'success', text: 'Logo carregada com sucesso!' });
        } catch (error) {
            console.error('Error uploading logo:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar logo.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddressChange = async (field: string, value: string) => {
        let formattedValue = value;
        if (field === 'zip') formattedValue = maskCEP(value);

        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [field]: formattedValue
            }
        }));

        if (field === 'zip' && formattedValue.length === 9) {
            setIsLoadingAddress(true);
            const addressData = await fetchAddressByCEP(formattedValue);
            setIsLoadingAddress(false);

            if (addressData) {
                setFormData(prev => ({
                    ...prev,
                    address: {
                        ...prev.address,
                        street: addressData.street,
                        district: addressData.district,
                        city: addressData.city,
                        state: addressData.state,
                        complement: addressData.complement || prev.address.complement
                    }
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const result = await saveSettings({
            storeName: formData.storeName,
            razaoSocial: formData.razaoSocial,
            description: formData.description || undefined,
            cnpj: formData.cnpj.replace(/\D/g, ''),
            phone: formData.phone.replace(/\D/g, ''),
            whatsapp: formData.whatsapp.replace(/\D/g, '') || null,
            email: formData.email,
            openingHours: formData.openingHours,
            address: {
                zip: formData.address.zip.replace(/\D/g, ''),
                street: formData.address.street,
                number: formData.address.number,
                complement: formData.address.complement,
                district: formData.address.district,
                city: formData.address.city,
                state: formData.address.state
            },
            socialMedia: formData.socialMedia,
            logoUrl: formData.logoUrl || undefined,
            maxInstallments: formData.maxInstallments,
            acceptedPaymentTypes: formData.acceptedPaymentTypes,
            reclameAquiUrl: formData.reclameAquiUrl,
            freeShippingThreshold: formData.freeShippingThreshold,
            crossSellEnabled: formData.crossSellEnabled,
            crossSellCategory: formData.crossSellCategory || null,
        });

        setIsLoading(false);

        if (result.success) {
            setMessage({ type: 'success', text: 'Configurações da loja salvas com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao salvar configurações.' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
            {isLoadingSettings ? (
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-stone-200 border-t-stone-600 mb-4"></div>
                        <p className="text-stone-600 font-medium">Carregando configurações...</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
                                <Store className="text-stone-600" size={24} />
                                Configurações da Loja
                            </h1>
                            <p className="text-stone-500 text-sm mt-0.5">Dados da empresa e endereço de origem para frete.</p>
                        </div>
                        <button
                            onClick={onBack}
                            className="text-stone-500 hover:text-stone-700 font-medium text-sm"
                        >
                            Voltar
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                        {/* Abas */}
                        <div className="flex border-b border-stone-200 overflow-x-auto">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                                        activeTab === tab.id
                                            ? 'border-stone-700 text-stone-900 bg-stone-50'
                                            : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">

                            {message && (
                                <div className={cn(
                                    'p-4 rounded-xl text-sm flex items-center',
                                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                                )}>
                                    {message.text}
                                </div>
                            )}

                            {/* Aba: Empresa */}
                            {activeTab === 'empresa' && (
                            <>
                            <section className="space-y-6">
                                <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">Informações da Empresa</h3>

                                <div className="flex flex-col items-center sm:flex-row gap-6 mb-6">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full border-4 border-stone-100 overflow-hidden flex items-center justify-center bg-stone-50">
                                            {formData.logoUrl ? (
                                                <img src={formData.logoUrl} alt="Logo da Loja" className="w-full h-full object-cover" />
                                            ) : (
                                                <Store size={48} className="text-stone-300" />
                                            )}
                                        </div>
                                        <label className="absolute bottom-0 right-0 bg-stone-800 text-white p-2 rounded-full cursor-pointer hover:bg-stone-700 transition-colors">
                                            <Upload size={16} />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleLogoUpload}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-stone-900">Logo da Loja</h4>
                                        <p className="text-sm text-stone-500 mb-2">Recomendado: 500x500px, PNG ou JPG.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Nome da Loja</label>
                                        <div className="relative">
                                            <Store className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                            <input
                                                type="text"
                                                name="storeName"
                                                value={formData.storeName}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Razão Social</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                            <input
                                                type="text"
                                                name="razaoSocial"
                                                value={formData.razaoSocial}
                                                onChange={handleChange}
                                                placeholder="Ex: Aquimaq Comércio de Máquinas Ltda."
                                                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                        </div>
                                        <p className="text-xs text-stone-400">Exibida no rodapé (exigência CDC).</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">CNPJ</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                            <input
                                                type="text"
                                                name="cnpj"
                                                value={formData.cnpj}
                                                onChange={handleChange}
                                                maxLength={18}
                                                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Telefone de Contato</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                maxLength={15}
                                                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Número WhatsApp</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                            <input
                                                type="text"
                                                name="whatsapp"
                                                value={formData.whatsapp}
                                                onChange={(e) => {
                                                    const v = maskPhone(e.target.value);
                                                    setFormData((prev) => ({ ...prev, whatsapp: v }));
                                                }}
                                                maxLength={15}
                                                placeholder="Se diferente do telefone acima"
                                                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                        </div>
                                        <p className="text-xs text-stone-400">Usado no link &quot;Central de Vendas&quot; do header. Deixe vazio para usar o telefone de contato.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">E-mail</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Horário de Atendimento</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                            <input
                                                type="text"
                                                name="openingHours"
                                                value={formData.openingHours}
                                                onChange={handleChange}
                                                placeholder="Ex: Seg a Sex, 8h às 18h | Sáb, 8h às 12h"
                                                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                        </div>
                                        <p className="text-xs text-stone-400">Exibido no rodapé na seção de atendimento.</p>
                                    </div>
                                </div>
                                <div className="space-y-2 mt-6">
                                    <label className="text-sm font-semibold text-stone-700">Descrição da loja</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        placeholder="Ex: Somos uma loja especializada em ferramentas e insumos para o agronegócio..."
                                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none text-sm"
                                    />
                                    <p className="text-xs text-stone-400">Exibido na página <strong>Sobre</strong> (seção &quot;Nossa História&quot;) e na meta description dessa página. Se deixar vazio, a página Sobre usa o texto padrão.</p>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">Redes Sociais</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Instagram</label>
                                        <div className="relative">
                                            <Instagram className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                            <input
                                                type="text"
                                                value={formData.socialMedia.instagram}
                                                onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, instagram: e.target.value } }))}
                                                placeholder="https://instagram.com/..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Facebook</label>
                                        <div className="relative">
                                            <Facebook className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                            <input
                                                type="text"
                                                value={formData.socialMedia.facebook}
                                                onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, facebook: e.target.value } }))}
                                                placeholder="https://facebook.com/..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">YouTube</label>
                                        <div className="relative">
                                            <Youtube className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                            <input
                                                type="text"
                                                value={formData.socialMedia.youtube}
                                                onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, youtube: e.target.value } }))}
                                                placeholder="https://youtube.com/..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                            </>
                            )}

                            {/* Aba: Endereço */}
                            {activeTab === 'endereco' && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                                        <MapPin className="text-stone-600" size={20} />
                                        Endereço de Origem (Estoque)
                                    </h3>
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Usado para cálculo de frete</span>
                                </div>

                                <div className="grid grid-cols-12 gap-x-4 gap-y-6">
                                    {/* CEP */}
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">CEP</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.address.zip}
                                                onChange={(e) => handleAddressChange('zip', e.target.value)}
                                                maxLength={9}
                                                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                            />
                                            {isLoadingAddress && (
                                                <div className="absolute right-3 top-2.5">
                                                    <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rua */}
                                    <div className="col-span-12 md:col-span-9 space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Logradouro</label>
                                        <input
                                            type="text"
                                            value={formData.address.street}
                                            onChange={(e) => handleAddressChange('street', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                        />
                                    </div>

                                    {/* Número */}
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Número</label>
                                        <input
                                            type="text"
                                            value={formData.address.number}
                                            onChange={(e) => handleAddressChange('number', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                        />
                                    </div>

                                    {/* Complemento */}
                                    <div className="col-span-12 md:col-span-5 space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Complemento</label>
                                        <input
                                            type="text"
                                            value={formData.address.complement}
                                            onChange={(e) => handleAddressChange('complement', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                        />
                                    </div>

                                    {/* Bairro */}
                                    <div className="col-span-12 md:col-span-4 space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Bairro</label>
                                        <input
                                            type="text"
                                            value={formData.address.district}
                                            onChange={(e) => handleAddressChange('district', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                        />
                                    </div>

                                    {/* Cidade */}
                                    <div className="col-span-12 md:col-span-9 space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Cidade</label>
                                        <input
                                            type="text"
                                            value={formData.address.city}
                                            onChange={(e) => handleAddressChange('city', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                        />
                                    </div>

                                    {/* UF */}
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">UF</label>
                                        <input
                                            type="text"
                                            maxLength={2}
                                            value={formData.address.state}
                                            onChange={(e) => handleAddressChange('state', e.target.value.toUpperCase())}
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                        />
                                    </div>
                                </div>
                            </section>
                            )}

                            {/* Aba: Pagamento */}
                            {activeTab === 'pagamento' && (
                            <section className="space-y-6">
                                <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                                    <CreditCard className="text-stone-600" size={20} />
                                    Configurações de Pagamento
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Max installments */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Máximo de Parcelas</label>
                                        <select
                                            value={formData.maxInstallments}
                                            onChange={(e) => setFormData(prev => ({ ...prev, maxInstallments: Number(e.target.value) }))}
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                        >
                                            {[1, 2, 3, 4, 6, 9, 12].map(n => (
                                                <option key={n} value={n}>{n === 1 ? 'Somente à vista' : `Até ${n}x`}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-stone-400">Número máximo de parcelas exibidas no Mercado Pago.</p>
                                    </div>

                                    {/* Accepted payment types */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Formas de Pagamento Aceitas</label>
                                        <div className="space-y-2 pt-1">
                                            {ALL_PAYMENT_TYPES.map(type => (
                                                <label key={type} className="flex items-center gap-2 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.acceptedPaymentTypes.includes(type)}
                                                        onChange={(e) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                acceptedPaymentTypes: e.target.checked
                                                                    ? [...prev.acceptedPaymentTypes, type]
                                                                    : prev.acceptedPaymentTypes.filter(t => t !== type),
                                                            }));
                                                        }}
                                                        className="w-4 h-4 rounded border-stone-300 text-stone-700 focus:ring-stone-500"
                                                    />
                                                    <span className="text-sm text-stone-700">{PAYMENT_TYPE_LABELS[type]}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                            )}

                            {/* Aba: Marketing */}
                            {activeTab === 'vendas' && (
                            <>
                            <section className="space-y-6">
                                <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                                    <TrendingUp className="text-stone-600" size={20} />
                                    Conversão e Vendas
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Free shipping threshold */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                                            <Truck size={15} className="text-stone-500" />
                                            Frete Grátis a partir de (R$)
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formData.freeShippingThreshold}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/\D/g, '');
                                                setFormData(prev => ({ ...prev, freeShippingThreshold: v === '' ? 0 : Number(v) }));
                                            }}
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                        />
                                        <p className="text-xs text-stone-400">Exibido como barra de progresso no carrinho. Coloque 0 para desativar.</p>
                                    </div>

                                    {/* Cross-sell enabled */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                                            <TrendingUp size={15} className="text-stone-500" />
                                            Cross-sell após pagamento
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                                            <input
                                                type="checkbox"
                                                checked={formData.crossSellEnabled}
                                                onChange={(e) => setFormData(prev => ({ ...prev, crossSellEnabled: e.target.checked }))}
                                                className="w-4 h-4 rounded border-stone-300 text-stone-700 focus:ring-stone-500"
                                            />
                                            <span className="text-sm text-stone-700">Mostrar "Outros clientes também compraram" na página de sucesso</span>
                                        </label>
                                        <div className="space-y-1 pt-1">
                                            <label className="text-xs font-semibold text-stone-600">Categoria (deixe vazio = mais vendidos)</label>
                                            <select
                                                value={formData.crossSellCategory}
                                                onChange={(e) => setFormData(prev => ({ ...prev, crossSellCategory: e.target.value }))}
                                                disabled={!formData.crossSellEnabled}
                                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none disabled:opacity-50"
                                            >
                                                <option value="">Mais vendidos (padrão)</option>
                                                <option value="Ferramentas Manuais">Ferramentas Manuais</option>
                                                <option value="Peças de Reposição">Peças de Reposição</option>
                                                <option value="Acessórios">Acessórios</option>
                                                <option value="Sementes Fracionadas">Sementes Fracionadas</option>
                                                <option value="Insumos Agrícolas">Insumos Agrícolas</option>
                                                <option value="Máquinas e Equipamentos">Máquinas e Equipamentos</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                                    <Star className="text-stone-600" size={20} />
                                    Rodapé &amp; Confiança
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-stone-700">URL do Reclame Aqui</label>
                                    <div className="relative">
                                        <Star className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                        <input
                                            type="url"
                                            name="reclameAquiUrl"
                                            value={formData.reclameAquiUrl}
                                            onChange={handleChange}
                                            placeholder="https://www.reclameaqui.com.br/empresa/aquimaq/"
                                            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-300 focus:border-stone-400 outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-stone-400">Se preenchido, exibe o badge do Reclame Aqui no rodapé. Deixe em branco para ocultar.</p>
                                </div>
                            </section>
                            </>
                            )}

                            <div className="pt-6 border-t border-stone-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2.5 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors flex items-center gap-2"
                                >
                                    {isLoading ? 'Salvando...' : <><Save size={20} className="mr-2" /> Salvar Configurações</>}
                                </button>
                            </div>

                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default StoreSettings;

