import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart, ChevronLeft, ChevronRight, Trash2, ImageOff, Loader2, LogIn,
    Minus, Plus, MapPin, AlertTriangle, Zap, Package, CalendarDays,
} from 'lucide-react';
import { CartItem, ShippingOption } from '@/types';
import { formatCurrency } from '@/utils/format';
import { calculateItemPrice, calculateItemSubtotal } from '@/utils/price';
import ShippingCalculator from './ShippingCalculator';
import CartProgress from './CartProgress';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import AddressEditModal from './AddressEditModal';
import { ProfileRow } from '@/types/database';

const PIX_DISCOUNT = 0.05;

interface CartProps {
    items: CartItem[];
    cartSubtotal: number;
    shippingCost: number;
    grandTotal: number;
    selectedShipping: ShippingOption | null;
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemoveItem: (id: string) => void;
    onSelectShipping: (option: ShippingOption | null) => void;
    onZipValid?: (rawZip: string) => void;
    onBackToCatalog?: () => void;
    onCheckout?: () => void;
    onScheduledDeliveryChange?: (data: { date: string; notes?: string } | null) => void;
    initialZip?: string;
    isProcessing?: boolean;
}

const Cart: React.FC<CartProps> = ({
    items,
    cartSubtotal,
    shippingCost,
    grandTotal,
    selectedShipping,
    onUpdateQuantity,
    onRemoveItem,
    onSelectShipping,
    onZipValid,
    onCheckout,
    onScheduledDeliveryChange,
    initialZip,
    isProcessing = false,
}) => {
    const navigate = useNavigate();
    const { profile, refreshProfile } = useAuth();
    const { settings } = useStore();
    const FREE_SHIPPING_THRESHOLD = settings?.freeShippingThreshold ?? 350;
    const { showToast } = useToast();
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [wantsScheduled, setWantsScheduled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledNotes, setScheduledNotes] = useState('');

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const outOfStockItems = items.filter(i => (i.stock ?? 0) === 0);
    const hasOutOfStock = outOfStockItems.length > 0;

    const isAddressComplete = (p: ProfileRow | null) =>
        !!(p?.street && p?.number && p?.neighborhood && p?.city && p?.state && p?.zip_code);

    const handleImageError = useCallback((itemId: string) => {
        setImageErrors(prev => new Set(prev).add(itemId));
    }, []);

    const handleBackToCatalog = () => navigate(ROUTES.HOME);

    const handleScheduledToggle = (checked: boolean) => {
        setWantsScheduled(checked);
        if (!checked) {
            setScheduledDate('');
            setScheduledNotes('');
            onScheduledDeliveryChange?.(null);
        }
    };

    const handleScheduledDateChange = (date: string) => {
        setScheduledDate(date);
        if (date) onScheduledDeliveryChange?.({ date, notes: scheduledNotes || undefined });
    };

    const handleScheduledNotesChange = (notes: string) => {
        setScheduledNotes(notes);
        if (scheduledDate) onScheduledDeliveryChange?.({ date: scheduledDate, notes: notes || undefined });
    };

    // ── Empty state ──
    if (items.length === 0) {
        return (
            <div className="max-w-lg mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart size={36} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Carrinho vazio</h2>
                <p className="text-gray-500 mb-8">
                    Navegue pelo catálogo e adicione itens essenciais para sua produção.
                </p>
                <button
                    onClick={handleBackToCatalog}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-agro-600 hover:bg-agro-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                    <Package size={18} />
                    Ver Produtos
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

            {/* ── Header ── */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={handleBackToCatalog}
                    className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100 shrink-0"
                    aria-label="Voltar ao catálogo"
                >
                    <ChevronLeft size={22} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-extrabold text-gray-900 leading-none">Carrinho</h1>
                    <div className="flex items-center gap-1 mt-1 text-xs">
                        <span className="text-agro-600 font-semibold">Carrinho</span>
                        <ChevronRight size={11} className="text-gray-300" />
                        <span className="text-gray-400">Pagamento</span>
                        <ChevronRight size={11} className="text-gray-300" />
                        <span className="text-gray-400">Confirmação</span>
                    </div>
                </div>
                <span className="text-sm text-gray-500 shrink-0">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                </span>
            </div>

            {/* ── Main grid: items left / summary right ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

                {/* ── LEFT: Items + Shipping ── */}
                <div className="space-y-4">
                    <CartProgress items={items} />

                    {/* Item list */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            {items.map(item => {
                                const unitPrice = calculateItemPrice(item);
                                const lineTotal = calculateItemSubtotal(item);
                                const wholesaleActive =
                                    item.wholesaleMinAmount != null &&
                                    item.price * item.quantity >= item.wholesaleMinAmount;

                                return (
                                    <li key={item.id} className="p-4 sm:p-5 flex gap-4">
                                        {/* Image */}
                                        <div className="w-24 h-24 shrink-0 rounded-lg border border-gray-100 overflow-hidden bg-gray-50">
                                            {imageErrors.has(item.id) ? (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <ImageOff size={24} />
                                                </div>
                                            ) : (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    onError={() => handleImageError(item.id)}
                                                />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <p className="text-[11px] font-bold text-agro-600 uppercase tracking-wider">
                                                    {item.category}
                                                </p>
                                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-snug mt-0.5">
                                                    {item.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-sm font-bold text-gray-700">
                                                        {formatCurrency(unitPrice)}
                                                        <span className="text-gray-400 font-normal"> /un.</span>
                                                    </p>
                                                    {wholesaleActive && (
                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                                                            Atacado
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Controls row */}
                                            <div className="flex items-center justify-between mt-3">
                                                {/* Quantity */}
                                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, -1)}
                                                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-r border-gray-200"
                                                        aria-label="Diminuir quantidade"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-10 text-center text-sm font-semibold text-gray-900">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-l border-gray-200"
                                                        aria-label="Aumentar quantidade"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                {/* Line total + remove */}
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-base text-gray-900">
                                                        {formatCurrency(lineTotal)}
                                                    </span>
                                                    <button
                                                        onClick={() => onRemoveItem(item.id)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded"
                                                        aria-label="Remover item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Shipping calculator */}
                    <ShippingCalculator
                        cartTotal={cartSubtotal}
                        items={items}
                        onSelectOption={onSelectShipping}
                        selectedOptionId={selectedShipping?.id}
                        initialZip={initialZip}
                        onZipValid={onZipValid}
                    />

                    {/* Scheduled delivery — only when a carrier (not pickup) is chosen */}
                    {selectedShipping && selectedShipping.id !== 'pickup_store' && (
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={wantsScheduled}
                                    onChange={e => handleScheduledToggle(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-agro-600 focus:ring-agro-500"
                                />
                                <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                    <CalendarDays size={16} className="text-agro-600" />
                                    Agendar dia de entrega
                                </span>
                            </label>
                            {wantsScheduled && (
                                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Data preferida de entrega
                                        </label>
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                                            onChange={e => handleScheduledDateChange(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Horário ou instruções (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={scheduledNotes}
                                            onChange={e => handleScheduledNotesChange(e.target.value)}
                                            placeholder="Ex.: Entregar de manhã, portão azul"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        A data é uma preferência — sujeita à disponibilidade do transportador.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Summary sidebar (sticky) ── */}
                <div className="lg:sticky lg:top-24 lg:self-start space-y-4">

                    {/* Address block */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <MapPin size={15} className="text-agro-600" />
                                Endereço de Entrega
                            </span>
                            {isAddressComplete(profile) && (
                                <button
                                    onClick={() => setShowAddressModal(true)}
                                    className="text-xs text-agro-600 hover:text-agro-700 font-medium hover:underline"
                                >
                                    Editar
                                </button>
                            )}
                        </div>
                        <div className="p-4">
                            {!profile ? (
                                <div className="text-center py-1">
                                    <p className="text-sm text-gray-500 mb-3">Faça login para informar o endereço</p>
                                    <button
                                        onClick={() => navigate(ROUTES.LOGIN)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-agro-600 hover:bg-agro-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        <LogIn size={15} /> Entrar
                                    </button>
                                </div>
                            ) : !isAddressComplete(profile) ? (
                                <div className="text-center py-1">
                                    <p className="text-sm text-amber-700 mb-3 flex items-center justify-center gap-1.5">
                                        <AlertTriangle size={14} /> Endereço necessário para entrega
                                    </p>
                                    <button
                                        onClick={() => setShowAddressModal(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        <MapPin size={15} /> Adicionar endereço
                                    </button>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-700 space-y-0.5">
                                    <p className="font-semibold text-gray-900">
                                        {profile.street}, {profile.number}
                                        {profile.complement ? `, ${profile.complement}` : ''}
                                    </p>
                                    <p>{profile.neighborhood} — {profile.city} / {profile.state}</p>
                                    <p className="text-gray-400 text-xs font-mono">{profile.zip_code}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order summary */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-800">Resumo do Pedido</span>
                        </div>
                        <div className="p-4 space-y-3">

                            {/* Free shipping progress */}
                            {cartSubtotal < FREE_SHIPPING_THRESHOLD && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 mb-1">
                                    <div className="flex justify-between text-xs text-blue-700 mb-1.5">
                                        <span>Frete grátis a partir de {formatCurrency(FREE_SHIPPING_THRESHOLD)}</span>
                                        <span className="font-bold">faltam {formatCurrency(FREE_SHIPPING_THRESHOLD - cartSubtotal)}</span>
                                    </div>
                                    <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {cartSubtotal >= FREE_SHIPPING_THRESHOLD && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-1 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                                    <span>🎉</span> Você ganhou frete grátis!
                                </div>
                            )}

                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
                                <span className="font-medium text-gray-800">{formatCurrency(cartSubtotal)}</span>
                            </div>

                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Frete</span>
                                <span className={selectedShipping ? 'font-medium text-gray-800' : 'text-gray-400 italic'}>
                                    {selectedShipping
                                        ? shippingCost === 0 ? 'Grátis' : formatCurrency(shippingCost)
                                        : 'a calcular'}
                                </span>
                            </div>

                            {/* PIX savings */}
                            {grandTotal > 0 && (
                                <div className="flex items-center justify-between text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                                    <span className="flex items-center gap-1.5">
                                        <Zap size={13} /> Desconto Pix (5%)
                                    </span>
                                    <span className="font-bold">-{formatCurrency(grandTotal * PIX_DISCOUNT)}</span>
                                </div>
                            )}

                            {/* Total */}
                            <div className="border-t border-gray-100 pt-3">
                                <div className="flex items-end justify-between">
                                    <span className="font-bold text-gray-900 text-base">Total</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-extrabold text-gray-900 block leading-none">
                                            {formatCurrency(grandTotal)}
                                        </span>
                                        {grandTotal > 0 && (
                                            <span className="text-xs text-emerald-600 font-medium mt-0.5 block">
                                                ou {formatCurrency(grandTotal * (1 - PIX_DISCOUNT))} no Pix
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── CTA ── */}
                            <div className="pt-2 border-t border-gray-100">
                                {hasOutOfStock && (
                                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                        <p className="font-semibold mb-1 flex items-center gap-1.5">
                                            <AlertTriangle size={14} /> Itens indisponíveis no carrinho
                                        </p>
                                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                                            {outOfStockItems.map(i => (
                                                <li key={i.id}>{i.name} — <span className="font-medium">Esgotado</span></li>
                                            ))}
                                        </ul>
                                        <p className="mt-1.5 text-xs text-red-600">Remova os itens esgotados para continuar.</p>
                                    </div>
                                )}
                                {!profile ? (
                                    <button
                                        onClick={() => navigate(ROUTES.LOGIN)}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-agro-600 hover:bg-agro-700 text-white font-bold rounded-xl transition-colors"
                                    >
                                        <LogIn size={18} /> Entrar para finalizar
                                    </button>
                                ) : !isAddressComplete(profile) ? (
                                    <button
                                        onClick={() => setShowAddressModal(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
                                    >
                                        <MapPin size={18} /> Informar endereço
                                    </button>
                                ) : !selectedShipping ? (
                                    <div>
                                        <p className="text-xs text-center text-amber-700 mb-3 flex items-center justify-center gap-1.5">
                                            <AlertTriangle size={13} />
                                            Selecione uma opção de frete para continuar
                                        </p>
                                        <button
                                            disabled
                                            className="w-full py-3.5 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed"
                                        >
                                            Finalizar Compra
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={onCheckout}
                                        disabled={isProcessing || hasOutOfStock}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-orange-200/60 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Processando...
                                            </>
                                        ) : (
                                            'Finalizar Compra'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Continue shopping */}
                    <button
                        onClick={handleBackToCatalog}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-400 hover:text-agro-600 transition-colors"
                    >
                        <ChevronLeft size={14} /> Continuar comprando
                    </button>
                </div>
            </div>

            {/* Address modal */}
            {showAddressModal && profile && (
                <AddressEditModal
                    user={{
                        ...profile,
                        address: {
                            street: profile.street || '',
                            number: profile.number || '',
                            complement: profile.complement || '',
                            district: profile.neighborhood || '',
                            city: profile.city || '',
                            state: profile.state || '',
                            zip: profile.zip_code || initialZip || '',
                        },
                    }}
                    onClose={() => setShowAddressModal(false)}
                    onSave={async (updatedData: any) => {
                        const addr = updatedData.address;
                        const { error } = await supabase
                            .from('profiles')
                            .update({
                                street: addr.street,
                                number: addr.number,
                                complement: addr.complement,
                                neighborhood: addr.district,
                                city: addr.city,
                                state: addr.state,
                                zip_code: addr.zip,
                            } as any)
                            .eq('id', profile.id);

                        if (error) {
                            showToast('Erro ao salvar endereço. Tente novamente.', 'error');
                            throw error;
                        }
                        await refreshProfile();
                        showToast('Endereço salvo!', 'success');
                        setShowAddressModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default Cart;
