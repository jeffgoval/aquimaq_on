import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export interface ProductDocument {
  id: string;
  file_url: string | null;
  doc_type: string;
  title: string;
}

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
        const { data, error } = await supabase
          .from('product_documents')
          .select('id, file_url, doc_type, title')
          .eq('product_id', productId)
          .order('doc_type', { ascending: true });

        if (error) {
          console.warn('product_documents:', error.message);
          if (isMounted) setDocuments([]);
          return;
        }
        if (isMounted && data) {
          setDocuments((data as ProductDocument[]) ?? []);
        }
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
