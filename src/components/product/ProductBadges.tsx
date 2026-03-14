import React from 'react';
import { Zap, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { SeasonalStatus } from '@/utils/cropCalendar';
import { SEASONAL_STATUS_LABEL, SEASONAL_STATUS_COLORS } from '@/utils/cropCalendar';

interface ProductBadgesProps {
  isNew?: boolean;
  isBestSeller?: boolean;
  discount?: number;
  seasonalStatus: SeasonalStatus | null;
}

export const ProductBadges: React.FC<ProductBadgesProps> = ({
  isNew,
  isBestSeller,
  discount,
  seasonalStatus,
}) => {
  const hasAny = isNew || isBestSeller || discount || seasonalStatus;
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {isNew && (
        <Badge variant="new">
          <Zap size={11} /> Novo
        </Badge>
      )}
      {isBestSeller && (
        <Badge variant="bestSeller">
          <Tag size={11} /> Mais Vendido
        </Badge>
      )}
      {discount != null && discount > 0 && (
        <Badge variant="discount">-{discount}% OFF</Badge>
      )}
      {seasonalStatus && (
        <Badge variant="seasonal" className={SEASONAL_STATUS_COLORS[seasonalStatus]}>
          🌱 {SEASONAL_STATUS_LABEL[seasonalStatus]}
        </Badge>
      )}
    </div>
  );
};
