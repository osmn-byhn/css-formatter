// test/index.test.ts
import { describe, it, expect } from 'vitest';
import { inlineCSSToDOM as inlineCSS } from '../src/index';

describe('CSS Inliner Integration', () => {
  it('should inline CSS from HTML string', async () => {
    const html = `
      <html>
        <head>
          <style>
            .header { color: blue; font-size: 24px; }
            .content { padding: 20px; }
          </style>
        </head>
        <body>
          <div class="header">Title</div>
          <div class="content">Body text</div>
        </body>
      </html>
    `;

    const result = await inlineCSS(html);

    // Find elements by class
    function findByClass(node: any, className: string): any {
      if (node.attribs?.class?.includes(className)) return node;
      for (const child of node.children || []) {
        const found = findByClass(child, className);
        if (found) return found;
      }
      return null;
    }

    const header = findByClass(result, 'header');
    const content = findByClass(result, 'content');

    expect(header.attribs.style).toContain('color:blue');
    expect(header.attribs.style).toContain('font-size:24px');
    expect(content.attribs.style).toContain('padding:20px');
  });

  it('should preserve existing inline styles', async () => {
    const html = `
      <html>
        <head>
          <style>.box { color: red; }</style>
        </head>
        <body>
          <div class="box" style="margin: 10px;">Content</div>
        </body>
      </html>
    `;

    const result = await inlineCSS(html);

    function findByClass(node: any, className: string): any {
      if (node.attribs?.class?.includes(className)) return node;
      for (const child of node.children || []) {
        const found = findByClass(child, className);
        if (found) return found;
      }
      return null;
    }

    const box = findByClass(result, 'box');

    expect(box.attribs.style).toContain('color:red');
    expect(box.attribs.style).toContain('margin:10px');
  });

  it('should handle complex CSS rules', async () => {
    const html = `
      <html>
        <head>
          <style>
            .card {
              background: linear-gradient(to right, red, blue);
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div class="card">Card content</div>
        </body>
      </html>
    `;

    const result = await inlineCSS(html);

    function findByClass(node: any, className: string): any {
      if (node.attribs?.class?.includes(className)) return node;
      for (const child of node.children || []) {
        const found = findByClass(child, className);
        if (found) return found;
      }
      return null;
    }

    const card = findByClass(result, 'card');

    expect(card.attribs.style).toBeDefined();
    expect(card.attribs.style).toContain('background:');
    expect(card.attribs.style).toContain('box-shadow:');
    expect(card.attribs.style).toContain('border-radius:8px');
  });

  it('should handle multiple style tags', async () => {
    const html = `
      <html>
        <head>
          <style>.red { color: red; }</style>
          <style>.bold { font-weight: bold; }</style>
        </head>
        <body>
          <p class="red">Red text</p>
          <p class="bold">Bold text</p>
          <p class="red bold">Red and bold</p>
        </body>
      </html>
    `;

    const result = await inlineCSS(html);

    function findAllByTag(node: any, tag: string, acc: any[] = []): any[] {
      if (node.name === tag) acc.push(node);
      node.children?.forEach((child: any) => findAllByTag(child, tag, acc));
      return acc;
    }

    const paragraphs = findAllByTag(result, 'p');

    expect(paragraphs[0].attribs.style).toContain('color:red');
    expect(paragraphs[1].attribs.style).toContain('font-weight:bold');
    expect(paragraphs[2].attribs.style).toContain('color:red');
    expect(paragraphs[2].attribs.style).toContain('font-weight:bold');
  });

  it('should handle empty HTML', async () => {
    const html = '';
    const result = await inlineCSS(html);

    expect(result).toBeDefined();
  });

  it('should handle HTML without styles', async () => {
    const html = `
      <html>
        <body>
          <div>No styles here</div>
        </body>
      </html>
    `;

    const result = await inlineCSS(html);

    expect(result).toBeDefined();
    expect(result.children).toBeDefined();
  });

  it('should handle deeply nested elements', async () => {
    const html = `
      <html>
        <head>
          <style>
            .level1 { color: red; }
            .level2 { color: blue; }
            .level3 { color: green; }
          </style>
        </head>
        <body>
          <div class="level1">
            <div class="level2">
              <div class="level3">Deep content</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await inlineCSS(html);

    function findByClass(node: any, className: string): any {
      if (node.attribs?.class?.includes(className)) return node;
      for (const child of node.children || []) {
        const found = findByClass(child, className);
        if (found) return found;
      }
      return null;
    }

    const level1 = findByClass(result, 'level1');
    const level2 = findByClass(result, 'level2');
    const level3 = findByClass(result, 'level3');

    expect(level1.attribs.style).toContain('color:red');
    expect(level2.attribs.style).toContain('color:blue');
    expect(level3.attribs.style).toContain('color:green');
  });
});
