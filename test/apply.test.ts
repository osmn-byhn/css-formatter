// src/css/apply.test.ts
import { describe, it, expect } from 'vitest';
import { parseHTML } from '../src/html/parser';
import { applyCSS } from '../src/css/apply';

describe('CSS Apply', () => {
  it('should apply CSS to elements with matching class', () => {
    const html = '<div class="test">Hello</div>';
    const dom = parseHTML(html);
    const css = '.test { color: red; }';

    const { dom: result } = applyCSS(dom, css);
    const div = result.children[0];

    expect(div.attribs.style).toBeDefined();
    expect(div.attribs.style).toContain('color:red');
  });

  it('should apply CSS to multiple elements with same class', () => {
    const html = `
      <div>
        <p class="highlight">Text 1</p>
        <p class="highlight">Text 2</p>
        <p>Text 3</p>
      </div>
    `;
    const dom = parseHTML(html);
    const css = '.highlight { background: yellow; }';

    const { dom: result } = applyCSS(dom, css);

    // Find all elements with class="highlight"
    function findHighlights(node: any, acc: any[] = []): any[] {
      if (node.attribs?.class?.includes('highlight')) {
        acc.push(node);
      }
      node.children?.forEach((child: any) => findHighlights(child, acc));
      return acc;
    }

    const highlights = findHighlights(result);
    expect(highlights.length).toBe(2);
    highlights.forEach(el => {
      expect(el.attribs.style).toContain('background:yellow');
    });
  });

  it('should merge with existing inline styles', () => {
    const html = '<div class="test" style="margin: 10px;">Hello</div>';
    const dom = parseHTML(html);
    const css = '.test { color: red; }';

    const { dom: result } = applyCSS(dom, css);
    const div = result.children[0];

    expect(div.attribs.style).toContain('color:red');
    expect(div.attribs.style).toContain('margin:10px');
  });

  it('should handle multiple CSS properties', () => {
    const html = '<div class="box">Content</div>';
    const dom = parseHTML(html);
    const css = '.box { color: red; background: blue; padding: 5px; }';

    const { dom: result } = applyCSS(dom, css);
    const div = result.children[0];

    expect(div.attribs.style).toContain('color:red');
    expect(div.attribs.style).toContain('background:blue');
    expect(div.attribs.style).toContain('padding:5px');
  });

  it('should handle nested elements', () => {
    const html = `
      <div class="outer">
        <div class="inner">Content</div>
      </div>
    `;
    const dom = parseHTML(html);
    const css = `
      .outer { border: 1px solid black; }
      .inner { color: red; }
    `;

    const { dom: result } = applyCSS(dom, css);

    function findByClass(node: any, className: string): any {
      if (node.attribs?.class?.includes(className)) return node;
      for (const child of node.children || []) {
        const found = findByClass(child, className);
        if (found) return found;
      }
      return null;
    }

    const outer = findByClass(result, 'outer');
    const inner = findByClass(result, 'inner');

    expect(outer.attribs.style).toContain('border:1px solid black');
    expect(inner.attribs.style).toContain('color:red');
  });

  it('should handle elements without matching classes', () => {
    const html = '<div class="other">Hello</div>';
    const dom = parseHTML(html);
    const css = '.test { color: red; }';

    const { dom: result } = applyCSS(dom, css);
    const div = result.children[0];

    expect(div.attribs.style).toBeUndefined();
  });

  it('should handle multiple classes on same element', () => {
    const html = '<div class="btn primary">Button</div>';
    const dom = parseHTML(html);
    const css = `
      .btn { padding: 10px; }
      .primary { background: blue; }
    `;

    const { dom: result } = applyCSS(dom, css);
    const div = result.children[0];

    expect(div.attribs.style).toContain('padding:10px');
    expect(div.attribs.style).toContain('background:blue');
  });

  it('should preserve DOM structure', () => {
    const html = `
      <div class="container">
        <p class="text">Paragraph</p>
        <span>Span</span>
      </div>
    `;
    const dom = parseHTML(html);
    const css = '.text { color: red; }';

    const { dom: result } = applyCSS(dom, css);

    // Find the container div (skip text nodes)
    const container = result.children.find((child: any) => child.type === 'tag');

    // Filter out text nodes (whitespace) from container's children
    const elementChildren = container?.children?.filter((child: any) => child.type === 'tag') || [];

    expect(elementChildren.length).toBe(2);
    expect(elementChildren[0].name).toBe('p');
    expect(elementChildren[1].name).toBe('span');
  });

  it('should apply CSS using element selectors', () => {
    const html = `
      <body>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
        <div>Div</div>
      </body>
    `;
    const dom = parseHTML(html);
    const css = 'p { color: blue; } body { background: white; }';

    const { dom: result } = applyCSS(dom, css);

    function findByTag(node: any, tag: string): any[] {
      const results: any[] = [];
      if (node.name === tag) results.push(node);
      node.children?.forEach((child: any) => results.push(...findByTag(child, tag)));
      return results;
    }

    const body = findByTag(result, 'body')[0];
    const paragraphs = findByTag(result, 'p');

    expect(body.attribs.style).toContain('background:white');
    expect(paragraphs.length).toBe(2);
    paragraphs.forEach(p => {
      expect(p.attribs.style).toContain('color:blue');
    });
  });

  it('should apply CSS using universal selector', () => {
    const html = `
      <div>
        <p>Paragraph</p>
        <span>Span</span>
      </div>
    `;
    const dom = parseHTML(html);
    const css = '* { margin: 0; padding: 0; }';

    const { dom: result } = applyCSS(dom, css);

    function getAllElements(node: any): any[] {
      const results: any[] = [];
      if (node.type === 'tag') results.push(node);
      node.children?.forEach((child: any) => results.push(...getAllElements(child)));
      return results;
    }

    const allElements = getAllElements(result);
    expect(allElements.length).toBeGreaterThan(0);
    allElements.forEach(el => {
      expect(el.attribs.style).toContain('margin:0');
      expect(el.attribs.style).toContain('padding:0');
    });
  });

  it('should apply CSS using descendant selectors', () => {
    const html = `
      <div class="container">
        <p>Direct paragraph</p>
        <div>
          <p>Nested paragraph</p>
        </div>
      </div>
      <p>Outside paragraph</p>
    `;
    const dom = parseHTML(html);
    const css = '.container p { color: red; }';

    const { dom: result } = applyCSS(dom, css);

    function findByTag(node: any, tag: string): any[] {
      const results: any[] = [];
      if (node.name === tag) results.push(node);
      node.children?.forEach((child: any) => results.push(...findByTag(child, tag)));
      return results;
    }

    const allParagraphs = findByTag(result, 'p');
    expect(allParagraphs.length).toBe(3);

    // First two paragraphs are inside .container
    expect(allParagraphs[0].attribs.style).toContain('color:red');
    expect(allParagraphs[1].attribs.style).toContain('color:red');

    // Last paragraph is outside .container
    expect(allParagraphs[2].attribs.style).toBeUndefined();
  });

  it('should skip pseudo-classes and pseudo-elements', () => {
    const html = '<div class="test">Content</div>';
    const dom = parseHTML(html);
    const css = '.test:hover { color: red; } .test::before { content: "x"; }';

    const { dom: result } = applyCSS(dom, css);
    const div = result.children[0];

    // Pseudo-classes and pseudo-elements should be skipped
    expect(div.attribs.style).toBeUndefined();
  });

  it('should handle compound selectors', () => {
    const html = `
      <div class="box">No red</div>
      <div class="box primary">Red</div>
      <p class="box primary">Also red</p>
    `;
    const dom = parseHTML(html);
    const css = '.box.primary { color: red; }';

    const { dom: result } = applyCSS(dom, css);

    function findAll(node: any): any[] {
      const results: any[] = [];
      if (node.type === 'tag') results.push(node);
      node.children?.forEach((child: any) => results.push(...findAll(child)));
      return results;
    }

    const elements = findAll(result);

    // Find elements by checking class attribute includes both parts
    const hasClass = (el: any, cls: string) => el.attribs?.class?.includes(cls);

    const divSingleClass = elements.find(el => el.name === 'div' && hasClass(el, 'box') && !hasClass(el, 'primary'));
    const divDoubleClass = elements.find(el => el.name === 'div' && hasClass(el, 'box') && hasClass(el, 'primary'));
    const pDoubleClass = elements.find(el => el.name === 'p' && hasClass(el, 'box') && hasClass(el, 'primary'));

    // Element with only .box should not have styles
    if (divSingleClass) {
      expect(divSingleClass.attribs?.style).toBeUndefined();
    }

    // Elements with .box.primary should have color:red
    if (divDoubleClass) {
      expect(divDoubleClass.attribs?.style).toContain('color:red');
    }
    if (pDoubleClass) {
      expect(pDoubleClass.attribs?.style).toContain('color:red');
    }

    // At least one element should match
    expect(divDoubleClass || pDoubleClass).toBeDefined();
  });

  it('should preserve pseudo-class rules in preservedCSS', () => {
    const html = '<a href="#">Link</a><button>Button</button>';
    const dom = parseHTML(html);
    const css = `
      a { color: blue; }
      a:hover { color: red; }
      button { padding: 10px; }
      button:focus { outline: 2px solid blue; }
    `;

    const { dom: result, preservedCSS } = applyCSS(dom, css);

    // Normal rules should be inlined
    function findByTag(node: any, tag: string): any[] {
      const results: any[] = [];
      if (node.name === tag) results.push(node);
      node.children?.forEach((child: any) => results.push(...findByTag(child, tag)));
      return results;
    }

    const link = findByTag(result, 'a')[0];
    const button = findByTag(result, 'button')[0];

    expect(link.attribs.style).toContain('color:blue');
    expect(button.attribs.style).toContain('padding:10px');

    // Pseudo-class rules should be preserved
    expect(preservedCSS).toContain('a:hover');
    expect(preservedCSS).toContain('color:red');
    expect(preservedCSS).toContain('button:focus');
    expect(preservedCSS).toContain('outline:2px solid blue');
  });
});
