import React from 'react';

export type ProductTabId = 'descricao' | 'especificacoes';

interface TabItem {
  id: ProductTabId;
  label: string;
}

interface ProductTabsProps {
  tabs: TabItem[];
  activeTab: ProductTabId;
  onTabChange: (tab: ProductTabId) => void;
  description: string;
  technicalSpecs: string;
}

export const ProductTabs: React.FC<ProductTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  description,
  technicalSpecs,
}) => {
  let specs: Record<string, string> | null = null;
  try {
    specs = JSON.parse(technicalSpecs);
  } catch {
    // ignore
  }
  const hasSpecsObject =
    specs &&
    typeof specs === 'object' &&
    !Array.isArray(specs) &&
    Object.keys(specs).length > 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'text-agro-700 bg-white border-b-2 border-agro-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === 'descricao' && (
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {description}
          </p>
        )}
        {activeTab === 'especificacoes' &&
          (hasSpecsObject ? (
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(specs!).map(([key, val], i) => (
                    <tr
                      key={key}
                      className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    >
                      <td className="py-2.5 px-4 font-medium text-gray-700 w-2/5 border-r border-gray-100">
                        {key}
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">
                        {String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {technicalSpecs}
            </p>
          ))}
      </div>
    </div>
  );
};
