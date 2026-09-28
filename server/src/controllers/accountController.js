import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { getDb } from "../config/postgres.js";
import { SessionChatTable, usersTable } from "../db/schema.js";
import { Activity } from "../models/Activity.js";
import { ChatSession } from "../models/ChatSession.js";
import { CrisisAlert } from "../models/CrisisAlert.js";
import { Mood } from "../models/Mood.js";
import { Session } from "../models/Session.js";
import { Test } from "../models/Test.js";
import { User } from "../models/User.js";
import { HttpError, badRequest } from "../utils/httpError.js";
import { isSupportedLanguage, t } from "../i18n/index.js";
import { consentRecord, validatePassword } from "./authController.js";
import { requireCountry, requirePhone } from "../utils/contact.js";
import { logger } from "../utils/logger.js";

// Wrong passwords on account actions use 403 (not 401) so the client doesn't sign the user out.
async function confirmPassword(user, password) {
  const valid = typeof password === "string" && (await bcrypt.compare(password, user.password));
  if (!valid) throw new HttpError(403, "auth.wrongPassword");
}

// PATCH /api/account — { name?, preferredLanguage?, country?, phone? }
export async function updateAccount(req, res) {
  const { name, preferredLanguage, country, phone } = req.body ?? {};
  const user = req.user;

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim() || name.length > 100) throw badRequest("auth.nameRequired");
    user.name = name.trim();
  }
  if (preferredLanguage !== undefined) {
    if (!isSupportedLanguage(preferredLanguage)) throw badRequest("validation.invalid", { field: "preferredLanguage" });
    user.preferredLanguage = preferredLanguage;
  }
  if (country !== undefined) {
    user.country = requireCountry(country);
  }
  if (phone !== undefined) {
    user.phone = requirePhone(phone, user.country);
  }
  await user.save();
  res.json({ user });
}

// POST /api/account/consents — for accounts created before consent capture existed.
export async function acceptConsents(req, res) {
  req.user.consents = consentRecord(req.body);
  await req.user.save();
  res.json({ user: req.user });
}

// PUT /api/account/password — { currentPassword, newPassword }
export async function changePassword(req, res) {
  await confirmPassword(req.user, req.body?.currentPassword);
  const password = validatePassword(req.body?.newPassword);
  req.user.password = await bcrypt.hash(password, 12);
  await req.user.save();
  // Keep this session, revoke all others.
  await Session.deleteMany({ userId: req.user._id, token: { $ne: req.token } });
  res.json({ message: t(req.user.preferredLanguage, "account.passwordChanged") });
}

async function postgresData(email) {
  if (!env.databaseUrl) return { profile: null, consultations: [] };
  const db = getDb();
  const [[profile], consultations] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.email, email)),
    db.select().from(SessionChatTable).where(eq(SessionChatTable.createdBy, email)),
  ]);
  return { profile: profile ?? null, consultations };
}

// GET /api/account/export — everything we hold about the user (GDPR Art. 15 & 20).
export async function exportData(req, res) {
  const userId = req.user._id;
  const [sessions, chats, moods, tests, activities, alerts, pg] = await Promise.all([
    Session.find({ userId }).select("createdAt expiresAt deviceInfo lastActive -_id").lean(),
    ChatSession.find({ userId }).select("-_id -__v -userId").lean(),
    Mood.find({ userId }).select("-_id -__v -userId").lean(),
    Test.find({ userId }).select("-_id -__v -userId").lean(),
    Activity.find({ userId }).select("-_id -__v -userId").lean(),
    CrisisAlert.find({ userId }).select("-_id -__v -userId").lean(),
    postgresData(req.user.email),
  ]);

  res.setHeader("Content-Disposition", `attachment; filename="mumwell-data-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    notice:
      "This file contains all personal data MumWell holds about you, provided under GDPR Articles 15 and 20.",
    account: req.user.toJSON(),
    loginSessions: sessions,
    chatSessions: chats,
    moodCheckIns: moods,
    screeningResults: tests,
    activities,
    crisisAlerts: alerts,
    wellnessProfile: pg.profile,
    voiceConsultations: pg.consultations,
  });
}

// DELETE /api/account — { password } — permanently erase the account (GDPR Art. 17).
export async function deleteAccount(req, res) {
  const user = await User.findById(req.user._id); // fresh copy with password hash
  await confirmPassword(user, req.body?.password);
  const { email, _id: userId, preferredLanguage } = user;

  // Postgres first: if it fails, nothing has been deleted yet and the user can retry.
  if (env.databaseUrl) {
    const db = getDb();
    await db.delete(SessionChatTable).where(eq(SessionChatTable.createdBy, email));
    await db.delete(usersTable).where(eq(usersTable.email, email));
  }

  await Promise.all([
    ChatSession.deleteMany({ userId }),
    Mood.deleteMany({ userId }),
    Test.deleteMany({ userId }),
    Activity.deleteMany({ userId }),
    CrisisAlert.deleteMany({ userId }),
    Session.deleteMany({ userId }),
  ]);
  await User.deleteOne({ _id: userId });

  logger.info("Account deleted", { userId: userId.toString() });
  res.json({ message: t(preferredLanguage, "account.deleted") });
}
