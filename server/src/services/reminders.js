import moment from "moment-timezone";
import { eq } from "drizzle-orm";
import { getDb } from "../config/postgres.js";
import { usersTable } from "../db/schema.js";
import { emailTemplate, escapeHtml, isMailConfigured, sendMail } from "./mailer.js";
import { User } from "../models/User.js";
import { DEFAULT_LANGUAGE, t } from "../i18n/index.js";
import { logger } from "../utils/logger.js";

// Reminders sent before each user's daily check-in time. Text lives in i18n/messages.js.
const REMINDERS = [60, 30, 10].map((minutesBefore) => ({
  label: `${minutesBefore}-min-before`,
  minutesBefore,
}));

function reminderEmail(reminder, name, lang) {
  const key = `email.reminder.${reminder.minutesBefore}`;
  return {
    subject: t(lang, `${key}.subject`),
    html: emailTemplate(
      `
      <h1 style="font-size:20px;color:#161433;text-align:center;">${t(lang, `${key}.heading`)}</h1>
      <p>${t(lang, "email.reminder.greeting", { name })}</p>
      <p>${t(lang, `${key}.body`)}</p>
      <p>${t(lang, "email.reminder.signoff")}</p>`,
      lang,
    ),
  };
}

// A reminder is sent if "now" falls within this many minutes after its scheduled time,
// so a late or skipped cron tick doesn't silently drop it.
const SEND_WINDOW_MINUTES = 5;

/** Returns the reminder due for this user right now, or null. Exported for testing. */
export function dueReminder(user, now = moment.utc()) {
  if (!user.notificationTime) return null;
  const lastSent = user.lastNotificationSent ? moment.utc(user.lastNotificationSent) : null;

  // Check today's and tomorrow's check-in so reminders that cross midnight UTC still fire.
  for (const offsetDays of [0, 1]) {
    const date = now.clone().add(offsetDays, "day").format("YYYY-MM-DD");
    const checkIn = moment.utc(`${date} ${user.notificationTime}`, "YYYY-MM-DD HH:mm:ss");

    for (const reminder of REMINDERS) {
      const sendAt = checkIn.clone().subtract(reminder.minutesBefore, "minutes");
      const minutesLate = now.diff(sendAt, "minutes", true);
      const inWindow = minutesLate >= 0 && minutesLate < SEND_WINDOW_MINUTES;
      const alreadySent = lastSent && lastSent.isSameOrAfter(sendAt);
      if (inWindow && !alreadySent) return reminder;
    }
  }
  return null;
}

/** Send any due reminder emails. Safe to call every minute. */
export async function runReminders(now = moment.utc()) {
  if (!isMailConfigured()) {
    logger.warn("Skipping reminders: email is not configured");
    return { checked: 0, sent: 0 };
  }

  const db = getDb();
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      notificationTime: usersTable.notificationTime,
      lastNotificationSent: usersTable.lastNotificationSent,
    })
    .from(usersTable)
    .where(eq(usersTable.notificationsEnabled, true));

  const due = users.map((user) => ({ user, reminder: dueReminder(user, now) })).filter((d) => d.reminder);
  if (due.length === 0) return { checked: users.length, sent: 0 };

  // Each recipient's language is stored on their account in MongoDB.
  const accounts = await User.find({ email: { $in: due.map((d) => d.user.email) } })
    .select("email preferredLanguage")
    .lean();
  const languageByEmail = new Map(accounts.map((a) => [a.email, a.preferredLanguage]));

  let sent = 0;
  for (const { user, reminder } of due) {
    const lang = languageByEmail.get(user.email) ?? DEFAULT_LANGUAGE;
    try {
      await sendMail({ to: user.email, ...reminderEmail(reminder, escapeHtml(user.name), lang) });
      await db
        .update(usersTable)
        .set({ lastNotificationSent: now.toDate() })
        .where(eq(usersTable.id, user.id));
      sent++;
      logger.info("Reminder sent", { userId: user.id, reminder: reminder.label });
    } catch (err) {
      logger.error("Failed to send reminder", { userId: user.id, error: err.message });
    }
  }
  return { checked: users.length, sent };
}
