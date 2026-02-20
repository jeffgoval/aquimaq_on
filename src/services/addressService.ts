interface ViacepResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
}

export interface AddressData {
    street: string;
    district: string;
    city: string;
    state: string;
    complement?: string;
}

export const fetchAddressByCEP = async (cep: string): Promise<AddressData | null> => {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) return null;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (!response.ok) throw new Error('CEP Service Unavailable');

        const data: ViacepResponse = await response.json();

        if (data.erro) return null;

        return {
            street: data.logradouro,
            district: data.bairro,
            city: data.localidade,
            state: data.uf,
            complement: data.complemento
        };
    } catch (error) {
        console.error("Error fetching address:", error);
        return null;
    }
};
