import React, { useState, useEffect } from 'react';
import {
  Brain, FileText, Trash2, Loader2, CheckCircle, RefreshCw,
  Download, Search, Package, AlertCircle,
} from 'lucide-react';
import {
  ProductDocumentWithProduct,
  getAllDocuments,
  processProductDocument,
  deleteProductDocument,
} from '@/services/productDocumentsService';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AdminKnowledgeBasePage: React.FC = () => {
  const [documents, setDocuments] = useState<ProductDocumentWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDocuments(await getAllDocuments());
    } catch {
      setError('Erro ao carregar a base de conhecimento.');
    } finally {
      setLoading(false);
    }
  }

  async function handleProcess(docId: string) {
    setProcessing(docId);
    setError(null);
    try {
      await processProductDocument(docId);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, processed: true } : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar documento.');
    } finally {
      setProcessing(null);
    }
  }

  async function handleDelete(doc: ProductDocumentWithProduct) {
    if (!confirm(`Remover "${doc.title}"?\nIsso também remove os dados de IA associados.`)) return;
    setDeleting(doc.id);
    try {
      await deleteProductDocument(doc.id, doc.file_url);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover documento.');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = documents.filter(d => {
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.product_name ?? '').toLowerCase().includes(q) ||
      d.file_name.toLowerCase().includes(q)
    );
  });

  const totalProcessed = documents.filter(d => d.processed).length;
  const totalPending = documents.filter(d => !d.processed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
          <Brain size={20} className="text-stone-500" />
          Base de Conhecimento
        </h1>
        <p className="text-[13px] text-stone-500 mt-0.5">
          Documentos PDF que alimentam a IA de atendimento (RAG)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <p className="text-[11px] text-stone-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-semibold text-stone-800 mt-1">{documents.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <p className="text-[11px] text-emerald-600 uppercase tracking-wide">Prontos para IA</p>
          <p className="text-2xl font-semibold text-emerald-700 mt-1">{totalProcessed}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <p className="text-[11px] text-amber-600 uppercase tracking-wide">Pendentes</p>
          <p className="text-2xl font-semibold text-amber-700 mt-1">{totalPending}</p>
        </div>
      </div>

      {/* Search + Refresh */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, produto ou arquivo..."
            className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-[13px] text-stone-600 hover:bg-stone-50 disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-[13px] text-red-700">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-stone-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <Brain size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-[13px]">
              {search ? 'Nenhum documento encontrado para esta busca.' : 'Nenhum documento na base de conhecimento.'}
            </p>
            <p className="text-[12px] mt-1">
              Adicione PDFs na aba "Bulas e Manuais" dentro de cada produto.
            </p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-stone-500 uppercase tracking-wide">Documento</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-stone-500 uppercase tracking-wide hidden sm:table-cell">Produto</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-stone-500 uppercase tracking-wide hidden md:table-cell">Tamanho</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-stone-500 uppercase tracking-wide">Status IA</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-stone-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-stone-700 truncate max-w-[180px]">{doc.title}</p>
                        <p className="text-[11px] text-stone-400 truncate max-w-[180px]">{doc.file_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <Package size={13} className="text-stone-300 shrink-0" />
                      <span className="truncate max-w-[140px]">{doc.product_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-400 hidden md:table-cell">
                    {formatBytes(doc.file_size)}
                  </td>
                  <td className="px-4 py-3">
                    {processing === doc.id ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Loader2 size={10} className="animate-spin" /> Processando...
                      </span>
                    ) : doc.processed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} /> Pronto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                        <Brain size={10} /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {!doc.processed && processing !== doc.id && (
                        <button
                          onClick={() => handleProcess(doc.id)}
                          title="Processar para IA"
                          className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Baixar PDF"
                        className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc.id}
                        title="Remover"
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                      >
                        {deleting === doc.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminKnowledgeBasePage;
