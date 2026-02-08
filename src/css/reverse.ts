// src/css/reverse.ts
/**
 * Reverse inline styles to CSS rules using smart selectors
 */

interface StyleEntry {
    selector: string;
    normalizedStyle: string;
    element: any;
}

/**
 * Extract inline styles from DOM and convert to CSS rules with smart selectors
 * @param dom - The parsed HTML DOM
 * @returns CSS text with rules using existing classes and nested selectors
 */
export function reverseInlineStyles(dom: any): string {
    const entries: StyleEntry[] = [];
    const autoClassCounter = { count: 0 };

    /**
     * Walk the DOM tree and extract inline styles
     */
    function walk(node: any, parent: any = null) {
        // Skip non-element nodes
        if (node.type !== 'tag') {
            if (node.children) {
                node.children.forEach((child: any) => walk(child, node));
            }
            return;
        }

        // Process inline style if present
        if (node.attribs?.style) {
            const inlineStyle = node.attribs.style.trim();

            if (inlineStyle) {
                const normalized = normalizeStyle(inlineStyle);
                const selector = generateSelector(node, parent, autoClassCounter);

                entries.push({
                    selector,
                    normalizedStyle: normalized,
                    element: node,
                });
            }

            // Always remove inline style
            delete node.attribs.style;
        }

        // Recurse into children
        if (node.children) {
            node.children.forEach((child: any) => walk(child, node));
        }
    }

    walk(dom);

    // Group entries by style for deduplication
    return buildCSS(entries);
}

/**
 * Generate a smart selector for an element
 */
function generateSelector(
    element: any,
    parent: any,
    autoClassCounter: { count: number }
): string {
    // Priority 1: Use existing class
    if (element.attribs?.class) {
        const existingClass = element.attribs.class.split(' ')[0];
        return `.${existingClass}`;
    }

    // Priority 2: Nested selector (parent class + element)
    const parentWithClass = findParentWithClass(parent);
    if (parentWithClass) {
        const parentClass = parentWithClass.attribs.class.split(' ')[0];
        return `.${parentClass} ${element.name}`;
    }

    // Priority 3: Element selector for global elements (body, html)
    if (['body', 'html', 'head'].includes(element.name)) {
        return element.name;
    }

    // Priority 4: Auto-generated class (fallback)
    const autoClass = `auto-style-${++autoClassCounter.count}`;

    // Add the auto class to the element
    if (element.attribs.class) {
        element.attribs.class = `${element.attribs.class} ${autoClass}`;
    } else {
        element.attribs.class = autoClass;
    }

    return `.${autoClass}`;
}

/**
 * Find the nearest parent with a class attribute
 */
function findParentWithClass(node: any): any {
    if (!node) return null;
    if (node.type === 'tag' && node.attribs?.class) {
        return node;
    }
    return findParentWithClass(node.parent);
}

/**
 * Normalize a style string by sorting properties
 */
function normalizeStyle(style: string): string {
    const properties = style
        .split(';')
        .map(p => p.trim())
        .filter(Boolean)
        .sort();

    return properties.join(';');
}

/**
 * Build CSS text from style entries
 */
function buildCSS(entries: StyleEntry[]): string {
    // Group by normalized style for deduplication
    const styleGroups = new Map<string, Set<string>>(); // style -> selectors

    entries.forEach(({ selector, normalizedStyle }) => {
        if (!styleGroups.has(normalizedStyle)) {
            styleGroups.set(normalizedStyle, new Set());
        }
        styleGroups.get(normalizedStyle)!.add(selector);
    });

    // Build CSS rules
    const rules: string[] = [];

    styleGroups.forEach((selectors, normalizedStyle) => {
        const selectorList = Array.from(selectors).join(',\n');

        // Convert normalized style back to readable format
        const declarations = normalizedStyle
            .split(';')
            .map(prop => `  ${prop}`)
            .join(';\n');

        rules.push(`${selectorList} {\n${declarations};\n}`);
    });

    return rules.join('\n\n');
}
