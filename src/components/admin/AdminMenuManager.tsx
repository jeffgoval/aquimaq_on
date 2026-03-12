import React, { useState, useCallback, useEffect } from 'react';
import { GripVertical, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import type { NavigationMenuItem } from '@/types/store';
import { ProductCategory } from '@/types';

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '— Link customizado —' },
  ...Object.entries(ProductCategory).map(([k, v]) => ({ value: v, label: v })),
];

const defaultItem = (): NavigationMenuItem => ({
  label: 'Novo item',
  slug: '#',
  enabled: true,
});

const AdminMenuManager: React.FC = () => {
  const { settings, saveSettings } = useStoreSettings();
  const [items, setItems] = useState<NavigationMenuItem[]>(
    settings?.navigationMenu?.length ? [...settings.navigationMenu] : []
  );
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (settings?.navigationMenu && settings.navigationMenu.length > 0 && items.length === 0) {
      setItems([...settings.navigationMenu]);
    }
  }, [settings?.navigationMenu]);

  const updateItem = useCallback((index: number, patch: Partial<NavigationMenuItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, defaultItem()]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    setItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, removed);
      return next;
    });
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveSettings({ navigationMenu: items });
    setSaving(false);
    if (!result.success) {
      console.error(result.error);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Régua de menu (barra preta)</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Reordene, ative/desative e edite os links exibidos na barra de navegação da loja.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Adicionar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-agro-600 hover:bg-agro-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {items.length === 0 && (
          <li className="py-8 text-center text-stone-500 border border-dashed border-stone-200 rounded-lg">
            Nenhum item. Clique em &quot;Adicionar&quot; para criar. Se a lista estiver vazia na loja, será usado o menu padrão.
          </li>
        )}
        {items.map((item, index) => (
          <li
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-lg ${draggedIndex === index ? 'opacity-60' : ''}`}
          >
            <span className="cursor-grab text-stone-400 hover:text-stone-600" aria-label="Arrastar para reordenar">
              <GripVertical size={18} />
            </span>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateItem(index, { label: e.target.value })}
                placeholder="Label"
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
              />
              <input
                type="text"
                value={item.slug}
                onChange={(e) => updateItem(index, { slug: e.target.value })}
                placeholder="Slug ou URL (ex: /contato ou https://...)"
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
              />
              <select
                value={item.category_value ?? ''}
                onChange={(e) => updateItem(index, { category_value: e.target.value || undefined })}
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-agro-500"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value || 'empty'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={item.is_highlighted ?? false}
                    onChange={(e) => updateItem(index, { is_highlighted: e.target.checked })}
                    className="rounded border-stone-300 text-agro-600 focus:ring-agro-500"
                  />
                  Destaque
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={(e) => updateItem(index, { enabled: e.target.checked })}
                    className="rounded border-stone-300 text-agro-600 focus:ring-agro-500"
                  />
                  Ativo
                </label>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Remover item"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminMenuManager;
