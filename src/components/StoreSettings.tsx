import React, { useState, useEffect } from 'react';
import { Save, Store, MapPin, FileText, Phone, Upload } from 'lucide-react';
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
    cnpj: string;
    phone: string;
    address: {
        zip: string;
        street: string;
        number: string;
        complement: string;
        district: string;
        city: string;
        state: string;
    };
    logoUrl?: string;
}

const StoreSettings: React.FC<StoreSettingsProps> = ({ onBack }) => {
    const { settings, isLoading: isLoadingSettings, saveSettings } = useStoreSettings();
    const [formData, setFormData] = useState<StoreConfig>({
        storeName: '',
        cnpj: '',
        phone: '',
        address: {
            zip: '',
            street: '',
            number: '',
            complement: '',
            district: '',
            city: '',
            state: ''
        },
        logoUrl: ''
    });

    // Sync formData with loaded settings (camelCase)
    useEffect(() => {
        if (settings) {
            setFormData({
                storeName: settings.storeName,
                cnpj: maskDocument(settings.cnpj || ''),
                phone: maskPhone(settings.phone || ''),
                address: {
                    zip: maskCEP(settings.address.zip || ''),
                    street: settings.address.street || '',
                    number: settings.address.number || '',
                    complement: settings.address.complement || '',
                    district: settings.address.district || '',
                    city: settings.address.city || '',
                    state: settings.address.state || ''
                },
                logoUrl: settings.logoUrl || ''
            });
        }
    }, [settings]);

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
            cnpj: formData.cnpj.replace(/\D/g, ''),
            phone: formData.phone.replace(/\D/g, ''),
            address: {
                zip: formData.address.zip.replace(/\D/g, ''),
                street: formData.address.street,
                number: formData.address.number,
                complement: formData.address.complement,
                district: formData.address.district,
                city: formData.address.city,
                state: formData.address.state
            },
            logoUrl: formData.logoUrl || undefined
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
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-agro-600 mb-4"></div>
                        <p className="text-gray-600 font-medium">Carregando configurações...</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                                <Store className="text-agro-600" size={32} />
                                Configurações da Loja
                            </h1>
                            <p className="text-gray-500 mt-2">Defina os dados da empresa e endereço de origem para frete.</p>
                        </div>
                        <button
                            onClick={onBack}
                            className="text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Voltar
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-8 space-y-8">

                            {message && (
                                <div className={`p-4 rounded-xl text-sm flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {message.text}
                                </div>
                            )}

                            {/* Dados da Empresa */}
                            <section className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Informações da Empresa</h3>

                                <div className="flex flex-col items-center sm:flex-row gap-6 mb-6">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full border-4 border-gray-100 overflow-hidden flex items-center justify-center bg-gray-50">
                                            {formData.logoUrl ? (
                                                <img src={formData.logoUrl} alt="Logo da Loja" className="w-full h-full object-cover" />
                                            ) : (
                                                <Store size={48} className="text-gray-300" />
                                            )}
                                        </div>
                                        <label className="absolute bottom-0 right-0 bg-agro-600 text-white p-2 rounded-full cursor-pointer hover:bg-agro-700 transition-colors shadow-lg">
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
                                        <h4 className="font-semibold text-gray-900">Logo da Loja</h4>
                                        <p className="text-sm text-gray-500 mb-2">Recomendado: 500x500px, PNG ou JPG.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Nome da Loja</label>
                                        <div className="relative">
                                            <Store className="absolute left-3.5 top-3 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                name="storeName"
                                                value={formData.storeName}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">CNPJ</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3.5 top-3 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                name="cnpj"
                                                value={formData.cnpj}
                                                onChange={handleChange}
                                                maxLength={18}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Telefone de Contato</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-3 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                maxLength={15}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Endereço de Origem (Frete) */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <MapPin className="text-agro-600" size={20} />
                                        Endereço de Origem (Estoque)
                                    </h3>
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Usado para cálculo de frete</span>
                                </div>

                                <div className="grid grid-cols-12 gap-x-4 gap-y-6">
                                    {/* CEP */}
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">CEP</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.address.zip}
                                                onChange={(e) => handleAddressChange('zip', e.target.value)}
                                                maxLength={9}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                            />
                                            {isLoadingAddress && (
                                                <div className="absolute right-3 top-2.5">
                                                    <div className="w-5 h-5 border-2 border-agro-500 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rua */}
                                    <div className="col-span-12 md:col-span-9 space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Logradouro</label>
                                        <input
                                            type="text"
                                            value={formData.address.street}
                                            onChange={(e) => handleAddressChange('street', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                        />
                                    </div>

                                    {/* Número */}
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Número</label>
                                        <input
                                            type="text"
                                            value={formData.address.number}
                                            onChange={(e) => handleAddressChange('number', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                        />
                                    </div>

                                    {/* Complemento */}
                                    <div className="col-span-12 md:col-span-5 space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Complemento</label>
                                        <input
                                            type="text"
                                            value={formData.address.complement}
                                            onChange={(e) => handleAddressChange('complement', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                        />
                                    </div>

                                    {/* Bairro */}
                                    <div className="col-span-12 md:col-span-4 space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Bairro</label>
                                        <input
                                            type="text"
                                            value={formData.address.district}
                                            onChange={(e) => handleAddressChange('district', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                        />
                                    </div>

                                    {/* Cidade */}
                                    <div className="col-span-12 md:col-span-9 space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Cidade</label>
                                        <input
                                            type="text"
                                            value={formData.address.city}
                                            onChange={(e) => handleAddressChange('city', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                        />
                                    </div>

                                    {/* UF */}
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">UF</label>
                                        <input
                                            type="text"
                                            maxLength={2}
                                            value={formData.address.state}
                                            onChange={(e) => handleAddressChange('state', e.target.value.toUpperCase())}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-agro-600 text-white rounded-xl font-bold hover:bg-agro-700 shadow-lg shadow-agro-600/20 transition-all flex items-center hover:-translate-y-0.5"
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

