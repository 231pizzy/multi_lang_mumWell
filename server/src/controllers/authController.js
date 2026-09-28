import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { badRequest, HttpError, unauthorized } from "../utils/httpError.js";
import { isValidEmail } from "../utils/validate.js";
import { emailTemplate, escapeHtml, isMailConfigured, sendMail } from "../services/mailer.js";
import { isSupportedLanguage, requestLanguage, t } from "../i18n/index.js";
import { logger } from "../utils/logger.js";
import { requireCountry, requirePhone } from "../utils/contact.js";

export const MIN_PASSWORD_LENGTH = 8;
// Bump when the terms/privacy text or consent wording changes materially.
// Bump when consent wording changes; users are then asked to confirm again.
// Keep in step with CONSENT_VERSION in client/src/lib/consents.js.
export const CONSENT_VERSION = "2026-09-27"; // added crisis-helpline escalation
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Used when the email isn't registered so login timing doesn't reveal which accounts exist.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("not-a-real-password", 12);

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, "auth.passwordTooShort", undefined, { min: MIN_PASSWORD_LENGTH });
  }
  if (password.length > 128) throw badRequest("auth.passwordTooLong");
  return password;
}

/** Consent record for the three separate consents given at sign-up (or later via the gate). */
export function consentRecord(body) {
  if (body?.acceptTerms !== true || body?.healthDataConsent !== true || body?.ageConfirmed !== true) {
    throw badRequest("auth.consentRequired");
  }
  const now = new Date();
  return {
    terms: { version: CONSENT_VERSION, acceptedAt: now },
    healthData: { version: CONSENT_VERSION, acceptedAt: now },
    ageConfirmedAt: now,
  };
}

async function startSession(user, req) {
  const token = jwt.sign({ userId: user._id.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
  const { exp } = jwt.decode(token);
  await Session.create({
    userId: user._id,
    token,
    expiresAt: new Date(exp * 1000),
    deviceInfo: req.get("user-agent")?.slice(0, 300),
  });
  return token;
}

export async function register(req, res) {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name || name.length > 100) throw badRequest("auth.nameRequired");
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email) || email.length > 254) throw badRequest("auth.invalidEmail");
  const password = validatePassword(req.body?.password);
  // Country and phone let the crisis helpline reach her if she is ever in danger.
  const country = requireCountry(req.body?.country);
  const phone = requirePhone(req.body?.phone, country);
  const consents = consentRecord(req.body);
  const preferredLanguage = isSupportedLanguage(req.body?.preferredLanguage)
    ? req.body.preferredLanguage
    : requestLanguage(req);

  if (await User.exists({ email })) throw new HttpError(409, "auth.emailInUse");

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    phone,
    country,
    preferredLanguage,
    consents,
  });
  const token = await startSession(user, req);
  res.status(201).json({ message: "Account created", user, token });
}

export async function login(req, res) {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!email || !password) throw badRequest("auth.credentialsRequired");

  const user = await User.findOne({ email });
  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
  if (!user || !valid) throw unauthorized("auth.invalidCredentials");

  const token = await startSession(user, req);
  res.json({ message: "Login successful", user, token });
}

export async function logout(req, res) {
  await Session.deleteOne({ token: req.token });
  res.json({ message: "Logged out" });
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function forgotPassword(req, res) {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) throw badRequest("auth.invalidEmail");
  if (!isMailConfigured()) throw new HttpError(503, "auth.resetUnavailable");

  // Always respond the same way so this endpoint can't be used to discover accounts.
  const response = { message: t(requestLanguage(req), "auth.resetSent") };

  const user = await User.findOne({ email });
  if (!user) return res.json(response);

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = hashToken(rawToken);
  user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  const lang = user.preferredLanguage || requestLanguage(req);
  const resetUrl = `${env.clientUrls[0]}/reset-password?token=${rawToken}`;
  try {
    await sendMail({
      to: user.email,
      subject: t(lang, "email.reset.subject"),
      html: emailTemplate(
        `
        <h1 style="font-size:20px;color:#161433;text-align:center;">${t(lang, "email.reset.heading")}</h1>
        <p>${t(lang, "email.reset.greeting", { name: escapeHtml(user.name) })}</p>
        <p>${t(lang, "email.reset.body")}</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${resetUrl}" style="background:#2a2170;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">${t(lang, "email.reset.button")}</a>
        </p>
        <p>${t(lang, "email.reset.ignore")}</p>`,
        lang,
      ),
      text: `${t(lang, "email.reset.subject")}: ${resetUrl}`,
    });
  } catch (err) {
    logger.error("Failed to send password reset email", { error: err.message });
    throw new HttpError(502, "auth.resetEmailFailed");
  }

  res.json(response);
}

export async function resetPassword(req, res) {
  const token = typeof req.body?.token === "string" ? req.body.token.slice(0, 200) : "";
  if (!token) throw badRequest("auth.resetInvalid");
  const password = validatePassword(req.body?.password);

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) throw badRequest("auth.resetInvalid");

  user.password = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  // Sign out everywhere after a password change.
  await Session.deleteMany({ userId: user._id });

  res.json({ message: t(user.preferredLanguage || requestLanguage(req), "auth.resetDone") });
}
