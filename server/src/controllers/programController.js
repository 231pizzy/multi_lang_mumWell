import { eq } from "drizzle-orm";
import { getDb } from "../config/postgres.js";
import { usersTable } from "../db/schema.js";
import { generateProgram, PROGRAM_DAYS } from "../services/programGenerator.js";
import { notFound } from "../utils/httpError.js";
import { requestLanguage } from "../i18n/index.js";
import { utcDateKey } from "../utils/dates.js";
import { optionalString, requireNumber, requireString } from "../utils/validate.js";

// Older records stored JSON arrays as a JSON-encoded string inside the jsonb column.
export function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function findProfile(email) {
  const [profile] = await getDb().select().from(usersTable).where(eq(usersTable.email, email));
  return profile ?? null;
}

async function requireProfile(email) {
  const profile = await findProfile(email);
  if (!profile) throw notFound("program.createFirst");
  return profile;
}

function serialiseProfile(profile) {
  return {
    ...profile,
    programPlan: parseJsonArray(profile.programPlan),
    wellnessHistory: parseJsonArray(profile.wellnessHistory),
  };
}

const bool = (value) => value === true || value === "true" || value === "yes";

function parseProgramInput(body = {}) {
  const support = body.supportSystem ?? {};
  return {
    name: requireString(body.name, "Name", { max: 255 }),
    age: requireNumber(body.age, "Age", { min: 18, max: 70, integer: true }),
    isPregnant: bool(body.isPregnant),
    numberOfChildren: requireNumber(body.numberOfChildren ?? 0, "Number of children", {
      min: 0,
      max: 20,
      integer: true,
    }),
    supportSystem: {
      partner: bool(support.partner),
      family: bool(support.family),
      friends: bool(support.friends),
      other: optionalString(support.other, "Other support", { max: 200 }) ?? "",
    },
    hasMentalHealthHistory: bool(body.hasMentalHealthHistory),
    mentalHealthNotes: optionalString(body.mentalHealthNotes, "Mental health notes", { max: 2000 }) ?? null,
    deliveryType: optionalString(body.deliveryType, "Delivery type", { max: 120 }) ?? null,
    postpartumWeeks:
      body.postpartumWeeks === "" || body.postpartumWeeks == null
        ? null
        : requireNumber(body.postpartumWeeks, "Postpartum weeks", { min: 0, max: 104, integer: true }),
  };
}

// GET /api/program
export async function getProgram(req, res) {
  const profile = await findProfile(req.user.email);
  if (!profile) return res.json({ success: true, user: null });
  res.json({ success: true, user: serialiseProfile(profile) });
}

// POST /api/program — generate a new 90-day program from the mother's profile and save it.
export async function createProgram(req, res) {
  const input = parseProgramInput(req.body);

  // Only non-identifying details are sent to the AI provider.
  const { name: _name, ...aiProfile } = input;
  const programPlan = await generateProgram(aiProfile, requestLanguage(req));

  const now = new Date();
  const values = {
    ...input,
    hasActiveProgram: true,
    programStartDate: now,
    programEndDate: new Date(now.getTime() + PROGRAM_DAYS * 24 * 60 * 60 * 1000),
    programPlan,
    updatedAt: now,
  };

  const db = getDb();
  const [saved] = await db
    .insert(usersTable)
    .values({ ...values, email: req.user.email })
    .onConflictDoUpdate({ target: usersTable.email, set: values })
    .returning();

  res.status(201).json({ success: true, user: serialiseProfile(saved) });
}

// PUT /api/program/day — mark a program day complete and save the reflection.
export async function completeDay(req, res) {
  const day = requireNumber(req.body?.day, "Day", { min: 1, max: PROGRAM_DAYS, integer: true });
  const thoughts = optionalString(req.body?.thoughts, "Reflection", { max: 5000 });

  const profile = await requireProfile(req.user.email);
  const plan = parseJsonArray(profile.programPlan);
  const entry = plan.find((p) => Number(p.day) === day);
  if (!entry) throw notFound("program.dayNotFound");

  entry.executedDate ??= new Date().toISOString();
  if (thoughts !== undefined) entry.thoughts = thoughts;

  const [saved] = await getDb()
    .update(usersTable)
    .set({ programPlan: plan, updatedAt: new Date() })
    .where(eq(usersTable.email, req.user.email))
    .returning();

  res.json({
    success: true,
    message: "Program day completed",
    programPlan: parseJsonArray(saved.programPlan),
  });
}

// ---------- Wellness check-ins ----------

// GET /api/wellness
export async function getWellness(req, res) {
  const profile = await findProfile(req.user.email);
  res.json({ success: true, wellnessHistory: profile ? parseJsonArray(profile.wellnessHistory) : [] });
}

// POST /api/wellness — record today's check-in (replaces an earlier entry from the same day).
export async function saveWellness(req, res) {
  const metric = (field) => requireNumber(req.body?.[field], field, { min: 0, max: 100 });
  const entry = {
    date: utcDateKey(),
    mood: metric("mood"),
    stress: metric("stress"),
    sleep: metric("sleep"),
    energy: metric("energy"),
  };

  const profile = await requireProfile(req.user.email);
  const history = parseJsonArray(profile.wellnessHistory).filter((e) => e.date !== entry.date);
  history.push(entry);

  const [saved] = await getDb()
    .update(usersTable)
    .set({ wellnessHistory: history, updatedAt: new Date() })
    .where(eq(usersTable.email, req.user.email))
    .returning();

  res.json({
    success: true,
    message: "Wellness check-in saved",
    entry,
    wellnessHistory: parseJsonArray(saved.wellnessHistory),
  });
}

