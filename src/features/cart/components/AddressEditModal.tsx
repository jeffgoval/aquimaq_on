import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import { maskCEP } from '@/utils/masks';
import { fetchAddressByCEP } from '@/services/addressService';

interface AddressUser {
  address?: {
    zip: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  };
  [key: string]: unknown;
}

interface AddressEditModalProps {
  user: AddressUser;
  onSave: (updatedUser: AddressUser) => Promise<void>;
  onClose: () => void;
}

const emptyAddress = {
  zip: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
};

const AddressEditModal: React.FC<AddressEditModalProps> = ({ user, onSave, onClose }) => {
  const [address, setAddress] = useState(user.address ? { ...emptyAddress, ...user.address } : emptyAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus trap implementation
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab') {
        const container = containerRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      const firstInput = containerRef.current?.querySelector('input');
      if (firstInput) {
        (firstInput as HTMLElement).focus();
      } else {
        const closeBtn = containerRef.current?.querySelector('button[aria-label="Fechar"]');
        (closeBtn as HTMLElement)?.focus();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    setAddress(user.address ? { ...emptyAddress, ...user.address } : emptyAddress);
  }, [user]);

  const handleChange = (field: keyof typeof address, value: string) => {
    if (field === 'zip') value = maskCEP(value);
    if (field === 'state') value = value.toUpperCase().slice(0, 2);
    setAddress((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  useEffect(() => {
    if (address.zip.replace(/\D/g, '').length === 8) {
      let cancelled = false;
      setIsLoadingCep(true);
      fetchAddressByCEP(address.zip)
        .then((data) => {
          if (!cancelled && data) {
            setAddress((prev) => ({
              ...prev,
              street: data.street || prev.street,
              district: data.district || prev.district,
              city: data.city || prev.city,
              state: data.state || prev.state,
            }));
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoadingCep(false);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [address.zip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.street?.trim()) {
      setError('Informe a rua ou logradouro.');
      return;
    }
    if (!address.number?.trim()) {
      setError('O número do endereço é obrigatório para entrega.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await onSave({
        ...user,
        address: {
          zip: address.zip,
          street: address.street,
          number: address.number,
          complement: address.complement ?? '',
          district: address.district,
          city: address.city,
          state: address.state,
        },
      });
      onClose();
    } catch (err) {
      setError('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="address-modal-title">
      <div ref={containerRef} className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 id="address-modal-title" className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-agro-600" size={20} />
            Endereço de Entrega
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
            <div className="relative">
              <input
                type="text"
                value={address.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
                maxLength={9}
                placeholder="00000-000"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
              />
              {isLoadingCep && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-agro-600 animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua / Logradouro</label>
            <input
              type="text"
              value={address.street}
              onChange={(e) => handleChange('street', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input
                type="text"
                value={address.number}
                onChange={(e) => handleChange('number', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <input
                type="text"
                value={address.complement ?? ''}
                onChange={(e) => handleChange('complement', e.target.value)}
                placeholder="Apto, Bloco..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input
              type="text"
              value={address.district}
              onChange={(e) => handleChange('district', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                value={address.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
              <input
                type="text"
                value={address.state}
                onChange={(e) => handleChange('state', e.target.value)}
                maxLength={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none uppercase"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-agro-600 text-white rounded-lg font-medium hover:bg-agro-700 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar endereço'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressEditModal;
