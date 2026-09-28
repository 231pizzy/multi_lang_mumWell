/**
 * Replace em and en dashes used as punctuation with commas, which read as more natural
 * than dash-heavy AI prose. Number ranges such as "2–3" or "days 1–30" are kept.
 */
export function stripDashes(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/\s*[—–]\s*(?=[\p{L}"“«(])/gu, (match, offset, whole) =>
      /\d$/.test(whole.slice(0, offset).trimEnd()) && /^\s*[—–]\s*\d/.test(match) ? match : ", ",
    )
    .replace(/\s+[—–]\s+/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*([.!?:;])/g, "$1");
}
