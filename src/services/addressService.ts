interface ViacepResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
}

interface BrasilApiCepResponse {
    cep: string;
    state: string;
    city: string;
    neighborhood: string;
    street: string;
}

export interface AddressData {
    street: string;
    district: string;
    city: string;
    state: string;
    complement?: string;
}

const toAddressData = (data: ViacepResponse): AddressData => ({
    street: data.logradouro ?? '',
    district: data.bairro ?? '',
    city: data.localidade ?? '',
    state: data.uf ?? '',
    complement: data.complemento,
});

/** ViaCEP primeiro; em falha (CORS, timeout, erro) usa BrasilAPI como fallback. */
export const fetchAddressByCEP = async (cep: string): Promise<AddressData | null> => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    // 1) Tentar ViaCEP
    try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
            method: 'GET',
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error('ViaCEP unavailable');
        const data: ViacepResponse = await res.json();
        if (data.erro) throw new Error('CEP not found');
        return toAddressData(data);
    } catch (viaErr) {
        if (import.meta.env?.DEV) console.warn('ViaCEP falhou, tentando BrasilAPI:', viaErr);
    }

    // 2) Fallback BrasilAPI
    try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
            method: 'GET',
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return null;
        const data: BrasilApiCepResponse = await res.json();
        return {
            street: data.street ?? '',
            district: data.neighborhood ?? '',
            city: data.city ?? '',
            state: data.state ?? '',
        };
    } catch (error) {
        console.error('Busca CEP (ViaCEP + BrasilAPI) falhou:', error);
        return null;
    }
};
