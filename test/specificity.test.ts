// src/css/specificity.test.ts
import { describe, it, expect } from 'vitest';
import { calcSpecificity } from '../src/css/specificity';

describe('CSS Specificity Calculator', () => {
    it('should calculate ID selector specificity', () => {
        expect(calcSpecificity('#myid')).toBe(100);
        expect(calcSpecificity('#id1#id2')).toBe(200);
    });

    it('should calculate class selector specificity', () => {
        expect(calcSpecificity('.myclass')).toBe(10);
        expect(calcSpecificity('.class1.class2')).toBe(20);
    });

    it('should calculate tag selector specificity', () => {
        expect(calcSpecificity('div')).toBe(1);
        expect(calcSpecificity('p')).toBe(1);
    });

    it('should calculate combined selector specificity', () => {
        expect(calcSpecificity('#myid.myclass')).toBe(110);
        expect(calcSpecificity('.class1.class2#myid')).toBe(120);
        expect(calcSpecificity('div.myclass')).toBe(11);
        expect(calcSpecificity('#myid.class1.class2')).toBe(120);
    });

    it('should handle empty selector', () => {
        expect(calcSpecificity('')).toBe(0);
    });

    it('should handle complex selectors', () => {
        expect(calcSpecificity('#header.nav.active')).toBe(120);
        expect(calcSpecificity('.btn.btn-primary.btn-lg')).toBe(30);
    });

    it('should handle selectors with spaces (simple)', () => {
        // Note: This is a simple implementation, might not handle all edge cases
        const result = calcSpecificity('.class1 .class2');
        expect(result).toBeGreaterThan(0);
    });
});
