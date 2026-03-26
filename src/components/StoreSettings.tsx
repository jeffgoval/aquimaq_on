import React, { useState, useEffect } from 'react';
import {
    Save, Store, MapPin, CreditCard, Truck, Upload,
    Instagram, Facebook, Youtube, Lock, CheckCircle, AlertCircle,
    Phone, Mail, Clock, Star,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/services/supabase';
import { MASK_INPUT_MAX_LENGTH, MASK_PLACEHOLDER, maskCEP, maskDocument, maskPhone } from '@/utils/masks';
import { fetchAddressByCEP } from '@/services/addressService';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';

interface StoreSettingsProps {
    onBack: () => void;
}

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
    pixDiscount: number;
    crossSellEnabled: boolean;
    crossSellCategory: string;
}

interface FormErrors {
    storeName?: string;
    cnpj?: string;
    phone?: string;
    email?: string;
    'address.zip'?: string;
    'address.street'?: string;
    'address.number'?: string;
    'address.district'?: string;
    'address.city'?: string;
    'address.state'?: string;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bank_transfer: 'PIX',
    ticket: 'Boleto',
};

const ALL_PAYMENT_TYPES = ['credit_card', 'debit_card', 'bank_transfer', 'ticket'];

const CROSS_SELL_CATEGORIES = [
    { value: 'mais-vendidos', label: 'Mais Vendidos' },
    { value: 'ferramentas-manuais', label: 'Ferramentas Manuais' },
    { value: 'pecas', label: 'Peças e Componentes' },
    { value: 'acessorios', label: 'Acessórios' },
];

