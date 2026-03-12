import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, MousePointer2, ArrowRight } from 'lucide-react';
import { MEGA_MENU_CATEGORIES } from '@/constants/megaMenuCategories';

interface MegaMenuProps {
    onCategoryClick?: (categorySlug: string) => void;
}

const HOVER_DELAY_MS = 150;

const MegaMenu: React.FC<MegaMenuProps> = ({ onCategoryClick }) => {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleClose = () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => setIsOpen(false), HOVER_DELAY_MS);
    };

    const cancelClose = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsOpen(true);
    };

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    return (
        <div
            className="relative"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
        >
            {/* Trigger Button */}
            <button
                type="button"
                className="flex items-center px-5 h-11 transition-colors border-b-2 border-transparent text-slate-300 hover:text-white hover:bg-white/5 font-medium"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Todos os Departamentos
                <ChevronRight className={`ml-2 w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Mega Menu Dropdown */}
            <div
                className={`absolute left-0 top-full mt-0 w-[900px] bg-white shadow-2xl rounded-b-xl border border-slate-200 transition-all duration-200 z-[100] ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
                role="menu"
                aria-hidden={!isOpen}
            >
                <div className="flex">
                    {/* Left Sidebar - Main Categories */}
                    <div className="w-64 bg-slate-50 border-r border-slate-200 py-2">
                        {MEGA_MENU_CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onMouseEnter={() => setHoveredCategory(category.id)}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${hoveredCategory === category.id
                                    ? 'bg-white text-agro-700 font-semibold shadow-sm'
                                    : 'text-slate-700 hover:bg-white hover:text-agro-700'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
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
                    <div className="flex items-center justify-end text-sm">
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
