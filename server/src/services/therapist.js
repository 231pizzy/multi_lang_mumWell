import { generateJson, generateText } from "./llm.js";
import { CRISIS_GUIDANCE, CRISIS_RISK_THRESHOLD, contactRequestGuidance, crisisMatches } from "./safety.js";
import { logger } from "../utils/logger.js";
import { LANGUAGE_NAMES } from "../i18n/index.js";
import { stripDashes } from "../utils/text.js";

const HISTORY_WINDOW = 12;

const SYSTEM_PROMPT = `You are the MumWell Therapist, a warm, evidence-based AI companion supporting mothers through pregnancy and the postpartum period, including postpartum depression and anxiety.

Your role:
1. Respond with empathy and validation; mothers often feel guilt, exhaustion and isolation.
2. Use evidence-based approaches (CBT, behavioural activation, grounding, self-compassion, interpersonal therapy principles).
3. Remember context from the conversation and session memory (names, feelings, topics).
4. Keep replies conversational: usually 2–5 short paragraphs, plain language, no clinical jargon.
5. Offer one or two small, practical steps when appropriate, and ask at most one gentle follow-up question.
6. You are not a doctor: do not diagnose or give medication advice; encourage professional care when it would help.
7. Never fabricate facts about the user; if unsure, ask gently.
8. Never use em dashes (—) or en dashes (–) in your text. Use commas, full stops, colons or parentheses instead.

${CRISIS_GUIDANCE}`;

const RESPONSE_FORMAT = `Return ONLY a JSON object with this exact shape:
{
  "reply": "your message to the mother (markdown allowed)",
  "analysis": {
    "emotionalState": "one or two words",
    "themes": ["short theme", "..."],
    "riskLevel": 0,
    "recommendedApproach": "short phrase",
    "progressIndicators": ["short phrase"],
    "sharedAddress": null,
    "sharedPhone": null
  }
}
riskLevel is 0–10: 0 = no concern, 4 = notable distress, 7+ = any sign of self-harm, suicidal thoughts, or risk to the baby.
sharedAddress / sharedPhone: if the mother gives her address (or where she is right now) or a phone number in THIS message, copy it exactly as written; otherwise null. Never guess or reuse earlier messages.`;

const FALLBACK_ANALYSIS = {
  emotionalState: "unknown",
  themes: [],
  riskLevel: 0,
  recommendedApproach: "supportive",
  progressIndicators: [],
  sharedAddress: null,
  sharedPhone: null,
};

function formatHistory(messages) {
  return messages
    .slice(-HISTORY_WINDOW)
    .map((m) => `${m.role === "assistant" ? "Therapist" : "Mother"}: ${m.content}`)
    .join("\n");
}

const sharedText = (value, max) =>
  typeof value === "string" && value.trim() && value.trim().toLowerCase() !== "null"
    ? value.trim().slice(0, max)
    : null;

/** Per-conversation crisis state, so the AI asks for contact details once and never again. */
function crisisStateNote(crisis) {
  if (!crisis?.active) return "";
  const notes = ["CONVERSATION STATE: earlier in this conversation she showed signs of crisis. Keep her safety first."];
  if (crisis.addressShared) notes.push("She has already shared her address; do not ask for it again.");
  else if (crisis.contactAsked) notes.push("You have already asked once for her contact details; do not ask again unless she raises it herself.");
  return `\n\n${notes.join(" ")}`;
}

function normaliseAnalysis(analysis) {
  const a = analysis && typeof analysis === "object" ? analysis : {};
  const risk = Number(a.riskLevel);
  return {
    emotionalState: typeof a.emotionalState === "string" ? a.emotionalState : "unknown",
    themes: Array.isArray(a.themes) ? a.themes.filter((t) => typeof t === "string").slice(0, 8) : [],
    riskLevel: Number.isFinite(risk) ? Math.min(10, Math.max(0, risk)) : 0,
    recommendedApproach:
      typeof a.recommendedApproach === "string" ? a.recommendedApproach : "supportive",
    progressIndicators: Array.isArray(a.progressIndicators)
      ? a.progressIndicators.filter((t) => typeof t === "string").slice(0, 8)
      : [],
    sharedAddress: sharedText(a.sharedAddress, 300),
    sharedPhone: sharedText(a.sharedPhone, 40),
  };
}

/**
 * Produce the therapist's next reply plus a lightweight analysis of the mother's message,
 * in a single model call.
 */
export async function generateTherapistReply({
  message,
  history,
  memory,
  userName,
  language = "en",
  crisisState,
  phoneOnFile = true,
}) {
  const languageName = LANGUAGE_NAMES[language] ?? "English";
  const system = `${SYSTEM_PROMPT}

${contactRequestGuidance({ askPhone: !phoneOnFile })}${crisisStateNote(crisisState)}

LANGUAGE: Always write your reply in ${languageName}, even if the mother writes in another language, unless she explicitly asks you to switch. Use a warm, natural register for ${languageName}. JSON keys and the analysis fields stay in English.`;
  const prompt = `${userName ? `The mother's name is ${userName}.\n` : ""}Session memory:
${JSON.stringify(memory ?? {})}

Conversation so far:
${formatHistory(history) || "(this is the first message)"}

Mother: ${message}

${RESPONSE_FORMAT}`;

  let reply;
  let analysis;
  try {
    const result = await generateJson({ system, prompt, temperature: 0.7 });
    reply = typeof result.reply === "string" ? result.reply.trim() : "";
    analysis = normaliseAnalysis(result.analysis);
  } catch (err) {
    // If structured output fails, fall back to a plain reply rather than failing the message.
    if (err.status === 503) throw err;
    logger.warn("Structured therapist reply failed; falling back to plain text");
    reply = (
      await generateText({
        system,
        prompt: `Conversation so far:\n${formatHistory(history)}\n\nMother: ${message}\n\nWrite your next reply.`,
      })
    ).trim();
    analysis = { ...FALLBACK_ANALYSIS };
  }

  if (!reply) {
    reply = "I'm here with you. Could you tell me a little more about how you're feeling?";
  }
  reply = stripDashes(reply);

  // Two independent signals: the model's own risk rating, and the keyword backstop.
  const modelRiskLevel = analysis.riskLevel;
  const phrases = crisisMatches(message);
  const crisis = modelRiskLevel >= CRISIS_RISK_THRESHOLD || phrases.length > 0;
  if (crisis) analysis.riskLevel = Math.max(analysis.riskLevel, CRISIS_RISK_THRESHOLD);

  return { reply, analysis, crisis, crisisSignals: { modelRiskLevel, phrases } };
}
