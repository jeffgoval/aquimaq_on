import React, { useState, useCallback, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  FileWarning,
  RefreshCw,
} from 'lucide-react';
import {
  getKnowledgeBase,
  uploadDocument,
  processDocument,
  deleteDocument,
  type KnowledgeBaseDocumentSummary,
} from '@/services/aiService';

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

const AdminKnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeBaseDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getKnowledgeBase();
      setDocuments(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = (Array.isArray(files) ? files[0] : files?.[0]) as File | undefined;
      if (!file || file.type !== 'application/pdf') {
        setProcessingError('Apenas ficheiros PDF são permitidos.');
        setProcessingState('error');
        return;
      }

      setProcessingState('uploading');
      setProcessingError(null);

      try {
        const { url, path } = await uploadDocument(file);
        setProcessingState('processing');
        await processDocument({
          fileUrl: url,
          filePath: path,
          title: file.name.replace(/\.pdf$/i, ''),
          sourceType: 'document',
        });
        setProcessingState('done');
        await loadDocuments();
        setTimeout(() => setProcessingState('idle'), 1500);
      } catch (err) {
        setProcessingError(err instanceof Error ? err.message : 'Erro ao processar documento.');
        setProcessingState('error');
        setTimeout(() => setProcessingState('idle'), 3000);
      }
    },
    [loadDocuments]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) handleFiles(files);
      e.target.value = '';
    },
    [handleFiles]
  );

  const handleDelete = useCallback(
    async (doc: KnowledgeBaseDocumentSummary) => {
      const target = doc.fileUrl || doc.storagePath;
      if (!target) {
        setError('Este documento não pode ser removido da base (falta referência).');
        return;
      }
      setDeletingId(doc.id);
      setError(null);
      try {
        await deleteDocument(target);
        await loadDocuments();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao remover documento.');
      } finally {
        setDeletingId(null);
      }
    },
    [loadDocuments]
  );

  const isProcessing = processingState === 'uploading' || processingState === 'processing';

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
            <FileText className="text-stone-500" size={24} />
            Base de Conhecimento (RAG)
          </h1>
          <p className="text-stone-400 text-[13px] mt-0.5">
            Envie PDFs para enriquecer as respostas do assistente com IA.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDocuments}
          disabled={loading}
          className="p-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors disabled:opacity-50"
          aria-label="Atualizar lista"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Drag and Drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
          ${isDragging ? 'border-agro-500 bg-agro-50/50' : 'border-stone-200 bg-stone-50/50'}
          ${isProcessing ? 'pointer-events-none opacity-80' : ''}
        `}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileInput}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Selecionar PDF"
        />
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="text-agro-600 animate-spin" />
            <p className="text-stone-600 font-medium">
              {processingState === 'uploading' ? 'A enviar ficheiro...' : 'A processar e gerar vetores...'}
            </p>
            <div className="w-48 h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-agro-600 rounded-full animate-pulse"
                style={{ width: processingState === 'uploading' ? '40%' : '80%' }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center mx-auto mb-3">
              <Upload size={22} className="text-stone-500" />
            </div>
            <p className="text-stone-600 font-medium">Arraste um PDF ou clique para selecionar</p>
            <p className="text-stone-400 text-[13px] mt-1">Máx. 20 MB. O documento será processado e indexado automaticamente.</p>
          </>
        )}
      </div>

      {processingState === 'done' && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-[13px] border border-emerald-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Documento processado e adicionado à base.
        </div>
      )}

      {processingError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-[13px] border border-red-100 flex items-center gap-2">
          <FileWarning size={16} />
          {processingError}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-[13px] border border-red-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {error}
        </div>
      )}

      {/* Tabela de documentos */}
      <div className="border border-stone-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
          <h2 className="font-medium text-stone-800">Documentos na base</h2>
          <p className="text-[12px] text-stone-400 mt-0.5">Título, tipo, data e estado de processamento</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-stone-400 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-[14px]">
            Nenhum documento processado. Envie um PDF acima para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/30">
                  <th className="px-4 py-3 text-[12px] font-semibold text-stone-500 uppercase tracking-wider">Título</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-stone-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-stone-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-stone-500 uppercase tracking-wider w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3 text-[14px] font-medium text-stone-800">{doc.title}</td>
                    <td className="px-4 py-3 text-[13px] text-stone-600">{doc.sourceType}</td>
                    <td className="px-4 py-3 text-[13px] text-stone-500">
                      {new Date(doc.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-emerald-100 text-emerald-700">
                        Processado · {doc.chunkCount} {doc.chunkCount === 1 ? 'chunk' : 'chunks'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(doc.fileUrl || doc.storagePath) ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          aria-label="Remover documento"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-stone-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKnowledgeBase;
