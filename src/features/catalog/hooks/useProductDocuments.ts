import { useState, useEffect } from 'react';
import { getProductDocuments, type ProductDocument } from '@/services/productService';

export type { ProductDocument } from '@/services/productService';

export const useProductDocuments = (productId: string | undefined) => {
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const data = await getProductDocuments(productId);
        if (isMounted) setDocuments(data);
      } catch {
        if (isMounted) setDocuments([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDocuments();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  return { documents, loading };
};
