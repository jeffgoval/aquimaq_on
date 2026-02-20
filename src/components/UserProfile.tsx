import React, { useState } from 'react';
import { Cliente } from '@/types';
import {
  User,
  Phone,
  FileText,
  Building,
  MapPin,
  Save,
  LogOut,
  Camera,
  Mail,
  Edit2
} from 'lucide-react';
import { maskCEP, maskDocument, maskPhone } from '@/utils/masks';
import { validateCPF, validateCNPJ } from '@/utils/validators';
import { fetchAddressByCEP } from '@/services/addressService';


interface UserProfileProps {
  user: Cliente;
  onUpdateUser: (updatedUser: Cliente) => Promise<void>;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser, onLogout }) => {
  const [formData, setFormData] = useState<Cliente>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  React.useEffect(() => {
    setFormData({
      ...user,
      phone: maskPhone(user.phone || ''),
      document: maskDocument(user.document || ''),
      address: user.address ? {
        ...user.address,
        zip: maskCEP(user.address.zip || '')
      } : undefined
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'phone') formattedValue = maskPhone(value);
    if (name === 'document') formattedValue = maskDocument(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleAddressChange = async (field: string, value: string) => {
    let formattedValue = value;
    if (field === 'zip') formattedValue = maskCEP(value);

    setFormData(prev => {
      const currentAddress = prev.address || {
        zip: '',
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: ''
      };

      return {
        ...prev,
        address: {
          ...currentAddress,
          [field]: formattedValue
        }
      };
    });

    // Auto-fetch address if CEP is complete
    if (field === 'zip' && formattedValue.length === 9) {
      setIsLoadingAddress(true);
      const addressData = await fetchAddressByCEP(formattedValue);
      setIsLoadingAddress(false);

      if (addressData) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address!,
            street: addressData.street,
            district: addressData.district,
            city: addressData.city,
            state: addressData.state,
            complement: addressData.complement || prev.address?.complement || ''
          }
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validations
      const cleanDoc = formData.document?.replace(/\D/g, '') || '';
      if (cleanDoc) {
        const isValidDoc = cleanDoc.length <= 11 ? validateCPF(cleanDoc) : validateCNPJ(cleanDoc);
        if (!isValidDoc) {
          setMessage({ type: 'error', text: 'CPF ou CNPJ inválido. Verifique os números.' });
          setIsLoading(false);
          return;
        }
      }

      if (formData.address?.street && !formData.address.number) {
        setMessage({ type: 'error', text: 'O número do endereço é obrigatório para entrega.' });
        setIsLoading(false);
        return;
      }

      await onUpdateUser(formData);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao salvar.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Minha Conta</h1>
        <p className="text-gray-500 mt-2">Gerencie seus dados pessoais e preferências.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Summary & Actions */}
        <div className="lg:col-span-4 space-y-6">

          {/* Main Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
            <div className="h-24 bg-gradient-to-r from-agro-600 to-emerald-600"></div>
            <div className="px-6 pb-6 text-center relative">
              <div className="relative inline-block -mt-12 mb-4">
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-sm border border-gray-200 text-gray-600 hover:text-agro-600 transition-colors" title="Alterar foto">
                  <Camera size={14} />
                </button>
              </div>

              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500 mb-6 capitalize">
                {user.role === 'admin' && 'Desenvolvedor'}
                {user.role === 'gerente' && 'Gerente'}
                {user.role === 'vendedor' && 'Vendedor'}
                {user.role === 'cliente' && 'Cliente'}
                {!user.role && 'Cliente'}
              </p>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <Mail size={16} className="mr-3 text-gray-400" />
                  <span className="truncate">{user.email || 'email@exemplo.com'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <Phone size={16} className="mr-3 text-gray-400" />
                  <span>{user.phone || 'Sem telefone'}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-red-100 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all duration-200 font-medium text-sm group-hover:shadow-sm"
                >
                  <LogOut size={16} className="mr-2" />
                  Sair da Conta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Forms & Address */}
        <div className="lg:col-span-8 space-y-6">

          {/* Personal Data Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Dados Pessoais</h3>
                <p className="text-sm text-gray-500">Mantenha seus dados atualizados.</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center text-sm text-agro-600 hover:text-agro-700 font-medium bg-agro-50 hover:bg-agro-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Edit2 size={14} className="mr-2" />
                  Editar
                </button>
              )}
            </div>

            <div className="p-8">
              {message && (
                <div className={`mb-6 p-4 rounded-xl text-sm flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nome Completo</label>
                    <div className="relative group">
                      <User size={18} className={`absolute left-3.5 top-3 text-gray-400 transition-colors ${isEditing ? 'group-focus-within:text-agro-500' : ''}`} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Telefone / WhatsApp</label>
                    <div className="relative group">
                      <Phone size={18} className={`absolute left-3.5 top-3 text-gray-400 transition-colors ${isEditing ? 'group-focus-within:text-agro-500' : ''}`} />
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength={15}
                        disabled={!isEditing}
                        placeholder="(00) 00000-0000"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">CPF / CNPJ</label>
                    <div className="relative group">
                      <FileText size={18} className={`absolute left-3.5 top-3 text-gray-400 transition-colors ${isEditing ? 'group-focus-within:text-agro-500' : ''}`} />
                      <input
                        type="text"
                        name="document"
                        value={formData.document}
                        onChange={handleChange}
                        maxLength={18}
                        disabled={!isEditing}
                        placeholder="000.000.000-00"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                      />
                    </div>
                  </div>

                  {!['gerente', 'admin'].includes(user.role || '') && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Inscrição Estadual</label>
                      <div className="relative group">
                        <Building size={18} className={`absolute left-3.5 top-3 text-gray-400 transition-colors ${isEditing ? 'group-focus-within:text-agro-500' : ''}`} />
                        <input
                          type="text"
                          name="stateRegistration"
                          value={formData.stateRegistration || ''}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Isento"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-gray-100 mt-6">
                  <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-agro-600" />
                    {['gerente', 'admin'].includes(user.role || '') ? 'Endereço' : 'Endereço de Entrega'}
                  </h3>

                  <div className="grid grid-cols-12 gap-x-4 gap-y-6">
                    {/* CEP - 3 cols */}
                    <div className="col-span-12 md:col-span-3 space-y-2">
                      <label className="text-sm font-semibold text-gray-700">CEP</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.address?.zip || ''}
                          onChange={(e) => handleAddressChange('zip', e.target.value)}
                          maxLength={9}
                          disabled={!isEditing || isLoadingAddress}
                          placeholder="00000-000"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                        />
                        {isLoadingAddress && (
                          <div className="absolute right-3 top-2.5">
                            <div className="w-5 h-5 border-2 border-agro-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rua - 9 cols */}
                    <div className="col-span-12 md:col-span-9 space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={formData.address?.street || ''}
                        onChange={(e) => handleAddressChange('street', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                      />
                    </div>

                    {/* Número - 3 cols */}
                    <div className="col-span-12 md:col-span-3 space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Número</label>
                      <input
                        type="text"
                        value={formData.address?.number || ''}
                        onChange={(e) => handleAddressChange('number', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                      />
                    </div>

                    {/* Complemento - 5 cols */}
                    <div className="col-span-12 md:col-span-5 space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Complemento</label>
                      <input
                        type="text"
                        value={formData.address?.complement || ''}
                        onChange={(e) => handleAddressChange('complement', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Apto, Bloco, etc."
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                      />
                    </div>

                    {/* Bairro - 4 cols */}
                    <div className="col-span-12 md:col-span-4 space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Bairro</label>
                      <input
                        type="text"
                        value={formData.address?.district || ''}
                        onChange={(e) => handleAddressChange('district', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                      />
                    </div>

                    {/* Cidade - 9 cols */}
                    <div className="col-span-12 md:col-span-9 space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Cidade</label>
                      <input
                        type="text"
                        value={formData.address?.city || ''}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                      />
                    </div>

                    {/* UF - 3 cols */}
                    <div className="col-span-12 md:col-span-3 space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Estado (UF)</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={formData.address?.state || ''}
                        onChange={(e) => handleAddressChange('state', e.target.value.toUpperCase())}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all outline-none"
                      />
                    </div>

                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end pt-8 gap-3 animate-fade-in-up">
                    <button
                      type="button"
                      onClick={() => { setIsEditing(false); setFormData(user); }}
                      className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 bg-agro-600 text-white rounded-xl font-medium hover:bg-agro-700 shadow-md shadow-agro-600/20 flex items-center transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                          Salvando...
                        </span>
                      ) : (
                        <><Save size={18} className="mr-2" /> Salvar Alterações</>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

