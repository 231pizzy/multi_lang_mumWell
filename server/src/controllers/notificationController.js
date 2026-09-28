import crypto from "node:crypto";
import moment from "moment-timezone";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { getDb } from "../config/postgres.js";
import { usersTable } from "../db/schema.js";
import { findProfile } from "./programController.js";
import { runReminders } from "../services/reminders.js";
import { badRequest, HttpError, unauthorized } from "../utils/httpError.js";

const DEFAULT_TIMEZONE = "UTC";
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

// Settings are stored as a UTC time; the API speaks the user's local time.
const utcToLocal = (utcTime, timezone) =>
  moment.utc(utcTime, "HH:mm:ss").tz(timezone).format("HH:mm");

const localToUtc = (localTime, timezone) =>
  moment
    .tz(`${moment().tz(timezone).format("YYYY-MM-DD")} ${localTime}`, "YYYY-MM-DD HH:mm", timezone)
    .utc()
    .format("HH:mm:ss");

// GET /api/notifications
export async function getSettings(req, res) {
  const profile = await findProfile(req.user.email);
  const timezone = profile?.timezone || DEFAULT_TIMEZONE;
  res.json({
    hasProfile: Boolean(profile),
    notificationsEnabled: profile?.notificationsEnabled ?? true,
    notificationTime: profile?.notificationTime
      ? utcToLocal(profile.notificationTime, timezone)
      : "08:00",
    timezone,
    lastNotificationSent: profile?.lastNotificationSent ?? null,
  });
}

// PUT /api/notifications — { notificationsEnabled, notificationTime: "HH:mm" (local), timezone }
export async function updateSettings(req, res) {
  const { notificationsEnabled } = req.body ?? {};
  const notificationTime = String(req.body?.notificationTime || "08:00").slice(0, 5);
  const timezone = String(req.body?.timezone || "UTC");

  if (typeof notificationsEnabled !== "boolean") {
    throw badRequest("validation.invalid", { field: "notificationsEnabled" });
  }
  if (!TIME_PATTERN.test(notificationTime)) throw badRequest("notifications.invalidTime");
  if (!moment.tz.zone(timezone)) throw badRequest("notifications.invalidTimezone");

  if (!(await findProfile(req.user.email))) {
    throw new HttpError(409, "notifications.createProgramFirst");
  }

  await getDb()
    .update(usersTable)
    .set({
      notificationsEnabled,
      notificationTime: localToUtc(notificationTime, timezone),
      timezone,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.email, req.user.email));

  res.json({ status: "success", message: "Notification settings updated" });
}

// POST /api/notifications/run — for an external scheduler. Requires the x-cron-secret header.
export async function runNow(req, res) {
  const provided = req.get("x-cron-secret") ?? "";
  const expected = env.cronSecret ?? "";
  const valid =
    expected.length > 0 &&
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  if (!valid) throw unauthorized("auth.required");

  res.json({ status: "ok", ...(await runReminders()) });
}
