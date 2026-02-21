import React, { useState, useEffect } from 'react';
import {
  listDocuments,
  deleteDocument,
  reindexProduct,
  uploadDocument,
  type KBEntry,
} from '@/services/knowledgeBaseService';
import { supabase } from '@/services/supabase';

const AdminKnowledgeBase: React.FC = () => {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [productIds, setProductIds] = useState<{ id: string; name: string }[]>([]);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listDocuments();
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase.from('products').select('id, name').limit(200);
      setProductIds((data ?? []).map((r) => ({ id: r.id, name: r.name ?? '' })));
    };
    loadProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta entrada?')) return;
    try {
      await deleteDocument(id);
      await loadEntries();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover');
    }
  };

  const handleReindex = async (productId: string) => {
    try {
      await reindexProduct(productId);
      await loadEntries();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao reindexar');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadDocument(file, { title: file.name });
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center">
        <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50">
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleUpload}
            disabled={uploading}
          />
          {uploading ? 'A enviar...' : 'Enviar documento'}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Reindexar produto:</span>
          <select
            className="border border-gray-300 rounded-md shadow-sm text-sm"
            onChange={(e) => {
              const id = e.target.value;
              if (id) handleReindex(id);
            }}
          >
            <option value="">Selecionar...</option>
            {productIds.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.slice(0, 50)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
          {entries.map((entry) => (
            <li key={entry.id} className="p-4 flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{entry.title ?? entry.id}</p>
                <p className="text-sm text-gray-500">
                  {entry.sourceType} {entry.sourceId ? `· ${entry.sourceId.slice(0, 8)}` : ''}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{entry.content.slice(0, 200)}...</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminKnowledgeBase;
