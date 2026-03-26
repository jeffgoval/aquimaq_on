/**
 * Máscaras e constantes de UI para telefone (BR), CPF/CNPJ e CEP.
 * Fonte única para formulários, modais e links (ex.: wa.me).
 */

/** Placeholders alinhados às máscaras exibidas nos inputs. */
export const MASK_PLACEHOLDER = {
    phone: '(00) 00000-0000',
    /** Campo único CPF ou CNPJ (a máscara muda conforme a quantidade de dígitos). */
    cpfCnpj: '000.000.000-00',
    cnpj: '00.000.000/0000-00',
    cep: '00000-000',
} as const;

/** maxLength dos valores já formatados (com pontuação). */
export const MASK_INPUT_MAX_LENGTH = {
    phone: 15,
    cpfCnpj: 18,
    cep: 9,
} as const;

/**
 * Mantém só dígitos, remove prefixo 55 quando o resultado excede 11 dígitos
 * e limita a DDD + número (10 ou 11 dígitos).
 */
export const normalizeBrazilPhoneDigits = (value: string): string => {
    let d = value.replace(/\D/g, '');
    if (d.length > 11 && d.startsWith('55')) {
        d = d.slice(2);
    }
    return d.slice(0, 11);
};

/** Para `https://wa.me/&lt;dígitos&gt;` no Brasil: 55 + DDD + número. */
export const brazilPhoneDigitsForWhatsApp = (value: string): string => {
    const local = normalizeBrazilPhoneDigits(value);
    return local.length >= 10 ? `55${local}` : '';
};

export const maskPhone = (value: string): string => {
    const digits = normalizeBrazilPhoneDigits(value);
    const len = digits.length;

    if (len === 0) return '';
    if (len <= 2) return `(${digits}`;
    if (len <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (len === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
};

export const maskDocument = (value: string) => {
    const clean = value.replace(/\D/g, '');

    if (clean.length <= 11) {
        return clean
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .substring(0, 14);
    }
    return clean
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18);
};

export const maskCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{5})(\d)/, '$1-$2')
        .substring(0, 9);
};

/** Exibe CEP armazenado só com dígitos ou já formatado. */
export const formatCepDisplay = (value: string | null | undefined): string => {
    if (!value) return '';
    const n = value.replace(/\D/g, '');
    return n.length === 8 ? maskCEP(value) : value.trim();
};

/** CNPJ só para exibição: devolve formatado se tiver 14 dígitos; caso contrário o texto original. */
export const formatCnpjDisplay = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 14) return value;
    return maskDocument(cleaned);
};

export const unmask = (value: string) => {
    return value.replace(/\D/g, '');
};