type SettingsTab = 'loja' | 'endereco' | 'pagamento' | 'frete';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard: React.FC<{
    title: string;
    description?: string;
    children: React.ReactNode;
    locked?: boolean;
}> = ({ title, description, children, locked }) => (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-start justify-between gap-3">
            <div>
                <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
                {description && <p className="text-xs text-stone-500 mt-0.5">{description}</p>}
            </div>
            {locked && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                    <Lock size={11} />
                    Somente admin
                </span>
            )}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const Field: React.FC<{
    label: string;
    children: React.ReactNode;
    error?: string;
    hint?: string;
    required?: boolean;
    span?: 'half' | 'full';
}> = ({ label, children, error, hint, required, span = 'full' }) => (
    <div className={span === 'half' ? '' : 'col-span-full'}>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
        {hint && !error && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

const inputCls = (error?: string, disabled?: boolean) =>
    cn(
        'w-full px-3 py-2 text-sm border rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-stone-300',
        error ? 'border-red-300 bg-red-50' : 'border-stone-200',
        disabled && 'bg-stone-50 text-stone-400 cursor-not-allowed'
    );

// ─── Main Component ───────────────────────────────────────────────────────────

const StoreSettings: React.FC<StoreSettingsProps> = ({ onBack }) => {
    const { settings, isLoading: isLoadingSettings, saveSettings } = useStoreSettings();
    const { refreshSettings } = useStore();
    const { isAdmin, isGerente } = useAuth();
    const canEditPayment = isAdmin || isGerente;

    const [formData, setFormData] = useState<StoreConfig>({
        storeName: '',
        razaoSocial: '',
        description: '',
        cnpj: '',
        phone: '',
        whatsapp: '',
        email: '',
        openingHours: '',
        address: { zip: '', street: '', number: '', complement: '', district: '', city: '', state: '' },
        socialMedia: { instagram: '', facebook: '', youtube: '' },
        logoUrl: '',
        maxInstallments: 12,
        acceptedPaymentTypes: ['credit_card', 'debit_card', 'bank_transfer', 'ticket'],
        reclameAquiUrl: '',
        freeShippingThreshold: 350,
        pixDiscount: 0.05,
        crossSellEnabled: true,
        crossSellCategory: '',
    });

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
                    state: settings.address.state || '',
                },
                socialMedia: {
                    instagram: settings.socialMedia?.instagram || '',
                    facebook: settings.socialMedia?.facebook || '',
                    youtube: settings.socialMedia?.youtube || '',
                },
                logoUrl: settings.logoUrl || '',
                maxInstallments: settings.maxInstallments ?? 12,
                acceptedPaymentTypes: settings.acceptedPaymentTypes ?? ALL_PAYMENT_TYPES,
                reclameAquiUrl: settings.reclameAquiUrl || '',
                freeShippingThreshold: settings.freeShippingThreshold ?? 350,
                pixDiscount: settings.pixDiscount ?? 0.05,
                crossSellEnabled: settings.crossSellEnabled ?? true,
                crossSellCategory: settings.crossSellCategory ?? '',
            });
        }
    }, [settings]);

    const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
        { id: 'loja', label: 'Loja', icon: Store },
        { id: 'endereco', label: 'Endereço', icon: MapPin },
        { id: 'pagamento', label: 'Pagamento', icon: CreditCard },
        { id: 'frete', label: 'Frete', icon: Truck },
    ];

    const [activeTab, setActiveTab] = useState<SettingsTab>('loja');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    const validate = (): FormErrors => {
        const e: FormErrors = {};
        if (!formData.storeName.trim()) e.storeName = 'Obrigatório';
        if ((formData.cnpj.replace(/\D/g, '')).length !== 14) e.cnpj = 'CNPJ deve ter 14 dígitos';
        if ((formData.phone.replace(/\D/g, '')).length < 10) e.phone = 'Telefone inválido';
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'E-mail inválido';
        if ((formData.address.zip.replace(/\D/g, '')).length !== 8) e['address.zip'] = 'CEP inválido';
        if (!formData.address.street.trim()) e['address.street'] = 'Obrigatório';
        if (!formData.address.number.trim()) e['address.number'] = 'Obrigatório';
        if (!formData.address.district.trim()) e['address.district'] = 'Obrigatório';
        if (!formData.address.city.trim()) e['address.city'] = 'Obrigatório';
        if (formData.address.state.trim().length !== 2) e['address.state'] = 'UF inválida';
        return e;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let v = value;
        if (name === 'phone' || name === 'whatsapp') v = maskPhone(value);
        if (name === 'cnpj') v = maskDocument(value);
        setFormData(prev => ({ ...prev, [name]: v }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
        setIsUploadingLogo(true);
        try {
            const { error } = await supabase.storage.from('store-assets').upload(fileName, file);
            if (error) throw error;
            const { data } = supabase.storage.from('store-assets').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, logoUrl: data.publicUrl }));
        } catch {
            setMessage({ type: 'error', text: 'Erro ao carregar logo.' });
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleAddressChange = async (field: string, value: string) => {
        const v = field === 'zip' ? maskCEP(value) : value;
        setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: v } }));
        setErrors(prev => ({ ...prev, [`address.${field}`]: undefined }));
        if (field === 'zip' && v.length === 9) {
            setIsLoadingAddress(true);
            const addr = await fetchAddressByCEP(v);
            setIsLoadingAddress(false);
            if (addr) {
                setFormData(prev => ({
                    ...prev,
                    address: {
                        ...prev.address,
                        street: addr.street,
                        district: addr.district,
                        city: addr.city,
                        state: addr.state,
                        complement: addr.complement || prev.address.complement,
                    },
                }));
            }
        }
    };

    const togglePaymentType = (type: string) => {
        setFormData(prev => ({
            ...prev,
            acceptedPaymentTypes: prev.acceptedPaymentTypes.includes(type)
                ? prev.acceptedPaymentTypes.filter(t => t !== type)
                : [...prev.acceptedPaymentTypes, type],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            const hasLojaError = ['storeName', 'cnpj', 'phone', 'email'].some(f => errs[f as keyof FormErrors]);
            const hasEnderecoError = Object.keys(errs).some(k => k.startsWith('address.'));
            if (hasLojaError) setActiveTab('loja');
            else if (hasEnderecoError) setActiveTab('endereco');
            return;
        }
        setErrors({});
        setIsSaving(true);

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
                state: formData.address.state,
            },
            socialMedia: formData.socialMedia,
            logoUrl: formData.logoUrl || undefined,
            maxInstallments: formData.maxInstallments,
            acceptedPaymentTypes: formData.acceptedPaymentTypes,
            reclameAquiUrl: formData.reclameAquiUrl,
            freeShippingThreshold: formData.freeShippingThreshold,
            pixDiscount: formData.pixDiscount,
            crossSellEnabled: formData.crossSellEnabled,
            crossSellCategory: formData.crossSellCategory || null,
        });

        setIsSaving(false);

        if (result.success) {
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
            refreshSettings();
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao salvar configurações.' });
        }
    };

    if (isLoadingSettings) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-stone-200 border-t-stone-600 mb-3" />
                    <p className="text-sm text-stone-500">Carregando configurações...</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-stone-800">Configurações</h1>
                    <p className="text-xs text-stone-500 mt-0.5">
                        {'Acesso completo'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <span className={cn(
                            'flex items-center gap-1.5 text-xs font-medium',
                            message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                        )}>
                            {message.type === 'success'
                                ? <CheckCircle size={14} />
                                : <AlertCircle size={14} />}
                            {message.text}
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-700 disabled:opacity-50 transition-colors"
                    >
                        <Save size={14} />
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-200 gap-1">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const tabErrors: Record<string, (keyof FormErrors)[]> = {
                        loja: ['storeName', 'cnpj', 'phone', 'email'],
                        endereco: ['address.zip', 'address.street', 'address.number', 'address.district', 'address.city', 'address.state'],
                    };
                    const hasError = (tabErrors[tab.id] || []).some(f => errors[f]);
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                                activeTab === tab.id
                                    ? 'border-stone-800 text-stone-900'
                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300',
                                hasError && 'text-red-500'
                            )}
                        >
                            <Icon size={14} />
                            {tab.label}
                            {hasError && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        </button>
                    );
                })}
            </div>

            {/* ── Tab: Loja ── */}
            {activeTab === 'loja' && (
                <div className="space-y-4">
                    <SectionCard title="Identidade" description="Logo e dados públicos da loja.">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Logo */}
                            <div className="col-span-full">
                                <label className="block text-xs font-medium text-stone-600 mb-2">Logotipo</label>
                                <div className="flex items-center gap-4">
                                    {formData.logoUrl ? (
                                        <img src={formData.logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded-lg border border-stone-200 bg-stone-50" />
                                    ) : (
                                        <div className="h-14 w-14 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center">
                                            <Store size={20} className="text-stone-300" />
                                        </div>
                                    )}
                                    <label className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                                        <Upload size={13} />
                                        {isUploadingLogo ? 'Enviando...' : 'Alterar logo'}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                                    </label>
                                </div>
                            </div>

                            <Field label="Nome da loja" required error={errors.storeName} span="full">
                                <input name="storeName" value={formData.storeName} onChange={handleChange}
                                    className={inputCls(errors.storeName)} placeholder="Ex: AquiMaq" />
                            </Field>

                            <Field label="Razão social" span="full">
                                <input name="razaoSocial" value={formData.razaoSocial} onChange={handleChange}
                                    className={inputCls()} placeholder="Razão social da empresa" />
                            </Field>

                            <Field label="Descrição" hint="Exibida em mecanismos de busca." span="full">
                                <textarea name="description" value={formData.description}
                                    onChange={handleChange} rows={3}
                                    className={cn(inputCls(), 'resize-none')}
                                    placeholder="Breve descrição da loja..." />
                            </Field>
                        </div>
                    </SectionCard>

                    <SectionCard title="Contato" description="Informações de contacto visíveis aos clientes.">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="CNPJ" required error={errors.cnpj}>
                                <div className="relative">
                                    <input name="cnpj" value={formData.cnpj} onChange={handleChange}
                                        className={inputCls(errors.cnpj)} placeholder={MASK_PLACEHOLDER.cnpj} maxLength={MASK_INPUT_MAX_LENGTH.cpfCnpj} inputMode="numeric" autoComplete="off" />
                                </div>
                            </Field>
                            <Field label="Telefone" required error={errors.phone}>
                                <div className="relative">
                                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input name="phone" value={formData.phone} onChange={handleChange}
                                        className={cn(inputCls(errors.phone), 'pl-8')} placeholder={MASK_PLACEHOLDER.phone} maxLength={MASK_INPUT_MAX_LENGTH.phone} inputMode="tel" autoComplete="tel" />
                                </div>
                            </Field>
                            <Field label="WhatsApp" hint="Deixe em branco para usar o mesmo que o telefone.">
                                <div className="relative">
                                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input name="whatsapp" value={formData.whatsapp} onChange={handleChange}
                                        className={cn(inputCls(), 'pl-8')} placeholder={MASK_PLACEHOLDER.phone} maxLength={MASK_INPUT_MAX_LENGTH.phone} inputMode="tel" autoComplete="tel" />
                                </div>
                            </Field>
                            <Field label="E-mail" required error={errors.email}>
                                <div className="relative">
                                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input name="email" value={formData.email} onChange={handleChange}
                                        className={cn(inputCls(errors.email), 'pl-8')} placeholder="contato@loja.com.br" />
                                </div>
                            </Field>
                            <Field label="Horário de atendimento" span="full">
                                <div className="relative">
                                    <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input name="openingHours" value={formData.openingHours} onChange={handleChange}
                                        className={cn(inputCls(), 'pl-8')} placeholder="Seg–Sex das 8h às 18h" />
                                </div>
                            </Field>
                        </div>
                    </SectionCard>

                    <SectionCard title="Redes Sociais" description="Links para o perfil da loja nas redes sociais.">
                        <div className="space-y-3">
                            <div className="relative">
                                <Instagram size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input value={formData.socialMedia.instagram}
                                    onChange={e => setFormData(p => ({ ...p, socialMedia: { ...p.socialMedia, instagram: e.target.value } }))}
                                    className={cn(inputCls(), 'pl-8')} placeholder="https://instagram.com/suaLoja" />
                            </div>
                            <div className="relative">
                                <Facebook size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input value={formData.socialMedia.facebook}
                                    onChange={e => setFormData(p => ({ ...p, socialMedia: { ...p.socialMedia, facebook: e.target.value } }))}
                                    className={cn(inputCls(), 'pl-8')} placeholder="https://facebook.com/suaLoja" />
                            </div>
                            <div className="relative">
                                <Youtube size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input value={formData.socialMedia.youtube}
                                    onChange={e => setFormData(p => ({ ...p, socialMedia: { ...p.socialMedia, youtube: e.target.value } }))}
                                    className={cn(inputCls(), 'pl-8')} placeholder="https://youtube.com/@suaLoja" />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Reputação" description="Integração com plataformas de avaliação.">
                        <Field label="URL do badge ReclameAqui" hint="Cole o link do seu perfil no ReclameAqui para exibir o badge na loja.">
                            <div className="relative">
                                <Star size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input name="reclameAquiUrl" value={formData.reclameAquiUrl} onChange={handleChange}
                                    className={cn(inputCls(), 'pl-8')} placeholder="https://www.reclameaqui.com.br/empresa/..." />
                            </div>
                        </Field>
                    </SectionCard>
                </div>
            )}

            {/* ── Tab: Endereço ── */}
            {activeTab === 'endereco' && (
                <div className="space-y-4">
                    <SectionCard
                        title="Endereço de Origem"
                        description="Usado para cálculo de frete. Deve ser o endereço de onde os pedidos são despachados."
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="CEP" required error={errors['address.zip']}>
                                <input value={formData.address.zip}
                                    onChange={e => handleAddressChange('zip', e.target.value)}
                                    className={inputCls(errors['address.zip'])}
                                    placeholder={MASK_PLACEHOLDER.cep} maxLength={MASK_INPUT_MAX_LENGTH.cep} inputMode="numeric" autoComplete="postal-code" />
                                {isLoadingAddress && <p className="mt-1 text-xs text-stone-400">Buscando endereço...</p>}
                            </Field>

                            <Field label="Logradouro" required error={errors['address.street']} span="full">
                                <input value={formData.address.street}
                                    onChange={e => handleAddressChange('street', e.target.value)}
                                    className={inputCls(errors['address.street'])} placeholder="Rua, Avenida..." />
                            </Field>

                            <Field label="Número" required error={errors['address.number']}>
                                <input value={formData.address.number}
                                    onChange={e => handleAddressChange('number', e.target.value)}
                                    className={inputCls(errors['address.number'])} placeholder="123" />
                            </Field>

                            <Field label="Complemento">
                                <input value={formData.address.complement}
                                    onChange={e => handleAddressChange('complement', e.target.value)}
                                    className={inputCls()} placeholder="Sala, Bloco..." />
                            </Field>

                            <Field label="Bairro" required error={errors['address.district']}>
                                <input value={formData.address.district}
                                    onChange={e => handleAddressChange('district', e.target.value)}
                                    className={inputCls(errors['address.district'])} placeholder="Bairro" />
                            </Field>

                            <Field label="Cidade" required error={errors['address.city']}>
                                <input value={formData.address.city}
                                    onChange={e => handleAddressChange('city', e.target.value)}
                                    className={inputCls(errors['address.city'])} placeholder="Cidade" />
                            </Field>

                            <Field label="UF" required error={errors['address.state']}>
                                <input value={formData.address.state}
                                    onChange={e => handleAddressChange('state', e.target.value.toUpperCase())}
                                    className={inputCls(errors['address.state'])} placeholder="SP" maxLength={2} />
                            </Field>
                        </div>
                    </SectionCard>
                </div>
            )}

            {/* ── Tab: Pagamento ── */}
            {activeTab === 'pagamento' && (
                <div className="space-y-4">
                    <SectionCard title="Métodos aceitos" description="Formas de pagamento disponíveis no checkout." locked={!canEditPayment}>
                        <div className="space-y-2">
                            {ALL_PAYMENT_TYPES.map(type => (
                                <label key={type} className={cn('flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                                    formData.acceptedPaymentTypes.includes(type)
                                        ? 'border-stone-300 bg-stone-50'
                                        : 'border-stone-200 hover:bg-stone-50',
                                    !canEditPayment && 'cursor-not-allowed opacity-60'
                                )}>
                                    <input
                                        type="checkbox"
                                        checked={formData.acceptedPaymentTypes.includes(type)}
                                        onChange={() => canEditPayment && togglePaymentType(type)}
                                        disabled={!canEditPayment}
                                        className="accent-stone-700"
                                    />
                                    <span className="text-sm font-medium text-stone-700">{PAYMENT_TYPE_LABELS[type]}</span>
                                </label>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard title="Parcelamento" description="Máximo de parcelas disponíveis no cartão de crédito." locked={!canEditPayment}>
                        <Field label="Máximo de parcelas">
                            <select
                                value={formData.maxInstallments}
                                onChange={e => canEditPayment && setFormData(p => ({ ...p, maxInstallments: Number(e.target.value) }))}
                                disabled={!canEditPayment}
                                className={cn(inputCls(undefined, !canEditPayment), 'max-w-xs')}
                            >
                                {[1, 2, 3, 4, 6, 9, 12].map(n => (
                                    <option key={n} value={n}>{n === 1 ? 'À vista' : `Até ${n}x`}</option>
                                ))}
                            </select>
                        </Field>
                    </SectionCard>

                    <SectionCard title="Desconto PIX" description="Percentual de desconto aplicado para pagamento via PIX." locked={!canEditPayment}>
                        <Field label="Desconto PIX (%)" hint="Ex: 5 para 5% de desconto. Aplicado automaticamente nos preços exibidos na loja.">
                            <div className="flex items-center gap-2 max-w-xs">
                                <input
                                    type="number"
                                    min={0}
                                    max={20}
                                    step={0.5}
                                    disabled={!canEditPayment}
                                    value={+(formData.pixDiscount * 100).toFixed(2)}
                                    onChange={e => canEditPayment && setFormData(p => ({ ...p, pixDiscount: Number(e.target.value) / 100 }))}
                                    className={cn(inputCls(undefined, !canEditPayment))}
                                />
                                <span className="text-sm text-stone-500 font-medium shrink-0">%</span>
                            </div>
                        </Field>
                    </SectionCard>
                </div>
            )}

            {/* ── Tab: Frete ── */}
            {activeTab === 'frete' && (
                <div className="space-y-4">
                    <SectionCard title="Frete Grátis" description="Defina o valor mínimo de pedido para frete grátis.">
                        <Field label="Valor mínimo para frete grátis" hint="Pedidos acima deste valor qualificam para frete grátis.">
                            <div className="flex items-center gap-2 max-w-xs">
                                <span className="text-sm text-stone-500 font-medium">R$</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={10}
                                    value={formData.freeShippingThreshold}
                                    onChange={e => setFormData(p => ({ ...p, freeShippingThreshold: Number(e.target.value) }))}
                                    className={inputCls()}
                                />
                            </div>
                        </Field>
                    </SectionCard>

                    <SectionCard title="Produtos Relacionados" description="Exiba sugestões de produtos complementares nas páginas de produto.">
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div
                                    onClick={() => setFormData(p => ({ ...p, crossSellEnabled: !p.crossSellEnabled }))}
                                    className={cn(
                                        'relative w-10 h-6 rounded-full transition-colors cursor-pointer',
                                        formData.crossSellEnabled ? 'bg-stone-800' : 'bg-stone-200'
                                    )}
                                >
                                    <div className={cn(
                                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                                        formData.crossSellEnabled ? 'translate-x-5' : 'translate-x-0.5'
                                    )} />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-stone-700">Ativar cross-sell</span>
                                    <p className="text-xs text-stone-500">Mostra produtos relacionados na página do produto</p>
                                </div>
                            </label>

                            {formData.crossSellEnabled && (
                                <Field label="Categoria de sugestão">
                                    <select
                                        value={formData.crossSellCategory}
                                        onChange={e => setFormData(p => ({ ...p, crossSellCategory: e.target.value }))}
                                        className={cn(inputCls(), 'max-w-xs')}
                                    >
                                        <option value="">Selecionar categoria...</option>
                                        {CROSS_SELL_CATEGORIES.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </Field>
                            )}
                        </div>
                    </SectionCard>
                </div>
            )}

        </form>
    );
};

export default StoreSettings;
