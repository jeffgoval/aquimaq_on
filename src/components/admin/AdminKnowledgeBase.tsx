import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { FileText, Upload, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface KnowledgeFile {
  id: string;
  title: string;
  source_type: string;
  created_at: string;
  metadata?: { storage_path?: string } | null;
}

const AdminKnowledgeBase: React.FC = () => {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingTitle, setDeletingTitle] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast: addToast } = useToast();

  const loadFiles = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('ai_knowledge_base')
      .select('id, title, source_type, created_at, metadata')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Remover duplicatas de chunks para mostrar apenas o "Documento"
      const uniqueFiles = (data as KnowledgeFile[]).filter((v, i, a) => a.findIndex(t => t.title === v.title) === i);
      setFiles(uniqueFiles);
    }
    setLoading(false);
  };

  useEffect(() => { loadFiles(); }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload para o Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Disparar Edge Function de Ingestão
      const { error: processError } = await supabase.functions.invoke('process-knowledge-base', {
        body: { file_path: filePath, document_title: file.name }
      });

      if (processError) throw processError;

      addToast('Documento processado e vetorizado com sucesso!', 'success');
      loadFiles();
    } catch (err: any) {
      addToast(err.message || 'Erro no processamento', 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = (title: string) => {
    setDeletingTitle(title);
  };

  const confirmDelete = async () => {
    if (!deletingTitle) return;
    setDeleting(true);
    try {
      // Buscar storage_path antes de deletar (para limpeza do bucket)
      const { data: chunks } = await (supabase as any)
        .from('ai_knowledge_base')
        .select('metadata')
        .eq('title', deletingTitle)
        .limit(1);

      const storagePath = (chunks as any[])?.[0]?.metadata?.storage_path as string | undefined;

      // Deletar todos os chunks do documento
      const { error } = await (supabase as any)
        .from('ai_knowledge_base')
        .delete()
        .eq('title', deletingTitle);

      if (error) throw error;

      // Tentar remover do Storage se houver caminho salvo
      if (storagePath) {
        await supabase.storage.from('knowledge-base').remove([storagePath]);
      }

      addToast('Documento removido com sucesso.', 'success');
      loadFiles();
    } catch (err: any) {
      addToast(err.message || 'Erro ao remover documento.', 'error');
    } finally {
      setDeleting(false);
      setDeletingTitle(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Base de Conhecimento (RAG)</h1>
          <p className="text-sm text-stone-500">Treine a sua IA enviando manuais e PDFs técnicos.</p>
        </div>

        <label className="cursor-pointer bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-all flex items-center gap-2">
          {uploading ? <RefreshCw className="animate-spin" size={16} /> : <Upload size={16} />}
          {uploading ? 'Processando...' : 'Enviar PDF'}
          <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>
              <th className="px-6 py-3 font-semibold text-stone-700">Documento</th>
              <th className="px-6 py-3 font-semibold text-stone-700">Tipo</th>
              <th className="px-6 py-3 font-semibold text-stone-700">Data</th>
              <th className="px-6 py-3 font-semibold text-stone-700 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-stone-400">Carregando base de conhecimento...</td></tr>
            ) : files.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-stone-400">Nenhum documento processado.</td></tr>
            ) : files.map(file => (
              <tr key={file.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={18} /></div>
                  <span className="font-medium text-stone-800">{file.title}</span>
                </td>
                <td className="px-6 py-4 text-stone-500 uppercase text-[11px] font-bold">{file.source_type}</td>
                <td className="px-6 py-4 text-stone-500">{new Date(file.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(file.title)}
                    className="text-stone-400 hover:text-red-500 p-2 transition-colors"
                    title="Remover documento"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmação de exclusão */}
      {deletingTitle && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Remover Documento</h3>
            <p className="text-stone-500 mb-1 font-medium text-[14px]">
              Tem certeza que deseja remover <span className="text-stone-800 font-semibold">"{deletingTitle}"</span>?
            </p>
            <p className="text-stone-400 text-xs mb-6">
              Todos os chunks vetorizados deste documento serão excluídos. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingTitle(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {deleting && <RefreshCw size={14} className="animate-spin" />}
                {deleting ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKnowledgeBase;
