import React, { useState, useEffect } from 'react';
import {
  listDocuments,
  deleteDocument,
  reindexProduct,
  uploadDocument,
  type KBEntry,
} from '@/services/knowledgeBaseService';
import { supabase } from '@/services/supabase';
import { BookOpen, Upload, RefreshCw, Search, Trash2, FileText, Database } from 'lucide-react';

const AdminKnowledgeBase: React.FC = () => {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Product search state
  const [productIds, setProductIds] = useState<{ id: string; name: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [reindexing, setReindexing] = useState<string | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listDocuments();
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar base de conhecimento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      let query = supabase.from('products').select('id, name').order('name');
      if (productSearch.trim()) {
        query = query.ilike('name', `%${productSearch}%`);
      }
      const { data } = await query.limit(50);
      setProductIds((data ?? []).map((r) => ({ id: r.id, name: r.name ?? '' })));
    };

    const timeout = setTimeout(loadProducts, 300);
    return () => clearTimeout(timeout);
  }, [productSearch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta entrada da base de conhecimento?')) return;
    try {
      await deleteDocument(id);
      await loadEntries();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover documento');
    }
  };

  const handleReindex = async () => {
    if (!selectedProductId) return;
    setReindexing(selectedProductId);
    setError(null);
    try {
      await reindexProduct(selectedProductId);
      await loadEntries();
      setSelectedProductId('');
      setProductSearch('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao reindexar produto');
    } finally {
      setReindexing(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        // Load pdfjs dinamically to keep the bundle small
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        extractedText = fullText;
      }

      await uploadDocument(file, { title: file.name, extractedText });
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload do documento');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
            <Database className="text-stone-400" size={24} />
            Base de Conhecimento
          </h1>
          <p className="text-stone-400 text-[13px] mt-0.5">Gerencie os documentos e produtos indexados pela IA</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-[13px] border border-red-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
          {error}
        </div>
      )}

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Card */}
        <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm flex flex-col justify-center">
          <h3 className="text-[14px] font-medium text-stone-800 mb-1">Adicionar Documento</h3>
          <p className="text-[12px] text-stone-500 mb-4">Faça upload de PDFs, manuais ou textos (.pdf, .txt, .doc)</p>

          <label className={`
                flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-stone-300 
                text-[13px] font-medium transition-colors cursor-pointer
                ${uploading ? 'bg-stone-50 text-stone-400 cursor-not-allowed' : 'bg-stone-50/50 text-stone-600 hover:bg-stone-100 hover:text-stone-800'}
            `}>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading ? (
              <><RefreshCw size={16} className="animate-spin" /> Processando arquivo...</>
            ) : (
              <><Upload size={16} /> Selecionar Arquivo</>
            )}
          </label>
        </div>

        {/* Reindex Card */}
        <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm">
          <h3 className="text-[14px] font-medium text-stone-800 mb-1">Buscar e Reindexar Produto</h3>
          <p className="text-[12px] text-stone-500 mb-3">Atualize um produto específico na base de conhecimento</p>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-stone-400" size={14} />
              <input
                type="text"
                placeholder="Pesquisar produto por nome..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <select
                className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] text-stone-700 focus:outline-none focus:border-stone-400 disabled:opacity-50"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                disabled={!!reindexing}
              >
                <option value="">Selecione um produto...</option>
                {productIds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name.length > 40 ? p.name.slice(0, 40) + '...' : p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleReindex}
                disabled={!selectedProductId || !!reindexing}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg text-[13px] font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {reindexing ? (
                  <><RefreshCw size={14} className="animate-spin" /> Indexando</>
                ) : (
                  <><RefreshCw size={14} /> Reindexar</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-stone-50">
          <h2 className="text-[14px] font-medium text-stone-800 flex items-center gap-2">
            <BookOpen size={16} className="text-stone-400" />
            Documentos Indexados ({entries.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500 mb-2"></div>
            <p className="text-stone-400 text-[13px]">Carregando base de conhecimento...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center mx-auto mb-3">
              <FileText size={24} className="text-stone-300" />
            </div>
            <p className="text-stone-500 text-[13px] font-medium">Nenhum documento encontrado.</p>
            <p className="text-stone-400 text-[12px] mt-1">Faça upload de um arquivo ou reindexe um produto.</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-50">
            {entries.map((entry) => (
              <li key={entry.id} className="p-5 flex justify-between items-start gap-4 hover:bg-stone-25 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[14px] text-stone-800 truncate flex items-center gap-2">
                    <FileText size={14} className="text-stone-400" />
                    {entry.title ?? entry.id}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-stone-100 text-stone-500">
                      {entry.sourceType}
                    </span>
                    {entry.sourceId && (
                      <span className="text-[11px] font-mono text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">
                        ID: {entry.sourceId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-stone-500 line-clamp-2 leading-relaxed bg-stone-50 p-3 rounded border border-stone-100 italic">
                    "{entry.content.slice(0, 200)}..."
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                  title="Remover documento"
                >
                  <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminKnowledgeBase;
