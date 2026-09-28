import { generateJson } from "./llm.js";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";
import { LANGUAGE_NAMES } from "../i18n/index.js";
import { stripDashes } from "../utils/text.js";

export const PROGRAM_DAYS = 90;
const BATCH_SIZE = 15;

const SYSTEM_PROMPT = `You are MumWell's Clinical Program Generator.
You write daily entries for a personalised 90-day maternal mental-health program.
- SAFE, evidence-based, culturally neutral, supportive.
- NOT a medical diagnosis; no medication advice and no medical instructions.
- Follow WHO & ACOG postpartum wellbeing recommendations.
- Rotate focus across: emotional wellbeing, gentle physical recovery, bonding & parenting,
  mindfulness & grounding, social connection, and sleep & fatigue management.
- Keep tasks small, achievable and supportive (2–4 tasks per day).
- Limited support system → more self-care and rest tasks.
- Mental health history → more grounding and mood-tracking tasks (handled gently).
- welcomeMessage: a warm greeting unique to that day.
- encouragementMessage: a motivating, day-specific booster.
- WRITING STYLE: Never use em dashes (—) or en dashes (–) in your text. Use commas, full stops, colons or parentheses instead.`;

const PHASES = [
  { until: 30, name: "Foundation (days 1–30): rest, self-compassion, small routines, asking for help" },
  { until: 60, name: "Building (days 31–60): strengthening habits, connection, gentle movement" },
  { until: 90, name: "Thriving (days 61–90): confidence, resilience, planning beyond the program" },
];

function phaseFor(day) {
  return PHASES.find((p) => day <= p.until).name;
}

function toStringList(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).map((s) => stripDashes(s.trim()))
    : [];
}

function normaliseDay(raw, day) {
  if (!raw || typeof raw !== "object") return null;
  const entry = {
    day,
    theme: stripDashes(String(raw.theme ?? "").trim()),
    welcomeMessage: stripDashes(String(raw.welcomeMessage ?? "").trim()),
    encouragementMessage: stripDashes(String(raw.encouragementMessage ?? "").trim()),
    objectives: toStringList(raw.objectives),
    tasks: toStringList(raw.tasks),
    reflectionPrompt: stripDashes(String(raw.reflectionPrompt ?? "").trim()),
    executedDate: null,
    thoughts: "",
  };
  if (!entry.theme || !entry.tasks.length || !entry.reflectionPrompt) return null;
  return entry;
}

async function generateBatch(profile, startDay, endDay, language) {
  const prompt = `Mother profile:
${JSON.stringify(profile, null, 2)}

Write program days ${startDay} to ${endDay} (inclusive).
Program phase: ${phaseFor(startDay)}${phaseFor(endDay) !== phaseFor(startDay) ? ` → ${phaseFor(endDay)}` : ""}.
Avoid repeating the same theme on consecutive days.

Return ONLY JSON in this exact format:
{
  "days": [
    {
      "day": ${startDay},
      "theme": "string",
      "welcomeMessage": "string",
      "encouragementMessage": "string",
      "objectives": ["string"],
      "tasks": ["string"],
      "reflectionPrompt": "string"
    }
  ]
}
The "days" array must contain exactly ${endDay - startDay + 1} entries, numbered ${startDay}–${endDay}.
Write every text value in ${LANGUAGE_NAMES[language] ?? "English"}, in a warm, natural tone. Keep the JSON keys in English.`;

  const result = await generateJson({ system: SYSTEM_PROMPT, prompt, temperature: 0.8 });
  const rawDays = Array.isArray(result?.days) ? result.days : [];
  const byDay = new Map(rawDays.map((d) => [Number(d?.day), d]));

  const days = [];
  for (let day = startDay; day <= endDay; day++) {
    const entry = normaliseDay(byDay.get(day), day);
    if (!entry) throw new Error(`Day ${day} missing or incomplete`);
    days.push(entry);
  }
  return days;
}

async function generateBatchWithRetry(profile, startDay, endDay, language, attempts = 2) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await generateBatch(profile, startDay, endDay, language);
    } catch (err) {
      if (err.status === 503 || attempt >= attempts) throw err;
      logger.warn("Program batch failed, retrying", { startDay, endDay, error: err.message });
    }
  }
}

/** Generate the full 90-day program for a mother's profile. */
export async function generateProgram(profile, language = "en") {
  const batches = [];
  for (let start = 1; start <= PROGRAM_DAYS; start += BATCH_SIZE) {
    batches.push(
      generateBatchWithRetry(profile, start, Math.min(start + BATCH_SIZE - 1, PROGRAM_DAYS), language),
    );
  }

  try {
    return (await Promise.all(batches)).flat();
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error("Program generation failed", { error: err.message });
    throw new HttpError(502, "program.failed");
  }
}
