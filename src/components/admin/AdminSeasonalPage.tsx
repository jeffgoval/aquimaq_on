import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Sprout, Calendar } from 'lucide-react';
import AdminSeasonalSwitcher from './AdminSeasonalSwitcher';
import AdminCropCalendar from './AdminCropCalendar';
import { cn } from '@/utils/cn';

type TabId = 'modo' | 'calendario';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'modo', label: 'Modo Ativo', icon: Sprout },
  { id: 'calendario', label: 'Calendário de Safra', icon: Calendar },
];

const AdminSeasonalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('modo');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-800">Sazonalidade</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Controle o modo de safra ativo e configure os períodos de plantio e colheita por cultura.
          </p>
        </div>
        {message && (
          <span className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
          )}>
            {message.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
            {message.text}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-stone-800 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'modo' && <AdminSeasonalSwitcher onMessage={showMessage} />}
      {activeTab === 'calendario' && <AdminCropCalendar onMessage={showMessage} />}

    </div>
  );
};

export default AdminSeasonalPage;
