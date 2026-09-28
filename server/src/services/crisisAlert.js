import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { getDb } from "../config/postgres.js";
import { usersTable } from "../db/schema.js";
import { CrisisAlert } from "../models/CrisisAlert.js";
import { Test } from "../models/Test.js";
import { LANGUAGE_NAMES } from "../i18n/index.js";
import { logger } from "../utils/logger.js";
import { escapeHtml, isMailConfigured, sendMail } from "./mailer.js";
import { tidyPhone } from "../utils/contact.js";

const SOURCE_LABELS = {
  chat: "AI companion chat",
  screening: "EPDS screening",
  consultation: "Voice consultation",
  mood: "Mood check-in note",
};

// Work still in progress, so tests (and graceful shutdown) can wait for it. `raising` holds
// only new alerts, which contact updates must wait for before they can attach to them.
const inFlight = new Set();
const raising = new Set();

/** Human-readable reasons for a chat or consultation alert. */
export function describeSignals({ phrases = [], modelRiskLevel } = {}) {
  const reasons = [];
  if (phrases.length) reasons.push(`Crisis language: ${phrases.map((p) => `"${p}"`).join(", ")}`);
  if (modelRiskLevel !== undefined && modelRiskLevel >= 7) {
    reasons.push(`AI risk assessment rated ${modelRiskLevel}/10`);
  }
  return reasons;
}

export function flushCrisisAlerts() {
  return Promise.allSettled([...inFlight]);
}

const yesNo = (value) => (value ? "Yes" : "No");

function formatSupport(support) {
  if (!support || typeof support !== "object") return null;
  const people = ["partner", "family", "friends"].filter((key) => support[key]);
  if (support.other) people.push(support.other);
  return people.length ? people.join(", ") : "None reported";
}

/** Everything useful to a helpline worker, skipping fields we don't hold. */
/** Rows for contact details she shared in the conversation, shown first in the email. */
function sharedContactRows({ sharedAddress, sharedPhone }) {
  return [
    ["Address she shared", sharedAddress],
    ["Phone number she shared", sharedPhone],
  ].filter(([, value]) => value);
}

async function patientDetails(user) {
  const [profile, latestTest] = await Promise.all([
    env.databaseUrl
      ? getDb()
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, user.email))
          .then(([row]) => row ?? null)
          .catch(() => null)
      : null,
    Test.findOne({ userId: user._id }).sort({ timestamp: -1 }).lean(),
  ]);

  const rows = [
    ["Name", user.name],
    ["Email", user.email],
    ["Phone", user.phone],
    ["Age", profile?.age ?? user.age],
    ["Country", user.country],
    ["Preferred language", LANGUAGE_NAMES[user.preferredLanguage] ?? user.preferredLanguage],
    ["Account created", user.createdAt?.toISOString?.().slice(0, 10)],
  ];
  if (profile) {
    rows.push(
      ["Currently pregnant", yesNo(profile.isPregnant)],
      ["Weeks since birth", profile.postpartumWeeks],
      ["Number of children", profile.numberOfChildren],
      ["Type of delivery", profile.deliveryType],
      ["Support network", formatSupport(profile.supportSystem)],
      ["History of mental health conditions", yesNo(profile.hasMentalHealthHistory)],
    );
  }
  if (latestTest) {
    rows.push([
      "Latest EPDS score",
      `${latestTest.score}/30 (${latestTest.level ?? "n/a"}) on ${latestTest.timestamp.toISOString().slice(0, 10)}`,
    ]);
  }
  return rows.filter(([, value]) => value !== undefined && value !== null && value !== "");
}

