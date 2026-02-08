// src/utils/styleMerge.ts
export function mergeStyles(oldStyle = "", newStyle = "") {
  const map = new Map<string, string>();

  function parse(s: string) {
    s.split(";").forEach((r) => {
      const [k, v] = r.split(":");
      if (k && v) {
        // Convert double quotes to single quotes to avoid HTML attribute issues
        const cleanValue = v.trim().replace(/"/g, "'");
        map.set(k.trim(), cleanValue);
      }
    });
  }

  parse(oldStyle);
  parse(newStyle);

  return [...map.entries()].map(([k, v]) => `${k}:${v}`).join(";");
}
