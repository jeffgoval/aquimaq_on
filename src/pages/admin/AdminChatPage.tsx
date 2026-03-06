import React, { useEffect, useState } from 'react';
import { MessageSquare, Wifi, WifiOff, Loader2 } from 'lucide-react';
import AdminChatPanel from '@/components/admin/AdminChatPanel';
import { supabase } from '@/services/supabase';

interface BotStatus {
  status: 'connected' | 'disconnected' | 'connecting';
  phone_number: string | null;
  last_seen: string | null;
  messages_today: number;
  handoffs_today: number;
}

const AgentStatusBadge: React.FC = () => {
  const [agent, setAgent] = useState<BotStatus | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('whatsapp_bot_status')
        .select('status,phone_number,last_seen,messages_today,handoffs_today')
        .eq('id', 'default')
        .single();
      if (data) setAgent(data as BotStatus);
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!agent) return null;

  const isOnline = agent.status === 'connected' &&
    agent.last_seen &&
    (Date.now() - new Date(agent.last_seen).getTime()) < 90_000;

  return (
    <div className="flex items-center gap-4 bg-white border border-stone-100 rounded-lg px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2">
        {isOnline
          ? <Wifi size={15} className="text-green-500" />
          : agent.status === 'connecting'
            ? <Loader2 size={15} className="text-yellow-500 animate-spin" />
            : <WifiOff size={15} className="text-stone-400" />
        }
        <span className={`font-medium ${isOnline ? 'text-green-700' : 'text-stone-500'}`}>
          Agente IA WhatsApp: {isOnline ? 'online' : agent.status === 'connecting' ? 'conectando…' : 'offline'}
        </span>
        {isOnline && agent.phone_number && (
          <span className="text-stone-400 text-xs">({agent.phone_number})</span>
        )}
      </div>
      <div className="h-4 w-px bg-stone-100" />
      <span className="text-stone-400 text-xs">{agent.messages_today} msg hoje</span>
      <span className="text-stone-400 text-xs">{agent.handoffs_today} transferências</span>
    </div>
  );
};

const AdminChatPage: React.FC = () => {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2">
          <MessageSquare className="text-stone-400" size={24} />
          Atendimento Omnichannel
        </h1>
        <AgentStatusBadge />
      </div>

      <div className="flex-1 min-h-0">
        <AdminChatPanel />
      </div>
    </div>
  );
};

export default AdminChatPage;
