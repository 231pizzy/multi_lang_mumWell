import { generateJson } from "./llm.js";
import { logger } from "../utils/logger.js";

const SYSTEM = `You are MumWell's contact-details extractor. You read short excerpts from a support conversation
with a mother who may be in crisis, in any language.
Return ONLY JSON: {"address": string|null, "phone": string|null}
- address: the address or place where she says she is (street, building, town), copied as she said it. Null if she gave none.
- phone: a phone number she gave, copied as she said it (spoken digits may be written as numbers). Null if none.
Only use what the MOTHER says herself. Never guess, complete or infer details. If she refuses or is unsure, return nulls.`;

const clean = (value, max) =>
  typeof value === "string" && value.trim() && value.trim().toLowerCase() !== "null" ? value.trim().slice(0, max) : null;

/**
 * Pull an address or phone number the mother chose to share out of transcript lines.
 * `lines` are { role: "user" | "assistant", text }. Returns nulls on any failure.
 */
export async function extractContactDetails(lines) {
  const transcript = lines
    .filter((l) => l?.text)
    .map((l) => `${l.role === "user" ? "Mother" : "Specialist"}: ${String(l.text).slice(0, 1000)}`)
    .join("\n");
  if (!transcript) return { address: null, phone: null };
  try {
    const result = await generateJson({ system: SYSTEM, prompt: transcript, temperature: 0 });
    return { address: clean(result?.address, 300), phone: clean(result?.phone, 40) };
  } catch (err) {
    logger.warn("Contact-details extraction failed", { error: err.message });
    return { address: null, phone: null };
  }
}
