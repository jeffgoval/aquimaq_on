export const maskPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').substring(0, 11);
    const len = digits.length;

    if (len === 0) return '';
    if (len <= 2) return `(${digits}`;
    if (len <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (len === 11) {
        // Celular: (XX) 9XXXX-XXXX
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    // Fixo: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
};

export const maskDocument = (value: string) => {
    const clean = value.replace(/\D/g, '');

    if (clean.length <= 11) {
        // CPF
        return clean
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .substring(0, 14);
    } else {
        // CNPJ
        return clean
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 18);
    }
};

export const maskCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{5})(\d)/, '$1-$2')
        .substring(0, 9);
};

export const unmask = (value: string) => {
    return value.replace(/\D/g, '');
};