export function buildEmail({ reference, source, reasons, riskLevel, excerpt, sessionId, when, details, shared = [] }) {
  const table = (rows) =>
    rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:6px 12px 6px 0;color:#5c5878;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#161433;font-weight:600;">${escapeHtml(value)}</td></tr>`,
      )
      .join("");

  const eventRows = [
    ["Detected in", SOURCE_LABELS[source]],
    ["Time (UTC)", when.toISOString().replace("T", " ").slice(0, 16)],
    ["Why it was flagged", reasons.join("; ")],
    ["AI risk rating", riskLevel !== undefined ? `${riskLevel}/10` : undefined],
    ["Session reference", sessionId],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px 12px;background:#f8f7fc;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
<div style="max-width:640px;margin:auto;background:#fff;border:1px solid #e6e3f1;border-radius:16px;overflow:hidden;">
  <div style="background:#b3261e;color:#fff;padding:18px 24px;">
    <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.85;">Urgent · Confidential</div>
    <div style="font-size:20px;font-weight:700;margin-top:4px;">MumWell crisis alert ${escapeHtml(reference)}</div>
  </div>
  <div style="padding:24px;font-size:14px;line-height:1.6;color:#3d3a5c;">
    <p style="margin:0 0 16px;">A MumWell user has shown signs of a possible crisis (suicidal thoughts, self-harm or risk to her baby). Please follow your helpline's crisis protocol and contact her as soon as possible.</p>
    <h2 style="font-size:15px;margin:20px 0 8px;color:#161433;">What happened</h2>
    <table style="border-collapse:collapse;">${table(eventRows)}</table>
    ${excerpt ? `<h2 style="font-size:15px;margin:20px 0 8px;color:#161433;">What she wrote or said</h2><blockquote style="margin:0;padding:12px 16px;background:#fdecf2;border-left:4px solid #c23a6b;border-radius:8px;white-space:pre-wrap;color:#161433;">${escapeHtml(excerpt)}</blockquote>` : ""}
    ${shared.length ? `<h2 style="font-size:15px;margin:20px 0 8px;color:#b3261e;">Where she is</h2><table style="border-collapse:collapse;">${table(shared)}</table>` : ""}
    <h2 style="font-size:15px;margin:20px 0 8px;color:#161433;">Patient details</h2>
    <table style="border-collapse:collapse;">${table(details)}</table>
    <p style="margin:24px 0 0;font-size:12px;color:#5c5878;">Automated message from MumWell. It contains special-category health data: do not forward it outside the helpline team, and delete it once the case is recorded in your own system. MumWell showed her the local emergency and helpline numbers at the same moment.</p>
  </div>
</div></body></html>`;

  const text = [
    `URGENT: MumWell crisis alert ${reference}`,
    "",
    "A MumWell user has shown signs of a possible crisis. Please follow your crisis protocol and contact her as soon as possible.",
    "",
    ...eventRows.map(([label, value]) => `${label}: ${value}`),
    ...(excerpt ? ["", "What she wrote or said:", excerpt] : []),
    ...(shared.length ? ["", "Where she is:", ...shared.map(([label, value]) => `${label}: ${value}`)] : []),
    "",
    "Patient details:",
    ...details.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  return { html, text };
}

async function send({ user, source, reasons, riskLevel, excerpt, sessionId, contact = {} }) {
  const to = env.crisisAlert.email;
  const reference = `MW-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const when = new Date();
  const sharedAddress = contact.address || undefined;
  const sharedPhone = contact.phone ? tidyPhone(contact.phone, user.country) : undefined;
  const record = {
    userId: user._id,
    reference,
    source,
    reasons,
    riskLevel,
    excerpt,
    sessionId,
    sharedAddress,
    sharedPhone,
    contactSharedAt: sharedAddress || sharedPhone ? when : undefined,
  };

  let emailStatus;
  if (!to) {
    emailStatus = "disabled";
  } else if (!isMailConfigured()) {
    emailStatus = "not_configured";
  } else {
    const since = new Date(when.getTime() - env.crisisAlert.cooldownMinutes * 60 * 1000);
    const recent = await CrisisAlert.exists({ userId: user._id, emailStatus: "sent", createdAt: { $gte: since } });
    emailStatus = recent ? "suppressed" : "pending";
  }

  if (emailStatus === "pending") {
    try {
      const details = await patientDetails(user);
      const shared = sharedContactRows({ sharedAddress, sharedPhone });
      const { html, text } = buildEmail({ reference, source, reasons, riskLevel, excerpt, sessionId, when, details, shared });
      // The name stays out of the subject line, which is often shown in notifications.
      await sendMail({ to, subject: `URGENT: MumWell crisis alert ${reference}`, html, text });
      emailStatus = "sent";
    } catch (err) {
      emailStatus = "failed";
      logger.error("Crisis alert email FAILED", { reference, error: err.message });
    }
  }

  await CrisisAlert.create({ ...record, emailStatus, emailedTo: emailStatus === "sent" ? to : undefined });

  const log = emailStatus === "sent" || emailStatus === "suppressed" ? logger.warn : logger.error;
  log.call(logger, "Crisis alert recorded", { reference, userId: String(user._id), source, emailStatus });
}

/**
 * Escalate a crisis to the helpline inbox. Never throws and never delays the user's response:
 * the reply showing emergency numbers goes out immediately while the email is sent alongside.
 */
