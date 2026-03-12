// Mega Menu Category Structure
export interface MegaMenuCategory {
    id: string;
    name: string;
    subcategories: {
        id: string;
        name: string; // Display Name
        slug: string;
        mappedCategory?: string; // Maps to ProductCategory enum value if needed
    }[];
}

export const MEGA_MENU_CATEGORIES: MegaMenuCategory[] = [
    {
        id: 'maquinas-equipamentos',
        name: 'Máquinas e Equipamentos',
        subcategories: [
            { id: 'derricadeiras', name: 'Derriçadeiras', slug: 'derricadeiras', mappedCategory: 'Máquinas e Equipamentos' },
            { id: 'rocadeiras', name: 'Roçadeiras', slug: 'rocadeiras', mappedCategory: 'Máquinas e Equipamentos' },
            { id: 'pulverizadores-costais', name: 'Pulverizadores Costais', slug: 'pulverizadores-costais', mappedCategory: 'Máquinas e Equipamentos' },
            { id: 'motopodas', name: 'Motopodas', slug: 'motopodas', mappedCategory: 'Máquinas e Equipamentos' },
        ],
    },
    {
        id: 'pecas-reposicao',
        name: 'Peças de Reposição',
        subcategories: [
            { id: 'hastes', name: 'Hastes', slug: 'hastes', mappedCategory: 'Peças de Reposição' },
            { id: 'garras-maozinhas', name: 'Garras / Mãozinhas', slug: 'garras-maozinhas', mappedCategory: 'Peças de Reposição' },
            { id: 'carburadores', name: 'Carburadores', slug: 'carburadores', mappedCategory: 'Peças de Reposição' },
            { id: 'filtros', name: 'Filtros', slug: 'filtros', mappedCategory: 'Peças de Reposição' },
            { id: 'tubos', name: 'Tubos', slug: 'tubos', mappedCategory: 'Peças de Reposição' },
        ],
    },
    {
        id: 'insumos-agricolas',
        name: 'Insumos Agrícolas',
        subcategories: [
            { id: 'adubos-foliares', name: 'Adubos Foliares', slug: 'adubos-foliares', mappedCategory: 'Insumos Agrícolas' },
            { id: 'fertilizantes-solo', name: 'Fertilizantes de Solo', slug: 'fertilizantes-solo', mappedCategory: 'Insumos Agrícolas' },
            { id: 'fungicidas', name: 'Fungicidas', slug: 'fungicidas', mappedCategory: 'Insumos Agrícolas' },
            { id: 'inseticidas', name: 'Inseticidas', slug: 'inseticidas', mappedCategory: 'Insumos Agrícolas' },
            { id: 'herbicidas', name: 'Herbicidas', slug: 'herbicidas', mappedCategory: 'Insumos Agrícolas' },
        ],
    },
    {
        id: 'colheita-ferramentas',
        name: 'Colheita e Ferramentas',
        subcategories: [
            { id: 'panos-apanha', name: 'Panos de Apanha', slug: 'panos-apanha', mappedCategory: 'Colheita e Ferramentas' },
            { id: 'peneiras', name: 'Peneiras', slug: 'peneiras', mappedCategory: 'Colheita e Ferramentas' },
            { id: 'rastelos', name: 'Rastelos', slug: 'rastelos', mappedCategory: 'Colheita e Ferramentas' },
            { id: 'lonas', name: 'Lonas', slug: 'lonas', mappedCategory: 'Colheita e Ferramentas' },
            { id: 'tesouras', name: 'Tesouras', slug: 'tesouras', mappedCategory: 'Colheita e Ferramentas' },
        ],
    },
    {
        id: 'linha-pet',
        name: 'Linha Pet',
        subcategories: [
            { id: 'medicamentos-pet', name: 'Medicamentos', slug: 'medicamentos-pet', mappedCategory: 'Linha Pet' },
            { id: 'vacinas', name: 'Vacinas', slug: 'vacinas', mappedCategory: 'Linha Pet' },
            { id: 'racoes-pet', name: 'Rações', slug: 'racoes-pet', mappedCategory: 'Linha Pet' },
            { id: 'acessorios-pet', name: 'Acessórios', slug: 'acessorios-pet', mappedCategory: 'Linha Pet' },
        ],
    },
    {
        id: 'epi-seguranca',
        name: 'EPI e Segurança',
        subcategories: [
            { id: 'mascaras', name: 'Máscaras', slug: 'mascaras', mappedCategory: 'EPI e Segurança' },
            { id: 'oculos-protecao', name: 'Óculos', slug: 'oculos-protecao', mappedCategory: 'EPI e Segurança' },
            { id: 'botas', name: 'Botas', slug: 'botas', mappedCategory: 'EPI e Segurança' },
            { id: 'toucas-arabes', name: 'Toucas Árabes', slug: 'toucas-arabes', mappedCategory: 'EPI e Segurança' },
        ],
    },
];
