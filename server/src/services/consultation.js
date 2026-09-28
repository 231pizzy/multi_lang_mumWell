import { generateJson } from "./llm.js";
import { doctors, findLocalizedDoctor } from "../data/doctors.js";
import { LANGUAGE_NAMES } from "../i18n/index.js";
import { stripDashes } from "../utils/text.js";

const DOCTOR_CATALOGUE = doctors.map(({ id, specialist, description }) => ({
  id,
  specialist,
  description,
}));

const SUGGEST_SYSTEM = `You are an AI doctor-recommendation engine for MumWell, a platform for mothers.
You may ONLY choose doctors from this list:
${JSON.stringify(DOCTOR_CATALOGUE)}

Rules:
1. Match the user's symptoms to the 1–3 most relevant doctors.
2. General symptoms (cold, headache, fever, body pain, weakness, dizziness) → id 1 (General Physician).
3. Mental or emotional stress, low mood, anxiety → id 7.
4. Pregnancy → id 3. Breastfeeding → id 5. Children → id 2.
5. Never invent a doctor.
Return ONLY JSON: {"doctorIds": [number, ...]}`;

export async function suggestDoctors(notes, language = "en") {
  const result = await generateJson({
    system: SUGGEST_SYSTEM,
    prompt: `User symptoms: ${notes}`,
    temperature: 0.2,
  });
  const ids = Array.isArray(result?.doctorIds) ? result.doctorIds : [];
  const suggested = [...new Set(ids.map(Number))]
    .map((id) => findLocalizedDoctor(id, language))
    .filter(Boolean)
    .slice(0, 3);
  // Always offer at least the General Physician.
  return suggested.length ? suggested : [findLocalizedDoctor(1, language)];
}

const REPORT_SYSTEM = `You are an AI medical-report generator for MumWell. Analyse the conversation between a mother and an AI specialist and produce a structured, professional report.
Tone: professional, reassuring, concise, NEVER alarming. Do not invent details that were not discussed.
WRITING STYLE: Never use em dashes (—) or en dashes (–) in your text. Use commas, full stops, colons or parentheses instead.

Return ONLY JSON with these fields:
{
  "agent": "specialist name",
  "user": "patient name, or \\"Anonymous\\" if not provided",
  "chiefComplaint": "one-sentence summary of the main concern",
  "summary": "2–3 sentence summary",
  "symptoms": ["..."],
  "duration": "how long symptoms have been present, or \\"Not specified\\"",
  "severity": "mild | moderate | severe | not assessed",
  "medicationsMentioned": ["..."],
  "recommendations": ["..."]
}`;

const asList = (value) =>
  Array.isArray(value) ? value.filter((v) => typeof v === "string").slice(0, 20).map(stripDashes) : [];

export async function generateMedicalReport({ sessionId, doctor, notes, messages, userName, language = "en" }) {
  const transcript = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
  const report = await generateJson({
    system: REPORT_SYSTEM,
    prompt: `Specialist: ${doctor?.specialist ?? "AI Specialist"}
Patient name: ${userName || "Anonymous"}
Notes provided before the call: ${notes || "None"}

Conversation:
${transcript || "(no conversation was captured)"}

Write every text value in ${LANGUAGE_NAMES[language] ?? "English"}. For "severity" use the ${LANGUAGE_NAMES[language] ?? "English"} word for mild, moderate, severe or not assessed. Keep the JSON keys in English.`,
    temperature: 0.2,
  });

  return {
    sessionId,
    agent: typeof report.agent === "string" ? report.agent : doctor?.specialist,
    user: typeof report.user === "string" ? report.user : userName || "Anonymous",
    timestamp: new Date().toISOString(),
    chiefComplaint: stripDashes(String(report.chiefComplaint ?? "")),
    summary: stripDashes(String(report.summary ?? "")),
    symptoms: asList(report.symptoms),
    duration: stripDashes(String(report.duration ?? "")),
    severity: String(report.severity ?? ""),
    medicationsMentioned: asList(report.medicationsMentioned),
    recommendations: asList(report.recommendations),
  };
}
