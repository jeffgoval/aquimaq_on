import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Truck, CreditCard, RefreshCcw, Users } from 'lucide-react';
import { Product } from '@/types';
import type { CartItemForShipping } from '@/services/shippingService';
import ProductGallery from './ProductGallery';
import StarRating from './StarRating';
import SectionErrorBoundary from './SectionErrorBoundary';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import RecommendationsByPhase from './RecommendationsByPhase';
import { useCropCalendar } from '@/features/catalog';
import { useStore } from '@/contexts/StoreContext';
import ProductSEO from './product/ProductSEO';
import { ROUTES } from '@/constants/routes';
import { calculateShipping } from '@/services/shippingService';
import { validateCEP } from '@/utils/validators';
import { maskCEP } from '@/utils/masks';
import { getSeasonalStatus, formatMonthRange } from '@/utils/cropCalendar';
import { upsertStockNotification } from '@/services/stockNotificationService';
import { useAuth } from '@/contexts/AuthContext';

import { ProductBreadcrumb } from './product/ProductBreadcrumb';
import { ProductTrustSeals, type TrustSealItem } from './product/ProductTrustSeals';
import { ProductBadges } from './product/ProductBadges';
import { ProductPriceBlock } from './product/ProductPriceBlock';
import { ProductStockNotify, type NotifyState } from './product/ProductStockNotify';
import { ProductShippingEstimator } from './product/ProductShippingEstimator';
import { ProductTabs, type ProductTabId } from './product/ProductTabs';
import { ProductCTAs } from './product/ProductCTAs';
import { ProductStickyFooter } from './product/ProductStickyFooter';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const { settings } = useStore();
  const { user, profile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [notifyState, setNotifyState] = useState<NotifyState>('idle');
  const [activeTab, setActiveTab] = useState<ProductTabId>('descricao');
  const [showStickyFooter, setShowStickyFooter] = useState(false);
  const [cep, setCep] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<import('@/types').ShippingOption[]>([]);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingCalculated, setShippingCalculated] = useState(false);

  const ctaRef = useRef<HTMLDivElement>(null);
  const { cultures: availableCultures, rows: calendarRows } = useCropCalendar();
  const maxInstallments = settings?.maxInstallments ?? 12;

  useEffect(() => {
    setQuantity(1);
    setActiveTab('descricao');
    setShippingCalculated(false);
    setShippingOptions([]);
    setShippingError(null);
    setCep('');
    setNotifyState('idle');
  }, [product.id]);

  const handleNotify = async () => {
    if (!user || !profile?.email) {
      navigate(ROUTES.LOGIN);
      return;
    }
    setNotifyState('loading');
    const { error } = await upsertStockNotification(product.id, user.id, profile.email);
    setNotifyState(error ? 'error' : 'done');
  };

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyFooter(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const galleryImages = (
    product.gallery ? [product.imageUrl, ...product.gallery] : [product.imageUrl]
  ).filter(Boolean) as string[];

  const cropRow = product.culture
    ? calendarRows.find((r) => r.culture === product.culture)
    : undefined;
  const currentMonth = new Date().getMonth() + 1;
  const seasonalStatus = getSeasonalStatus(cropRow, currentMonth);

  const handleCalculateShipping = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const rawCep = cep.replace(/\D/g, '');
      if (!validateCEP(cep)) {
        setShippingError('CEP inválido. Digite 8 dígitos.');
        return;
      }
      setShippingLoading(true);
      setShippingError(null);
      try {
        const shippingItems: CartItemForShipping[] = [
          {
            id: product.id,
            name: product.name,
            quantity,
            price: product.price,
            weight: product.weight,
            width: product.width,
            height: product.height,
            length: product.length,
          },
        ];
        const { options, error } = await calculateShipping(rawCep, shippingItems);
        setShippingOptions(options);
        setShippingCalculated(true);
        if (error) setShippingError(error);
      } catch {
        setShippingError('Não foi possível calcular o frete.');
      } finally {
        setShippingLoading(false);
      }
    },
    [cep, product, quantity]
  );

  const tabs: { id: ProductTabId; label: string }[] = [
    { id: 'descricao', label: 'Descrição' },
    ...(product.technicalSpecs
      ? [{ id: 'especificacoes' as ProductTabId, label: 'Especificações' }]
      : []),
  ];

  const trustSeals: TrustSealItem[] = [
    { icon: ShieldCheck as React.ComponentType<{ size?: number; className?: string }>, label: 'Compra Segura' },
    { icon: Truck as React.ComponentType<{ size?: number; className?: string }>, label: 'Entrega Brasil' },
    { icon: CreditCard as React.ComponentType<{ size?: number; className?: string }>, label: `${maxInstallments}x Sem Juros` },
    { icon: RefreshCcw as React.ComponentType<{ size?: number; className?: string }>, label: 'Troca Fácil' },
  ];

  const handleBuyNow = useCallback(
    (p: Product, q: number) => {
      onAddToCart(p, q);
      navigate(ROUTES.CART);
    },
    [onAddToCart, navigate]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <ProductSEO product={product} />
      <ProductBreadcrumb category={product.category} productName={product.name} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={galleryImages} productName={product.name} />
          <ProductTrustSeals seals={trustSeals} variant="desktop" />
        </div>

        <div className="flex flex-col gap-5">
          <ProductBadges
            isNew={product.isNew}
            isBestSeller={product.isBestSeller}
            discount={product.discount}
            seasonalStatus={seasonalStatus}
          />

          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-agro-700 uppercase tracking-widest">
              {product.category}
            </span>
            {product.sku && (
              <span className="text-sm text-gray-500">
                Cód.: <span className="font-semibold text-gray-700">{product.sku}</span>
              </span>
            )}
            {product.brand && (
              <span className="text-sm text-gray-500">
                Marca: <span className="font-semibold text-gray-700">{product.brand}</span>
              </span>
            )}
            {cropRow && (
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-gray-500">
                <span>
                  🌱 Plantio:{' '}
                  <span className="font-semibold text-gray-700">
                    {formatMonthRange(cropRow.month_plant_start, cropRow.month_plant_end)}
                  </span>
                </span>
                <span>
                  🌾 Colheita:{' '}
                  <span className="font-semibold text-gray-700">
                    {formatMonthRange(cropRow.month_harvest_start, cropRow.month_harvest_end)}
                  </span>
                </span>
              </div>
            )}
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight">
            {product.name}
          </h1>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={product.rating} count={product.reviewCount} size={16} />
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Users size={12} /> {product.reviewCount} avaliações
              </span>
            </div>
          )}

          <ProductPriceBlock
            price={product.price}
            oldPrice={product.oldPrice}
            discount={product.discount}
            maxInstallments={maxInstallments}
            wholesaleMinAmount={product.wholesaleMinAmount}
            wholesaleDiscountPercent={product.wholesaleDiscountPercent}
          />

          <ProductStockNotify
            stock={product.stock}
            notifyState={notifyState}
            onNotify={handleNotify}
          />

          <ProductCTAs
            product={product}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAddToCart={onAddToCart}
            onBuyNow={handleBuyNow}
            ctaRef={ctaRef}
          />

          <ProductShippingEstimator
            cep={cep}
            onCepChange={setCep}
            onShippingErrorClear={() => setShippingError(null)}
            shippingLoading={shippingLoading}
            shippingError={shippingError}
            shippingCalculated={shippingCalculated}
            shippingOptions={shippingOptions}
            onCalculateShipping={handleCalculateShipping}
          />

          <ProductTrustSeals seals={trustSeals} variant="mobile" />

          <ProductTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            description={product.description}
            technicalSpecs={product.technicalSpecs}
          />
        </div>
      </div>

      <div className="mt-16 space-y-0">
        <SectionErrorBoundary>
          <ProductReviews product={product} />
        </SectionErrorBoundary>
        <SectionErrorBoundary>
          <RelatedProducts currentProduct={product} onAddToCart={onAddToCart} />
        </SectionErrorBoundary>
        {product.culture && (
          <SectionErrorBoundary>
            <RecommendationsByPhase
              phase={product.culture}
              availablePhases={availableCultures}
              excludeProductId={product.id}
              onAddToCart={onAddToCart}
              limit={4}
            />
          </SectionErrorBoundary>
        )}
      </div>

      {showStickyFooter && (
        <ProductStickyFooter
          product={product}
          quantity={quantity}
          onAddToCart={onAddToCart}
          onBuyNow={handleBuyNow}
        />
      )}
    </div>
  );
};

export default ProductDetail;
