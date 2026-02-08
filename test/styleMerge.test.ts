// src/utils/styleMerge.test.ts
import { describe, it, expect } from 'vitest';
import { mergeStyles } from '../src/utils/styleMerge';

describe('Style Merge Utility', () => {
    it('should merge two style strings', () => {
        const oldStyle = 'color:red;font-size:14px';
        const newStyle = 'background:blue;margin:10px';
        const result = mergeStyles(oldStyle, newStyle);

        expect(result).toContain('color:red');
        expect(result).toContain('font-size:14px');
        expect(result).toContain('background:blue');
        expect(result).toContain('margin:10px');
    });

    it('should override old properties with new ones', () => {
        const oldStyle = 'color:red;font-size:14px';
        const newStyle = 'color:blue;margin:10px';
        const result = mergeStyles(oldStyle, newStyle);

        expect(result).toContain('color:blue');
        expect(result).not.toContain('color:red');
        expect(result).toContain('font-size:14px');
        expect(result).toContain('margin:10px');
    });

    it('should handle empty old style', () => {
        const newStyle = 'color:blue;margin:10px';
        const result = mergeStyles('', newStyle);

        expect(result).toContain('color:blue');
        expect(result).toContain('margin:10px');
    });

    it('should handle empty new style', () => {
        const oldStyle = 'color:red;font-size:14px';
        const result = mergeStyles(oldStyle, '');

        expect(result).toContain('color:red');
        expect(result).toContain('font-size:14px');
    });

    it('should handle both empty styles', () => {
        const result = mergeStyles('', '');

        expect(result).toBe('');
    });

    it('should handle undefined styles', () => {
        const result = mergeStyles(undefined, undefined);

        expect(result).toBe('');
    });

    it('should trim whitespace in properties', () => {
        const oldStyle = ' color : red ; font-size : 14px ';
        const newStyle = ' background : blue ';
        const result = mergeStyles(oldStyle, newStyle);

        expect(result).toContain('color:red');
        expect(result).toContain('font-size:14px');
        expect(result).toContain('background:blue');
    });

    it('should handle styles with semicolon at the end', () => {
        const oldStyle = 'color:red;';
        const newStyle = 'background:blue;';
        const result = mergeStyles(oldStyle, newStyle);

        expect(result).toContain('color:red');
        expect(result).toContain('background:blue');
    });
});
