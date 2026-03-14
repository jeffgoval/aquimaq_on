import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Upload, Trash2, Loader2, CheckCircle, AlertCircle,
  Download, Brain, RefreshCw,
} from 'lucide-react';
import {
  ProductDocument,
  getProductDocuments,
  uploadProductDocument,
  processProductDocument,
  deleteProductDocument,
} from '@/services/productDocumentsService';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface ProductDocumentsManagerProps {
  productId: string;
}

const ACCEPT = '.pdf,.PDF';
const MAX_FILE_MB = 20;

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ProductDocumentsManager: React.FC<ProductDocumentsManagerProps> = ({ productId }) => {
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [productId]);

  async function load() {
    setLoading(true);
    try {
      const docs = await getProductDocuments(productId);
      setDocuments(docs);
    } catch {
      setError('Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Arquivo muito grande. Limite: ${MAX_FILE_MB} MB.`);
      setFile(null);
      return;
    }
    setFile(f);
    setError(null);
    if (!title.trim()) {
      setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const finalTitle = (title.trim() || file?.name?.replace(/\.[^.]+$/, '') || 'Documento').trim();
    if (!file) {
      setError('Selecione um PDF.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const doc = await uploadProductDocument(productId, file, finalTitle);
      setDocuments(prev => [doc, ...prev]);
      setFile(null);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Processar automaticamente (gerar embeddings)
      handleProcess(doc.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload.');
    } finally {
      setUploading(false);
    }
  }

  async function handleProcess(docId: string) {
    setProcessing(docId);
    try {
      await processProductDocument(docId);
      setDocuments(prev =>
        prev.map(d => d.id === docId ? { ...d, processed: true } : d)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar documento para IA.');
    } finally {
      setProcessing(null);
    }
  }

  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<ProductDocument | null>(null);

  const handleDelete = (doc: ProductDocument) => setConfirmDeleteDoc(doc);

  async function doDelete(doc: ProductDocument) {
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

  return (
    <>
    <div className="space-y-4">
      {/* Upload: div em vez de form para não aninhar no form do produto (o Enviar submetia o form errado). */}
      <div className="bg-stone-50 rounded-lg p-4 space-y-3 border border-stone-200 border-dashed">
        <p className="text-[12px] font-medium text-stone-500 uppercase tracking-wide">
          Adicionar documento
        </p>

        <div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título do documento (ex: Manual do Operador)"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 bg-white"
          />
        </div>

        <div className="flex gap-2">
          <label
            htmlFor="product-document-pdf-input"
            className="flex-1 flex items-center gap-2 px-3 py-2 border border-stone-200 rounded-lg bg-white cursor-pointer hover:border-stone-400 transition-colors"
            onClick={() => { fileInputRef.current && (fileInputRef.current.value = ''); }}
          >
            <Upload size={14} className="text-stone-400 shrink-0" />
            <span className="text-[13px] text-stone-500 truncate">
              {file ? `${file.name} (${formatBytes(file.size)})` : 'Clique para escolher PDF (máx. 20 MB)'}
            </span>
          </label>
          <input
            id="product-document-pdf-input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
          <button
            type="button"
            disabled={uploading || !file}
            title={!file ? 'Selecione um PDF primeiro' : 'Enviar documento'}
            onClick={() => handleUpload({ preventDefault: () => {} } as React.FormEvent)}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 text-white rounded-lg text-[13px] font-medium hover:bg-stone-700 disabled:opacity-40 whitespace-nowrap"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-[12px] text-red-600">
            <AlertCircle size={13} /> {error}
          </p>
        )}
        {!file && !error && (
          <p className="text-[11px] text-stone-400">
            Clique na área à esquerda para escolher um ficheiro PDF. Depois clique em Enviar.
          </p>
        )}
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-stone-400" />
        </div>
      ) : documents.length === 0 ? (
        <p className="text-center text-[13px] text-stone-400 py-6">
          Nenhum documento cadastrado para este produto.
        </p>
      ) : (
        <ul className="space-y-2">
          {documents.map(doc => (
            <li
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-stone-100"
            >
              <FileText size={18} className="text-stone-400 shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-stone-700 truncate">{doc.title}</p>
                <p className="text-[11px] text-stone-400">
                  {doc.file_name}
                  {doc.file_size ? ` · ${formatBytes(doc.file_size)}` : ''}
                </p>
              </div>

              {/* Status da IA */}
              {processing === doc.id ? (
                <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Loader2 size={11} className="animate-spin" /> Processando...
                </span>
              ) : doc.processed ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle size={11} /> IA pronta
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                  <Brain size={11} /> Pendente
                </span>
              )}

              {/* Ações */}
              <div className="flex items-center gap-1 shrink-0">
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
                  title="Baixar"
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
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-stone-400">
        Os documentos enviados alimentam a IA de atendimento para responder perguntas sobre este produto.
      </p>
    </div>

    <ConfirmDialog
      open={!!confirmDeleteDoc}
      title="Remover Documento"
      description={confirmDeleteDoc ? `Remover "${confirmDeleteDoc.title}"? Esta ação também apaga os dados da IA associados a este documento.` : ''}
      confirmLabel="Remover"
      onCancel={() => setConfirmDeleteDoc(null)}
      onConfirm={() => {
        if (confirmDeleteDoc) doDelete(confirmDeleteDoc);
        setConfirmDeleteDoc(null);
      }}
    />
    </>
  );
};

export default ProductDocumentsManager;
