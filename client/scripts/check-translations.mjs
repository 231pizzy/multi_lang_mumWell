// Verifies every locale has the same keys, array lengths and {{placeholders}}/<tags> as English.
// Usage: node scripts/check-translations.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../src/i18n/locales");
const languages = fs.readdirSync(root).filter((l) => l !== "en");
const tokens = (s) => [...String(s).matchAll(/\{\{\s*\w+\s*\}\}|<\/?\w+>/g)].map((m) => m[0]).sort().join(",");
const problems = [];

function compare(en, other, where) {
  if (Array.isArray(en)) {
    if (!Array.isArray(other)) return problems.push(`${where}: expected array`);
    if (en.length !== other.length) problems.push(`${where}: ${other.length} items, English has ${en.length}`);
    en.forEach((v, i) => other[i] !== undefined && compare(v, other[i], `${where}[${i}]`));
  } else if (en && typeof en === "object") {
    if (!other || typeof other !== "object") return problems.push(`${where}: expected object`);
    for (const key of Object.keys(en)) {
      if (!(key in other)) problems.push(`${where}.${key}: missing`);
      else compare(en[key], other[key], `${where}.${key}`);
    }
    for (const key of Object.keys(other)) if (!(key in en)) problems.push(`${where}.${key}: not in English`);
  } else if (typeof en === "string") {
    if (typeof other !== "string" || !other.trim()) problems.push(`${where}: empty`);
    else if (tokens(en) !== tokens(other)) problems.push(`${where}: placeholders ${tokens(other)} ≠ ${tokens(en)}`);
  }
}

for (const file of fs.readdirSync(path.join(root, "en"))) {
  const en = JSON.parse(fs.readFileSync(path.join(root, "en", file), "utf8"));
  for (const lang of languages) {
    const p = path.join(root, lang, file);
    if (!fs.existsSync(p)) {
      problems.push(`${lang}/${file}: file missing`);
      continue;
    }
    compare(en, JSON.parse(fs.readFileSync(p, "utf8")), `${lang}/${file.replace(".json", "")}`);
  }
}

console.log(problems.length ? problems.join("\n") : `All ${languages.length} languages match English.`);
process.exit(problems.length ? 1 : 0);
