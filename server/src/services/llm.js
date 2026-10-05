import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

/**
 * Single entry point for every AI call in the app. Works with either:
 *   - GEMINI_API_KEY      → Google Gemini API directly
 *   - OPENROUTER_API_KEY  → OpenRouter (OpenAI-compatible)
 * Set LLM_PROVIDER=gemini|openrouter to force one when both keys are present.
 */

let geminiClient;
let openRouterClient;
let override = null;

/** Tests only: replace the provider with fn({ system, prompt, json }) => string. */
export function setLlmOverride(fn) {
  override = fn;
}

export function activeProvider() {
  if (override) return "override";
  if (env.llmProvider === "gemini" && env.geminiApiKey) return "gemini";
  if (env.llmProvider === "openrouter" && env.openRouterApiKey) return "openrouter";
  if (env.geminiApiKey) return "gemini";
  if (env.openRouterApiKey) return "openrouter";
  return null;
}

async function callGemini({ system, prompt, json, temperature, maxTokens }) {
  geminiClient ??= new GoogleGenAI({ apiKey: env.geminiApiKey });
  const response = await geminiClient.models.generateContent({
    model: env.geminiModel,
    contents: prompt,
    config: {
      systemInstruction: system,
      temperature,
      maxOutputTokens: maxTokens,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  });
  return response.text ?? "";
}

async function callOpenRouter({ system, prompt, json, temperature, maxTokens }) {
  openRouterClient ??= new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: env.openRouterApiKey,
  });
  const completion = await openRouterClient.chat.completions.create({
    model: env.openRouterModel,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      { role: "user", content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: "json_object" } } : {}),
  });
  return completion.choices[0]?.message?.content ?? "";
}

/**
 * Generate text (or JSON text when json=true). Throws HttpError(503) when no provider
 * is configured and HttpError(502) when the provider call fails.
 */
export async function generateText({ system, prompt, json = false, temperature = 0.7, maxTokens }) {
  const provider = activeProvider();
  if (!provider) {
    throw new HttpError(503, "ai.notConfigured");
  }

  try {
    const call = override ?? (provider === "gemini" ? callGemini : callOpenRouter);
    return await call({ system, prompt, json, temperature, maxTokens });
  } catch (err) {
    logger.error("LLM request failed", { provider, status: err.status, error: err.message });
    const failure = new HttpError(502, "ai.unavailable");
    // Rate limited: pass on how long the provider asked us to wait, so callers can retry.
    if (err.status === 429) failure.retryAfterMs = retryAfterMs(err);
    throw failure;
  }
}

/** Reads the provider's suggested wait from a 429 error, e.g. Gemini's "Please retry in 24.9s". */
function retryAfterMs(err) {
  const header = Number(err.headers?.["retry-after"] ?? err.headers?.get?.("retry-after"));
  if (Number.isFinite(header) && header > 0) return header * 1000;
  const match = String(err.message ?? "").match(/retry in ([\d.]+)s|"retryDelay":\s*"(\d+)s"/i);
  return match ? Math.ceil(Number(match[1] ?? match[2]) * 1000) : undefined;
}

/** Generate and parse a JSON object. Throws HttpError(502) if the model returns invalid JSON. */
export async function generateJson(options) {
  const raw = await generateText({ ...options, json: true });
  try {
    return parseJsonResponse(raw);
  } catch (err) {
    logger.error("LLM returned invalid JSON", { error: err.message, sample: raw.slice(0, 200) });
    throw new HttpError(502, "ai.badResponse");
  }
}

/** Parse JSON from a model response, tolerating ```json fences and surrounding prose. */
export function parseJsonResponse(raw) {
  const text = String(raw ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("No JSON object found");
    return JSON.parse(text.slice(start, end + 1));
  }
}
