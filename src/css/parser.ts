// src/css/parser.ts
import * as csstree from "css-tree";
import fetch from "node-fetch";

export async function extractCSS(dom: any) {
  let cssText = "";

  // Find all <style> tags recursively
  const styleTags = findNodes(dom, "style");
  for (const styleNode of styleTags) {
    cssText += styleNode.children?.[0]?.data || "";
    // Remove style tag from parent
    if (styleNode.parent && styleNode.parent.children) {
      styleNode.parent.children = styleNode.parent.children.filter(
        (n: any) => n !== styleNode,
      );
    }
  }

  // <link rel="stylesheet">
  const links = findNodes(dom, "link");
  for (const link of links) {
    if (link.attribs?.rel === "stylesheet" && link.attribs.href) {
      const res = await fetch(link.attribs.href);
      cssText += await res.text();
    }
  }

  return {
    cssText,
    cleanHTML: dom,
  };
}

function findNodes(node: any, tag: string, acc: any[] = []) {
  if (node.name === tag) acc.push(node);
  node.children?.forEach((c: any) => findNodes(c, tag, acc));
  return acc;
}

export function parseCSS(css: string) {
  return csstree.parse(css);
}
