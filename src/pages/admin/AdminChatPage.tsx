import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminChatPanel from '@/components/admin/AdminChatPanel';
import { getKnowledgeBase, type KnowledgeBaseDocumentSummary } from '@/services/aiService';
import { sendMessage as sendMessageToAi } from '@/services/chatService';
import { useChat } from '@/hooks/useChat';
import { FileText, MessageCircle, Send, Loader2 } from 'lucide-react';

const AdminChatPage: React.FC = () => {
  const [kbDocuments, setKbDocuments] = useState<KnowledgeBaseDocumentSummary[]>([]);
  const [kbLoading, setKbLoading] = useState(true);
  const [testConversationId, setTestConversationId] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testReply, setTestReply] = useState<string | null>(null);

  const {
    createConversation,
    sendMessage,
    sending,
    error: chatError,
  } = useChat({
    conversationId: testConversationId,
    autoCreate: false,
  });

  const loadKb = useCallback(async () => {
    setKbLoading(true);
    try {
      const list = await getKnowledgeBase();
      setKbDocuments(list);
    } catch {
      setKbDocuments([]);
    } finally {
      setKbLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKb();
  }, [loadKb]);

  const handleInitTestChat = useCallback(async () => {
    if (testConversationId) return;
    const conv = await createConversation('Teste Admin RAG');
    if (conv) setTestConversationId(conv.id);
  }, [testConversationId, createConversation]);

  const handleSendTest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const content = testInput.trim();
    if (!content || sending) return;
    setTestInput('');
    if (!testConversationId) {
      const conv = await createConversation('Teste Admin RAG');
      if (!conv) return;
      setTestConversationId(conv.id);
      try {
        const { reply } = await sendMessageToAi(conv.id, content);
        setTestReply(reply ?? null);
      } catch {
        setTestReply(null);
      }
    } else {
      const reply = await sendMessage(content);
      setTestReply(reply ?? null);
    }
  }, [testInput, sending, testConversationId, createConversation, sendMessage]);

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] max-h-[900px] gap-4">
        <div className="flex flex-1 min-h-0 gap-4">
          {/* Painel principal: atendimento ao cliente */}
          <div className="flex-1 min-w-0">
            <AdminChatPanel />
          </div>

          {/* Barra lateral: documentos ativos na Knowledge Base + Testar IA */}
          <aside className="w-72 lg:w-80 flex-shrink-0 border border-stone-200 rounded-xl bg-white overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
              <FileText size={18} className="text-stone-500" />
              <h3 className="font-medium text-stone-800 text-[14px]">Base de Conhecimento (RAG)</h3>
            </div>
            <p className="px-4 py-2 text-[12px] text-stone-400 border-b border-stone-100">
              Documentos ativos para consulta pela IA:
            </p>
            <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2 custom-scrollbar">
              {kbLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={20} className="text-stone-400 animate-spin" />
                </div>
              ) : kbDocuments.length === 0 ? (
                <p className="text-[13px] text-stone-400 text-center py-4">
                  Nenhum documento na base. Adicione PDFs em Base de Conhecimento.
                </p>
              ) : (
                kbDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-left"
                  >
                    <p className="text-[13px] font-medium text-stone-800 line-clamp-2">{doc.title}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {doc.sourceType} · {doc.chunkCount} chunks
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Testar IA (useChat + ai-chat) */}
            <div className="border-t border-stone-200 p-3 bg-stone-50/50">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={16} className="text-agro-600" />
                <span className="text-[13px] font-medium text-stone-700">Testar IA (RAG)</span>
              </div>
              {chatError && (
                <p className="text-[11px] text-red-600 mb-2">{chatError}</p>
              )}
              <form onSubmit={handleSendTest} className="space-y-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onFocus={handleInitTestChat}
                  placeholder="Perguntar à IA..."
                  disabled={sending}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={sending || !testInput.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-agro-600 text-white py-2 rounded-lg text-[13px] font-medium hover:bg-agro-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Enviar
                </button>
              </form>
              {testReply && (
                <div className="mt-2 p-2.5 rounded-lg bg-agro-50 border border-agro-100 text-[12px] text-stone-700 whitespace-pre-wrap">
                  {testReply}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChatPage;
