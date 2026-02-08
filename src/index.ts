// src/index.ts
import fetch from "node-fetch";
import render from "dom-serializer";
import type { Document } from "domhandler";
import { parseHTML } from "./html/parser.js";
import { extractCSS } from "./css/parser.js";
import { applyCSS } from "./css/apply.js";
import { reverseInlineStyles } from "./css/reverse.js";

/**
 * Forward conversion: CSS to inline styles (returns HTML string)
 * @param input - HTML string or URL
 * @returns HTML with inlined CSS
 */
export async function inlineCSS(input: string): Promise<string> {
  const dom = await inlineCSSToDOM(input);
  return domToHTML(dom);
}

/**
 * Forward conversion: CSS to inline styles (returns DOM)
 * @param input - HTML string or URL
 * @returns DOM with inlined CSS
 */
export async function inlineCSSToDOM(input: string) {
  let html = input;

  // URL mi, HTML mi?
  if (/^https?:\/\//.test(input)) {
    const res = await fetch(input);
    html = await res.text();
  }

  const dom = parseHTML(html);
  const { cssText, cleanHTML } = await extractCSS(dom);
  const { dom: resultDom, preservedCSS } = applyCSS(cleanHTML, cssText);

  // Inject preserved CSS into <head> if there are any rules
  if (preservedCSS && preservedCSS.trim()) {
    injectPreservedCSS(resultDom, preservedCSS);
  }

  return resultDom;
}

/**
 * Reverse conversion: inline styles to internal CSS (returns HTML string)
 * @param input - HTML string or URL
 * @returns HTML with CSS in <style> tag
 */
export async function reverseCSSInternal(input: string): Promise<string> {
  const dom = await reverseCSS(input);
  return domToHTML(dom);
}

/**
 * Reverse conversion: inline styles to internal CSS (returns DOM)
 * @param input - HTML string or URL
 * @returns DOM with inline styles converted to CSS in a style tag
 */
export async function reverseCSS(input: string): Promise<Document> {
  let html = input;

  // URL mi, HTML mi?
  if (/^https?:\/\//.test(input)) {
    const res = await fetch(input);
    html = await res.text();
  }

  const dom = parseHTML(html);

  // Collect existing CSS from style tags
  const existingCSS = collectExistingCSS(dom);

  // Extract inline styles and convert to CSS
  const reversedCSS = reverseInlineStyles(dom);

  // Combine existing + reversed CSS
  const allCSS = [existingCSS, reversedCSS]
    .filter(css => css && css.trim())
    .join('\n\n');

  // Inject combined CSS into <head>
  if (allCSS && allCSS.trim()) {
    injectPreservedCSS(dom, allCSS);
  }

  return dom;
}

/**
 * Reverse conversion: inline styles to external CSS file
 * @param input - HTML string or URL
 * @returns Object with HTML and CSS strings
 */
export async function reverseCSSExternal(input: string): Promise<{ html: string, css: string }> {
  let html = input;

  // URL mi, HTML mi?
  if (/^https?:\/\//.test(input)) {
    const res = await fetch(input);
    html = await res.text();
  }

  const dom = parseHTML(html);

  // Collect existing CSS from style tags
  const existingCSS = collectExistingCSS(dom);

  // Extract inline styles and convert to CSS
  const reversedCSS = reverseInlineStyles(dom);

  // Combine existing + reversed CSS
  const allCSS = [existingCSS, reversedCSS]
    .filter(css => css && css.trim())
    .join('\n\n');

  // Add link tag to head instead of style tag
  const head = findNode(dom, 'head');
  if (head && allCSS && allCSS.trim()) {
    const linkNode = {
      type: 'tag',
      name: 'link',
      attribs: {
        rel: 'stylesheet',
        href: 'styles.css'
      },
      children: [],
      parent: head,
    };

    head.children = head.children || [];
    head.children.push(linkNode);
  }

  return {
    html: domToHTML(dom),
    css: allCSS || ''
  };
}

/**
 * Convert DOM to HTML string with proper entity handling
 */
function domToHTML(dom: any): string {
  let html = render(dom);

  // Fix HTML entities in CSS (dom-serializer escapes quotes in style tags)
  html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (match, open, content, close) => {
    const unescaped = content
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    return open + unescaped + close;
  });

  return html;
}

/**
 * Collect CSS from existing <style> tags in the DOM
 */
function collectExistingCSS(dom: any): string {
  const cssBlocks: string[] = [];
  const nodesToRemove: any[] = [];

  function walk(node: any) {
    if (node.type === 'tag' && node.name === 'style') {
      // Extract text content from style tag
      if (node.children) {
        node.children.forEach((child: any) => {
          if (child.type === 'text' && child.data) {
            cssBlocks.push(child.data.trim());
          }
        });
      }
      // Mark for removal
      nodesToRemove.push({ parent: node.parent, node });
    }

    if (node.children) {
      // Create a copy to avoid modification during iteration
      const children = [...node.children];
      children.forEach(walk);
    }
  }

  walk(dom);

  // Remove all marked style tags
  nodesToRemove.forEach(({ parent, node }) => {
    if (parent?.children) {
      const index = parent.children.indexOf(node);
      if (index > -1) {
        parent.children.splice(index, 1);
      }
    }
  });

  return cssBlocks.join('\n\n');
}

/**
 * Inject preserved CSS into a <style> tag in <head>
 */
function injectPreservedCSS(dom: any, css: string) {
  const head = findNode(dom, "head");

  if (head) {
    const styleNode = {
      type: "tag",
      name: "style",
      attribs: {},
      children: [{ type: "text", data: `\n${css}\n` }],
      parent: head,
    };

    head.children = head.children || [];
    head.children.push(styleNode);
  }
}

/**
 * Find a node by tag name in the DOM tree
 */
function findNode(node: any, tagName: string): any {
  if (node.name === tagName) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, tagName);
      if (found) return found;
    }
  }

  return null;
}
