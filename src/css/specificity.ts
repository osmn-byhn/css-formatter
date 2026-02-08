// src/css/specificity.ts
export function calcSpecificity(selector: string) {
  let id = (selector.match(/#/g) || []).length;
  let cls = (selector.match(/\./g) || []).length;
  let tag = selector.replace(/[#.][\w-]+/g, "").trim() ? 1 : 0;
  return id * 100 + cls * 10 + tag;
}
