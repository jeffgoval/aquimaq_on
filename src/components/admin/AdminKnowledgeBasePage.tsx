import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, RefreshCw, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { getProductDocuments, deleteProductDocument, processProductDocument, ProductDocument } from '@/services/productDocumentsService';
import { supabase } from '@/services/supabase';

interface DocWithProduct extends ProductDocument {
  product_name?: string;
}

const AdminKnowledgeBasePage: React.FC = () => {
  const [docs, setDocs] = useState<DocWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('id, name');
      if (pErr) throw pErr;

      const productMap = new Map((products ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));

      const allDocs: DocWithProduct[] = [];
      for (const product of products ?? []) {
        const pdocs = await getProductDocuments(product.id);
        pdocs.forEach(d => allDocs.push({ ...d, product_name: productMap.get(d.product_id) }));
      }
      allDocs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDocs(allDocs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleReprocess = async (doc: DocWithProduct) => {
    setProcessingIds(prev => new Set(prev).add(doc.id));
    try {
      await processProductDocument(doc.id);
      await fetchDocs();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao reprocessar');
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(doc.id); return s; });
    }
  };

  const handleDelete = async (doc: DocWithProduct) => {
    if (!confirm(`Remover "${doc.title}" da base de conhecimento?`)) return;
    setDeletingIds(prev => new Set(prev).add(doc.id));
    try {
      await deleteProductDocument(doc.id, doc.file_url);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao remover');
    } finally {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(doc.id); return s; });
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const StatusBadge = ({ processed }: { processed: boolean }) => (
    processed
      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700"><CheckCircle size={11} />Indexado</span>
      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700"><Clock size={11} />Pendente</span>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-stone-600" />
          <h1 className="text-lg font-semibold text-stone-800">Base de Conhecimento</h1>
        </div>
        <button
          onClick={fetchDocs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-stone-400 text-sm">Carregando...</div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-stone-400 text-sm gap-2">
          <BookOpen size={32} className="opacity-30" />
          <p>Nenhum documento na base de conhecimento.</p>
          <p className="text-xs">Faça upload de PDFs nas páginas de cada produto.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Documento</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Produto</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Tamanho</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Status IA</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {docs.map(doc => (
                <tr key={doc.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800 truncate max-w-[220px]">{doc.title}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5 truncate max-w-[220px]">{doc.file_name}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600 text-[13px] max-w-[180px] truncate">{doc.product_name ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-500 text-[13px]">{formatSize(doc.file_size)}</td>
                  <td className="px-4 py-3"><StatusBadge processed={doc.processed} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReprocess(doc)}
                        disabled={processingIds.has(doc.id)}
                        title="Reprocessar"
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded disabled:opacity-40"
                      >
                        <RefreshCw size={14} className={processingIds.has(doc.id) ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingIds.has(doc.id)}
                        title="Remover"
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-stone-100 bg-stone-50 text-[11px] text-stone-400">
            {docs.length} documento{docs.length !== 1 ? 's' : ''} · {docs.filter(d => d.processed).length} indexado{docs.filter(d => d.processed).length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKnowledgeBasePage;
