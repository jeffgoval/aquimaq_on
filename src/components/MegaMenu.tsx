import React, { useState } from 'react';
import { ChevronRight, MousePointer2, Lightbulb, ArrowRight, Beef, FlaskConical, Wrench, Wheat, Cog, ShieldCheck } from 'lucide-react';
import { MEGA_MENU_CATEGORIES } from '@/constants/megaMenuCategories';

interface MegaMenuProps {
    onCategoryClick?: (categorySlug: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'nutricao-animal':         <Beef size={18} />,
    'defensivos-agricolas':    <FlaskConical size={18} />,
    'ferramentas-equipamentos': <Wrench size={18} />,
    'sementes-mudas':          <Wheat size={18} />,
    'pecas-reposicao':         <Cog size={18} />,
    'epi-seguranca':           <ShieldCheck size={18} />,
};

const MegaMenu: React.FC<MegaMenuProps> = ({ onCategoryClick }) => {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    return (
        <div className="relative group">
            {/* Trigger Button */}
            <button className="flex items-center px-5 h-12 transition-colors border-b-2 border-transparent text-slate-300 hover:text-white hover:bg-white/5 font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Todos os Departamentos
                <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:rotate-90" />
            </button>

            {/* Mega Menu Dropdown */}
            <div className="absolute left-0 top-full mt-0 w-[900px] bg-white shadow-2xl rounded-b-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="flex">
                    {/* Left Sidebar - Main Categories */}
                    <div className="w-64 bg-slate-50 border-r border-slate-200 py-2">
                        {MEGA_MENU_CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onMouseEnter={() => setHoveredCategory(category.id)}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${hoveredCategory === category.id
                                    ? 'bg-white text-agro-700 font-semibold shadow-sm'
                                    : 'text-slate-700 hover:bg-white hover:text-agro-600'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className={`shrink-0 ${hoveredCategory === category.id ? 'text-agro-600' : 'text-slate-400'}`}>
                                        {CATEGORY_ICONS[category.id]}
                                    </span>
                                    <span className="text-sm">{category.name}</span>
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            </button>
                        ))}
                    </div>

                    {/* Right Panel - Subcategories */}
                    <div className="flex-1 p-6">
                        {hoveredCategory ? (
                            <>
                                {MEGA_MENU_CATEGORIES.find((cat) => cat.id === hoveredCategory) && (
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <span className="text-agro-600">
                                                {CATEGORY_ICONS[hoveredCategory]}
                                            </span>
                                            {MEGA_MENU_CATEGORIES.find((cat) => cat.id === hoveredCategory)?.name}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {MEGA_MENU_CATEGORIES.find((cat) => cat.id === hoveredCategory)?.subcategories.map(
                                                (sub) => (
                                                    <button
                                                        key={sub.id}
                                                        onClick={() => onCategoryClick?.(sub.mappedCategory || sub.name)}
                                                        className="text-left px-4 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-agro-50 hover:text-agro-700 transition-colors font-medium flex items-center justify-between group/item"
                                                    >
                                                        {sub.name}
                                                        <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <div className="text-center">
                                    <MousePointer2 size={48} className="mx-auto mb-3 text-slate-300" />
                                    <p className="text-sm font-medium">Passe o mouse sobre uma categoria</p>
                                    <p className="text-xs mt-1">para ver os produtos disponíveis</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Banner */}
                <div className="border-t border-slate-200 bg-gradient-to-r from-agro-50 to-agro-100 px-6 py-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-medium">
                            <Lightbulb size={18} className="inline-block mr-1.5 text-amber-500 align-middle" />
                            <strong>Dica:</strong> Não encontrou o que procura? Use nossa busca acima!
                        </span>
                        <button className="text-agro-700 font-bold hover:text-agro-800 transition-colors">
                            Ver Todos <ArrowRight size={16} className="inline ml-0.5 align-middle" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MegaMenu;
