// src/css/apply.ts
import * as csstree from "css-tree";
import { mergeStyles } from "../utils/styleMerge";

export function applyCSS(dom: any, cssText: string) {
  const ast = csstree.parse(cssText);
  const preservedRules: string[] = [];

  // First pass: collect at-rules we want to preserve
  csstree.walk(ast, {
    visit: "Atrule",
    enter(node: any) {
      const name = node.name;
      // Preserve @font-face, @import, @keyframes, @media
      if (name === "font-face" || name === "import" || name === "keyframes" || name === "media") {
        preservedRules.push(csstree.generate(node));
      }
    },
  });

  // Second pass: inline normal rules, preserve pseudo-classes
  csstree.walk(ast, {
    visit: "Rule",
    enter(node: any) {
      // Skip rules inside at-rules (like @media, @keyframes, etc.)
      // @ts-ignore - this.atrule is available in the walker context
      if (this.atrule) {
        return;
      }

      const selector = csstree.generate(node.prelude).trim();

      // Skip and preserve pseudo-classes and pseudo-elements
      if (selector.includes(":")) {
        preservedRules.push(csstree.generate(node));
        return;
      }

      const styles: string[] = [];

      csstree.walk(node.block, {
        visit: "Declaration",
        enter(decl: any) {
          styles.push(`${decl.property}:${csstree.generate(decl.value)}`);
        },
      });

      if (styles.length === 0) return;

      // Find all matching elements and apply styles
      const matchingNodes = findMatchingElements(dom, selector);
      matchingNodes.forEach((el) => {
        el.attribs = el.attribs || {};
        el.attribs.style = mergeStyles(el.attribs.style || "", styles.join(";"));
      });
    },
  });

  return {
    dom,
    preservedCSS: preservedRules.join("\n"),
  };
}

/**
 * Find all elements matching a CSS selector
 */
function findMatchingElements(node: any, selector: string): any[] {
  // Handle descendant selectors (e.g., ".parent .child", "div p")
  if (selector.includes(" ")) {
    return findDescendantMatches(node, selector);
  }

  // Handle compound selectors (e.g., "div.class", ".class1.class2")
  // Count dots: if more than 1, it's compound (.class1.class2 has 2 dots)
  // OR if it has a dot but doesn't start with dot (div.class)
  const dotCount = (selector.match(/\./g) || []).length;
  const isCompound = dotCount > 1 || (dotCount === 1 && !selector.startsWith("."));

  if (isCompound) {
    return findCompoundMatches(node, selector);
  }

  // Simple selector
  return findSimpleMatches(node, selector);
}

/**
 * Handle descendant selectors like ".parent .child" or "div p"
 */
function findDescendantMatches(node: any, selector: string): any[] {
  const parts = selector.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return [];

  // Find all elements matching the last part
  const lastSelector = parts[parts.length - 1];
  const ancestors = parts.slice(0, -1);

  const candidates = findSimpleMatches(node, lastSelector);

  // Filter candidates that have matching ancestors
  return candidates.filter((candidate) => {
    let current = candidate.parent;
    let ancestorIndex = ancestors.length - 1;

    while (current && ancestorIndex >= 0) {
      if (matchesSimpleSelector(current, ancestors[ancestorIndex])) {
        ancestorIndex--;
      }
      current = current.parent;
    }

    return ancestorIndex < 0;
  });
}

/**
 * Handle compound selectors like "div.class" or ".class1.class2"
 */
function findCompoundMatches(node: any, selector: string): any[] {
  const results: any[] = [];

  function traverse(n: any) {
    if (n.type === "tag" && matchesCompoundSelector(n, selector)) {
      results.push(n);
    }
    n.children?.forEach(traverse);
  }

  traverse(node);
  return results;
}

/**
 * Check if element matches a compound selector
 */
function matchesCompoundSelector(element: any, selector: string): boolean {
  // Split by . and filter empty strings (e.g., ".box.primary" -> ["box", "primary"])
  const parts = selector.split(".").filter(Boolean);

  // If selector starts with ., all parts are classes
  // If selector doesn't start with ., first part is tag name
  const startsWithDot = selector.startsWith(".");
  const tagName = startsWithDot ? null : parts[0];
  const classes = startsWithDot ? parts : parts.slice(1);

  // Check tag name if present
  if (tagName && element.name !== tagName) {
    return false;
  }

  // Check all classes
  const elementClasses =
    element.attribs?.class?.split(" ").filter(Boolean) || [];
  return classes.every((cls) => elementClasses.includes(cls));
}

/**
 * Find elements matching simple selectors (*, element, .class)
 */
function findSimpleMatches(node: any, selector: string): any[] {
  const results: any[] = [];

  function traverse(n: any) {
    if (n.type === "tag" && matchesSimpleSelector(n, selector)) {
      results.push(n);
    }
    n.children?.forEach(traverse);
  }

  traverse(node);
  return results;
}

/**
 * Check if element matches a simple selector
 */
function matchesSimpleSelector(element: any, selector: string): boolean {
  // Universal selector
  if (selector === "*") {
    return true;
  }

  // Class selector
  if (selector.startsWith(".")) {
    const className = selector.slice(1);
    const elementClasses =
      element.attribs?.class?.split(" ").filter(Boolean) || [];
    return elementClasses.includes(className);
  }

  // Element selector
  return element.name === selector;
}
