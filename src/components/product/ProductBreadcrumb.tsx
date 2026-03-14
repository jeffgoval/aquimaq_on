import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { ProductCategory } from '@/types';

interface ProductBreadcrumbProps {
  category: ProductCategory;
  productName: string;
}

export const ProductBreadcrumb: React.FC<ProductBreadcrumbProps> = ({ category, productName }) => (
  <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 flex-wrap">
    <Link to={ROUTES.HOME} className="hover:text-agro-700 transition-colors shrink-0">
      Início
    </Link>
    <ChevronRight size={14} className="text-gray-300 shrink-0" />
    <Link to={ROUTES.HOME} className="hover:text-agro-700 transition-colors truncate max-w-[160px]">
      {category}
    </Link>
    <ChevronRight size={14} className="text-gray-300 shrink-0" />
    <span className="text-gray-800 font-medium truncate max-w-[240px]">{productName}</span>
  </nav>
);
