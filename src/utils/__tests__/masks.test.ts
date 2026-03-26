import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    brazilPhoneDigitsForWhatsApp,
    formatCepDisplay,
    formatCnpjDisplay,
    maskCEP,
    maskDocument,
    maskPhone,
    normalizeBrazilPhoneDigits,
} from '@/utils/masks';

describe('masks', () => {
    it('normalizeBrazilPhoneDigits remove 55 prefix when há mais de 11 dígitos', () => {
        assert.equal(normalizeBrazilPhoneDigits('5511999999999'), '11999999999');
        assert.equal(normalizeBrazilPhoneDigits('+55 (11) 99999-9999'), '11999999999');
    });

    it('brazilPhoneDigitsForWhatsApp', () => {
        assert.equal(brazilPhoneDigitsForWhatsApp('11999999999'), '5511999999999');
        assert.equal(brazilPhoneDigitsForWhatsApp('11'), '');
    });

    it('maskPhone celular e fixo', () => {
        assert.equal(maskPhone('11999999999'), '(11) 99999-9999');
        assert.equal(maskPhone('1133334444'), '(11) 3333-4444');
    });

    it('maskDocument CPF e CNPJ', () => {
        assert.equal(maskDocument('12345678901'), '123.456.789-01');
        assert.equal(maskDocument('11222333000181'), '11.222.333/0001-81');
    });

    it('maskCEP', () => {
        assert.equal(maskCEP('01310100'), '01310-100');
    });

    it('formatCepDisplay', () => {
        assert.equal(formatCepDisplay('01310100'), '01310-100');
        assert.equal(formatCepDisplay('01310-100'), '01310-100');
    });

    it('formatCnpjDisplay', () => {
        assert.equal(formatCnpjDisplay('11222333000181'), '11.222.333/0001-81');
        assert.equal(formatCnpjDisplay('123'), '123');
    });
});