export function raiseCrisisAlert({ user, source, reasons = [], riskLevel, excerpt, sessionId, contact }) {
  const task = send({
    user,
    source,
    reasons,
    riskLevel,
    excerpt: excerpt ? String(excerpt).slice(0, 2000) : undefined,
    sessionId,
    contact,
  })
    .catch((err) => logger.error("Crisis alert could not be recorded", { error: err.message }))
    .finally(() => {
      inFlight.delete(task);
      raising.delete(task);
    });
  inFlight.add(task);
  raising.add(task);
  return task;
}

const track = (promise) => {
  const task = promise
    .catch((err) => logger.error("Crisis contact update failed", { error: err.message }))
    .finally(() => inFlight.delete(task));
  inFlight.add(task);
  return task;
};

/** The alert already raised for this chat or consultation, if any. */
export async function findSessionAlert(userId, sessionId) {
  await Promise.allSettled([...raising]); // an alert raised a moment ago may still be saving
  // Prefer the alert the helpline actually received, so updates quote a reference they know.
  return (
    (await CrisisAlert.findOne({ userId, sessionId, emailStatus: "sent" }).sort({ createdAt: -1 })) ??
    CrisisAlert.findOne({ userId, sessionId }).sort({ createdAt: -1 })
  );
}

function buildUpdateEmail({ alert, shared, user }) {
  const rows = shared
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#5c5878;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#161433;font-weight:700;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px 12px;background:#f8f7fc;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
<div style="max-width:640px;margin:auto;background:#fff;border:1px solid #e6e3f1;border-radius:16px;overflow:hidden;">
  <div style="background:#b3261e;color:#fff;padding:18px 24px;">
    <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.85;">Urgent update · Confidential</div>
    <div style="font-size:20px;font-weight:700;margin-top:4px;">Crisis alert ${escapeHtml(alert.reference)}: contact details shared</div>
  </div>
  <div style="padding:24px;font-size:14px;line-height:1.6;color:#3d3a5c;">
    <p style="margin:0 0 16px;">After alert <strong>${escapeHtml(alert.reference)}</strong>, ${escapeHtml(user.name)} (${escapeHtml(user.email)}) chose to share the following in the conversation:</p>
    <table style="border-collapse:collapse;">${rows}</table>
    <p style="margin:24px 0 0;font-size:12px;color:#5c5878;">She typed or said this herself; it has not been verified. Handle as special-category health data.</p>
  </div>
</div></body></html>`;
  const text = [
    `URGENT UPDATE: crisis alert ${alert.reference}, contact details shared`,
    "",
    `After alert ${alert.reference}, ${user.name} (${user.email}) chose to share:`,
    ...shared.map(([label, value]) => `${label}: ${value}`),
    "",
    "She typed or said this herself; it has not been verified.",
  ].join("\n");
  return { html, text };
}

async function saveSharedContact({ user, sessionId, address, phone }) {
  const alert = await findSessionAlert(user._id, sessionId);
  if (!alert) return; // details are only collected once a crisis has been raised

  const newAddress = address && address !== alert.sharedAddress ? address.slice(0, 300) : undefined;
  const newPhone = phone ? tidyPhone(phone, user.country) : undefined;
  const phoneChanged = newPhone && newPhone !== alert.sharedPhone ? newPhone : undefined;
  if (!newAddress && !phoneChanged) return;

  if (newAddress) alert.sharedAddress = newAddress;
  if (phoneChanged) alert.sharedPhone = phoneChanged;
  alert.contactSharedAt = new Date();

  const to = env.crisisAlert.email;
  if (to && isMailConfigured()) {
    try {
      const shared = sharedContactRows({ sharedAddress: newAddress, sharedPhone: phoneChanged });
      const { html, text } = buildUpdateEmail({ alert, shared, user });
      // Updates are never held back by the cooldown: this is the information the team needs most.
      await sendMail({ to, subject: `URGENT UPDATE: MumWell crisis alert ${alert.reference}`, html, text });
      alert.updateEmailStatus = "sent";
    } catch (err) {
      alert.updateEmailStatus = "failed";
      logger.error("Crisis contact update email FAILED", { reference: alert.reference, error: err.message });
    }
  } else {
    alert.updateEmailStatus = "not_sent";
  }
  await alert.save();
  logger.warn("Crisis contact details recorded", { reference: alert.reference, emailStatus: alert.updateEmailStatus });
}

/**
 * Record an address or phone number she chose to share after a crisis alert in the same
 * chat or consultation, and send it to the helpline as an update to that alert.
 */
export function recordSharedContact({ user, sessionId, address, phone }) {
  if (!address && !phone) return Promise.resolve();
  return track(saveSharedContact({ user, sessionId, address, phone }));
}
