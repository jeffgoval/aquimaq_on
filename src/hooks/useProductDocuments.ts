interface ProductDocument {
    id: string;
    title: string;
    file_url: string | null;
    doc_type: 'bula' | 'ficha_tecnica';
}

export function useProductDocuments(_productId: string): { documents: ProductDocument[]; loading: boolean } {
    return { documents: [], loading: false };
}
