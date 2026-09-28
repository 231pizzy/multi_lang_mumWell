import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../config/postgres.js";
import { SessionChatTable } from "../db/schema.js";
import { findLocalizedDoctor, localizedDoctors } from "../data/doctors.js";
import { isSupportedLanguage, requestLanguage } from "../i18n/index.js";
import { generateMedicalReport, suggestDoctors } from "../services/consultation.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { optionalString, requireString } from "../utils/validate.js";
import { crisisMatches } from "../services/safety.js";
import {
  describeSignals,
  findSessionAlert,
  raiseCrisisAlert,
  recordSharedContact,
} from "../services/crisisAlert.js";
import { extractContactDetails } from "../services/contactExtractor.js";

const MAX_TRANSCRIPT_MESSAGES = 500;

// GET /api/consultations/doctors
export function listDoctors(req, res) {
  res.json(localizedDoctors(requestLanguage(req), { phoneOnFile: Boolean(req.user.phone) }));
}

// POST /api/consultations/suggest — { notes }
export async function suggest(req, res) {
  const notes = requireString(req.body?.notes, "Symptoms", { max: 2000 });
  res.json({ suggestedDoctors: await suggestDoctors(notes, requestLanguage(req)) });
}

// Keep only the fields the voice agent needs; cap sizes since this comes from the client.
function sanitiseDoctor(doctor, user) {
  if (!doctor || typeof doctor !== "object") throw badRequest("consultation.chooseSpecialist");
  const language = isSupportedLanguage(doctor.language) ? doctor.language : "en";
  // Instructions always come from our own list, never from the browser, so the safety
  // protocol can't be removed or go stale.
  const canonical = findLocalizedDoctor(doctor.id, language, { phoneOnFile: Boolean(user.phone) });
  if (!canonical) throw badRequest("consultation.chooseSpecialist");
  return {
    id: Number(doctor.id) || 0,
    specialist: requireString(doctor.specialist, "Specialist", { max: 120 }),
    description: optionalString(doctor.description, "Description", { max: 500 }) ?? "",
    image: optionalString(doctor.image, "Image", { max: 300 }) ?? "",
    agentPrompt: canonical.agentPrompt,
    voiceId: optionalString(doctor.voiceId, "Voice", { max: 60 }) ?? "Paige",
    firstMessage: optionalString(doctor.firstMessage, "First message", { max: 500 }) ?? "",
    voiceGender: doctor.voiceGender === "male" ? "male" : "female",
    language,
  };
}

// POST /api/consultations — { notes, selectedDoctor }
export async function createConsultation(req, res) {
  const notes = optionalString(req.body?.notes, "Notes", { max: 2000 }) ?? "";
  const selectedDoctor = sanitiseDoctor(req.body?.selectedDoctor, req.user);

  const [created] = await getDb()
    .insert(SessionChatTable)
    .values({
      sessionId: crypto.randomUUID(),
      createdBy: req.user.email,
      notes,
      selectedDoctor,
      createdOn: new Date().toISOString(),
    })
    .returning();

  res.status(201).json(created);
}

// GET /api/consultations
export async function listConsultations(req, res) {
  const rows = await getDb()
    .select()
    .from(SessionChatTable)
    .where(eq(SessionChatTable.createdBy, req.user.email))
    .orderBy(desc(SessionChatTable.id));
  res.json(rows);
}

async function findOwnConsultation(req) {
  const [row] = await getDb()
    .select()
    .from(SessionChatTable)
    .where(
      and(
        eq(SessionChatTable.sessionId, req.params.sessionId),
        eq(SessionChatTable.createdBy, req.user.email),
      ),
    );
  if (!row) throw notFound("consultation.notFound");
  return row;
}

// GET /api/consultations/:sessionId
export async function getConsultation(req, res) {
  res.json(await findOwnConsultation(req));
}

// POST /api/consultations/:sessionId/report — { messages: [{ role, text }] }
export async function createReport(req, res) {
  const consultation = await findOwnConsultation(req);

  const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = raw
    .slice(-MAX_TRANSCRIPT_MESSAGES)
    .filter((m) => m && typeof m.text === "string" && m.text.trim())
    .map((m) => ({ role: String(m.role ?? "user").slice(0, 30), text: m.text.slice(0, 4000) }));

  const report = await generateMedicalReport({
    sessionId: consultation.sessionId,
    doctor: consultation.selectedDoctor,
    notes: consultation.notes,
    messages,
    userName: req.user.name,
    language: requestLanguage(req),
  });

  await getDb()
    .update(SessionChatTable)
    .set({ report, conversation: messages })
    .where(eq(SessionChatTable.id, consultation.id));

  // Backstop for the live check below: alert if the call ended before a crisis line reached us,
  // and pick up contact details shared after the crisis if they were missed.
  const firstCrisis = messages.findIndex((m) => m.role === "user" && crisisMatches(m.text).length);
  if (firstCrisis !== -1) {
    const existing = await findSessionAlert(req.user._id, consultation.sessionId);
    const afterCrisis = messages.slice(firstCrisis);
    if (!existing) {
      const flagged = messages.filter((m) => m.role === "user" && crisisMatches(m.text).length);
      raiseCrisisAlert({
        user: req.user,
        source: "consultation",
        reasons: describeSignals({ phrases: [...new Set(flagged.flatMap((m) => crisisMatches(m.text)))] }),
        excerpt: flagged.map((m) => m.text).join("\n"),
        sessionId: consultation.sessionId,
        contact: await extractContactDetails(afterCrisis),
      });
    } else if (needsContact(existing, req.user)) {
      const contact = await extractContactDetails(afterCrisis);
      recordSharedContact({ user: req.user, sessionId: consultation.sessionId, ...contact });
    }
  }

  res.json(report);
}

const needsContact = (alert, user) => !alert.sharedAddress || (!user.phone && !alert.sharedPhone);

// POST /api/consultations/:sessionId/utterances — { text, previous? }
// Called live for each finished sentence the mother speaks, so a crisis reaches the helpline
// during the call rather than after it. `previous` is the specialist's last line, which gives
// context to an answer such as "yes, it's 12 Main Street".
export async function checkUtterance(req, res) {
  const consultation = await findOwnConsultation(req);
  const text = requireString(req.body?.text, "Transcript", { max: 2000 });
  const previous = optionalString(req.body?.previous, "Previous line", { max: 1000 });
  const { sessionId } = consultation;

  const phrases = crisisMatches(text);
  const existing = await findSessionAlert(req.user._id, sessionId);
  const lines = [...(previous ? [{ role: "assistant", text: previous }] : []), { role: "user", text }];
  // Runs alongside the call; the response doesn't wait for the AI extraction.
  const captureContact = () =>
    extractContactDetails(lines).then((contact) => recordSharedContact({ user: req.user, sessionId, ...contact }));

  if (phrases.length && !existing) {
    raiseCrisisAlert({
      user: req.user,
      source: "consultation",
      reasons: describeSignals({ phrases }),
      excerpt: text,
      sessionId,
    });
    captureContact(); // in case she says where she is in the same breath
    return res.json({ crisis: true, newCrisis: true });
  }

  if (existing && needsContact(existing, req.user)) captureContact();

  res.json({ crisis: Boolean(existing), newCrisis: false });
}
