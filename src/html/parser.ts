// src/html/parser.ts
import { parseDocument } from "htmlparser2";
import type { Document } from "domhandler";

export function parseHTML(html: string): Document {
  return parseDocument(html);
}
