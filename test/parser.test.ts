// src/css/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseHTML } from '../src/html/parser';
import { extractCSS, parseCSS } from '../src/css/parser';

describe('CSS Parser', () => {
    describe('extractCSS', () => {
        it('should extract CSS from <style> tags', async () => {
            const html = `
        <html>
          <head>
            <style>.test { color: red; }</style>
          </head>
          <body>
            <div class="test">Hello</div>
          </body>
        </html>
      `;
            const dom = parseHTML(html);
            const { cssText, cleanHTML } = await extractCSS(dom);

            expect(cssText).toContain('.test');
            expect(cssText).toContain('color: red');
        });

        it('should extract CSS from multiple <style> tags', async () => {
            const html = `
        <html>
          <head>
            <style>.class1 { color: red; }</style>
            <style>.class2 { color: blue; }</style>
          </head>
        </html>
      `;
            const dom = parseHTML(html);
            const { cssText } = await extractCSS(dom);

            expect(cssText).toContain('.class1');
            expect(cssText).toContain('color: red');
            expect(cssText).toContain('.class2');
            expect(cssText).toContain('color: blue');
        });

        it('should handle empty <style> tags', async () => {
            const html = `
        <html>
          <head>
            <style></style>
          </head>
        </html>
      `;
            const dom = parseHTML(html);
            const { cssText } = await extractCSS(dom);

            expect(cssText).toBe('');
        });

        it('should handle HTML without <style> tags', async () => {
            const html = `
        <html>
          <body>
            <div>No styles</div>
          </body>
        </html>
      `;
            const dom = parseHTML(html);
            const { cssText } = await extractCSS(dom);

            expect(cssText).toBe('');
        });
    });

    describe('parseCSS', () => {
        it('should parse valid CSS', () => {
            const css = '.test { color: red; font-size: 14px; }';
            const ast = parseCSS(css);

            expect(ast).toBeDefined();
            expect(ast.type).toBe('StyleSheet');
        });

        it('should parse multiple CSS rules', () => {
            const css = `
        .class1 { color: red; }
        .class2 { background: blue; }
        #myid { margin: 10px; }
      `;
            const ast = parseCSS(css);

            expect(ast).toBeDefined();
            expect(ast.type).toBe('StyleSheet');
        });

        it('should parse empty CSS', () => {
            const css = '';
            const ast = parseCSS(css);

            expect(ast).toBeDefined();
        });

        it('should parse CSS with complex properties', () => {
            const css = `
        .test {
          background: linear-gradient(to right, red, blue);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transform: translateX(10px);
        }
      `;
            const ast = parseCSS(css);

            expect(ast).toBeDefined();
            expect(ast.type).toBe('StyleSheet');
        });
    });
});
