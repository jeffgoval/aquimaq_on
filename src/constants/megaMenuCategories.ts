// Mega Menu Category Structure
export interface MegaMenuCategory {
    id: string;
    name: string;
    icon?: string;
    subcategories: {
        id: string;
        name: string; // Display Name
        slug: string;
        mappedCategory?: string; // Maps to ProductCategory enum value if needed
    }[];
}

export const MEGA_MENU_CATEGORIES: MegaMenuCategory[] = [
    {
        id: 'nutricao-animal',
        name: 'Nutrição Animal',
        icon: '🐄',
        subcategories: [
            { id: 'sal-mineral', name: 'Sal Mineral', slug: 'sal-mineral', mappedCategory: 'Nutrição Animal' },
            { id: 'racoes', name: 'Rações', slug: 'racoes', mappedCategory: 'Nutrição Animal' },
            { id: 'suplementos', name: 'Suplementos', slug: 'suplementos', mappedCategory: 'Nutrição Animal' },
            { id: 'leite-po', name: 'Leite em Pó', slug: 'leite-po', mappedCategory: 'Nutrição Animal' },
        ],
    },
    {
        id: 'defensivos-agricolas',
        name: 'Defensivos Agrícolas',
        icon: '🌱',
        subcategories: [
            { id: 'herbicidas', name: 'Herbicidas', slug: 'herbicidas', mappedCategory: 'Defensivos Agrícolas' },
            { id: 'fungicidas', name: 'Fungicidas', slug: 'fungicidas', mappedCategory: 'Defensivos Agrícolas' },
            { id: 'inseticidas', name: 'Inseticidas', slug: 'inseticidas', mappedCategory: 'Defensivos Agrícolas' },
            { id: 'adjuvantes', name: 'Adjuvantes', slug: 'adjuvantes', mappedCategory: 'Defensivos Agrícolas' },
        ],
    },
    {
        id: 'ferramentas-equipamentos',
        name: 'Ferramentas e Equipamentos',
        icon: '🔧',
        subcategories: [
            { id: 'pulverizadores', name: 'Pulverizadores', slug: 'pulverizadores', mappedCategory: 'Equipamentos' },
            { id: 'ferramentas-manuais', name: 'Ferramentas Manuais', slug: 'ferramentas-manuais', mappedCategory: 'Ferramentas Manuais' },
            { id: 'motores-bombas', name: 'Motores e Bombas', slug: 'motores-bombas', mappedCategory: 'Equipamentos' },
            { id: 'irrigacao', name: 'Irrigação', slug: 'irrigacao', mappedCategory: 'Equipamentos' },
        ],
    },
    {
        id: 'sementes-mudas',
        name: 'Sementes e Mudas',
        icon: '🌾',
        subcategories: [
            { id: 'milho', name: 'Milho', slug: 'milho', mappedCategory: 'Sementes Fracionadas' },
            { id: 'soja', name: 'Soja', slug: 'soja', mappedCategory: 'Sementes Fracionadas' },
            { id: 'pastagens', name: 'Pastagens', slug: 'pastagens', mappedCategory: 'Sementes Fracionadas' },
            { id: 'hortalicas', name: 'Hortaliças', slug: 'hortalicas', mappedCategory: 'Sementes Fracionadas' },
        ],
    },
    {
        id: 'pecas-reposicao',
        name: 'Peças de Reposição',
        icon: '⚙️',
        subcategories: [
            { id: 'bicos-pulverizacao', name: 'Bicos de Pulverização', slug: 'bicos-pulverizacao', mappedCategory: 'Peças de Reposição' },
            { id: 'filtros', name: 'Filtros', slug: 'filtros', mappedCategory: 'Peças de Reposição' },
            { id: 'mangueiras', name: 'Mangueiras', slug: 'mangueiras', mappedCategory: 'Peças de Reposição' },
            { id: 'conexoes', name: 'Conexões', slug: 'conexoes', mappedCategory: 'Peças de Reposição' },
        ],
    },
    {
        id: 'epi-seguranca',
        name: 'EPI e Segurança',
        icon: '🦺',
        subcategories: [
            { id: 'botas', name: 'Botas', slug: 'botas', mappedCategory: 'EPI e Segurança' },
            { id: 'luvas', name: 'Luvas', slug: 'luvas', mappedCategory: 'EPI e Segurança' },
            { id: 'mascaras', name: 'Máscaras', slug: 'mascaras', mappedCategory: 'EPI e Segurança' },
            { id: 'oculos-protecao', name: 'Óculos de Proteção', slug: 'oculos-protecao', mappedCategory: 'EPI e Segurança' },
        ],
    },
];
