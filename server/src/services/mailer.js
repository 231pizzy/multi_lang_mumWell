import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { t } from "../i18n/index.js";

let transporter;
let mailOverride = null;

export function isMailConfigured() {
  if (mailOverride) return true;
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function getTransporter() {
  if (!isMailConfigured()) {
    throw new HttpError(503, "Email is not configured on the server.");
  }
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    tls: { rejectUnauthorized: env.smtp.rejectUnauthorized },
  });
  return transporter;
}

/** Tests only: capture outgoing mail with fn(message) instead of sending it. */
export function setMailOverride(fn) {
  mailOverride = fn;
}

export async function sendMail({ to, subject, html, text }) {
  if (mailOverride) return mailOverride({ to, subject, html, text });
  await getTransporter().sendMail({
    from: `"MumWell" <${env.smtp.from}>`,
    to,
    subject,
    html,
    text,
  });
}

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** Branded HTML email in the recipient's language. */
export function emailTemplate(contentHtml, lang = "en") {
  const logoUrl = `${env.clientUrls[0]}/email-logo.png`;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MumWell</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f8f7fc;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #e6e3f1;border-radius:16px;overflow:hidden;">
    <div style="height:4px;background:#b24ea3;background-image:linear-gradient(90deg,#43238f,#b24ea3,#f47a9c);"></div>
    <div style="background:#ffffff;padding:22px 28px 6px;">
      <img src="${logoUrl}" alt="MumWell" width="150" style="height:auto;display:block;" />
    </div>
    <div style="padding:28px;font-size:15px;line-height:1.65;color:#3d3a5c;">${contentHtml}</div>
    <div style="padding:18px 28px;border-top:1px solid #e6e3f1;text-align:center;font-size:12px;color:#5c5878;">
      ${t(lang, "email.footer")}<br />
      © ${new Date().getFullYear()} MumWell
    </div>
  </div>
</body>
</html>`;
}

export { escapeHtml };
