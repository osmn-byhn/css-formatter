// src/css/reverse.test.ts
import { describe, it, expect } from 'vitest';
import { parseHTML } from '../src/html/parser';
import { reverseInlineStyles } from '../src/css/reverse';

describe('Reverse Inline Styles', () => {
    it('should extract inline styles and create CSS rules', () => {
        const html = '<div style="color:red">Hello</div>';
        const dom = parseHTML(html);

        const css = reverseInlineStyles(dom);

        // Should generate a CSS rule
        expect(css).toContain('.auto-style-1');
        expect(css).toContain('color:red');

        // Inline style should be removed
        const div = dom.children[0];
        expect(div.attribs.style).toBeUndefined();

        // Class should be added
        expect(div.attribs.class).toBe('auto-style-1');
    });

    it('should deduplicate identical styles', () => {
        const html = `
      <div class="item" style="color:red;font-size:16px">A</div>
      <span class="item" style="color:red;font-size:16px">B</span>
    `;
        const dom = parseHTML(html);

        const css = reverseInlineStyles(dom);

        // Should use .item for both (existing class)
        expect(css).toContain('.item');

        // Should only have one rule since both share .item class
        const ruleCount = (css.match(/\{/g) || []).length;
        expect(ruleCount).toBe(1);
    });

    it('should normalize style order for deduplication', () => {
        const html = `
      <div class="box" style="color:red;font-size:16px">A</div>
      <span class="box" style="font-size:16px;color:red">B</span>
    `;
        const dom = parseHTML(html);

        const css = reverseInlineStyles(dom);

        // Should deduplicate despite different order, using existing class
        expect(css).toContain('.box');
        const ruleCount = (css.match(/\{/g) || []).length;
        expect(ruleCount).toBe(1);
    });

    it('should preserve existing classes without adding auto classes', () => {
        const html = '<div class="existing" style="color:red">Hello</div>';
        const dom = parseHTML(html);

        reverseInlineStyles(dom);

        const div = dom.children[0];
        // Should use existing class, not add auto-style
        expect(div.attribs.class).toBe('existing');
        expect(div.attribs.class).not.toContain('auto-style');
    });

    it('should handle elements without inline styles', () => {
        const html = '<div>No styles</div>';
        const dom = parseHTML(html);

        const css = reverseInlineStyles(dom);

        // Should return empty CSS
        expect(css).toBe('');

        // Element should remain unchanged
        const div = dom.children[0];
        expect(div.attribs.style).toBeUndefined();
        expect(div.attribs.class).toBeUndefined();
    });

    it('should handle nested elements', () => {
        const html = `
      <div style="color:red">
        <span style="font-size:14px">Child</span>
      </div>
    `;
        const dom = parseHTML(html);

        const css = reverseInlineStyles(dom);

        // Should have two different rules
        const ruleCount = (css.match(/\.auto-style-/g) || []).length;
        expect(ruleCount).toBe(2);
    });

    it('should handle empty style attributes', () => {
        const html = '<div style="">Empty</div>';
        const dom = parseHTML(html);

        const css = reverseInlineStyles(dom);

        // Should not create rules for empty styles
        expect(css).toBe('');

        const div = dom.children[0];
        // Empty style should be removed (either undefined or empty string)
        expect(div.attribs.style || undefined).toBeUndefined();
    });
});
