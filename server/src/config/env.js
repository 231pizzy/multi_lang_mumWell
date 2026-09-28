import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load server/.env regardless of the directory the process was started from.
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const bool = (value, fallback = false) => {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const int = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const list = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: int(process.env.PORT, 5100),

  // Comma-separated list of origins allowed to call the API.
  clientUrls: list(process.env.CLIENT_URL || "http://localhost:3000"),
  // Serve client/dist from this server (single-host deployments).
  serveClient: bool(process.env.SERVE_CLIENT, false),

  mongoUri: process.env.MONGODB_URI,
  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // AI provider. Leave LLM_PROVIDER empty to auto-select whichever key is set.
  llmProvider: (process.env.LLM_PROVIDER || "").toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY,
  openRouterModel: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",

  // Hours before an AI chat session is deleted. 0 keeps sessions forever.
  chatSessionTtlHours: int(process.env.CHAT_SESSION_TTL_HOURS, 24),

  // Crisis escalation: when a user shows signs of crisis, email this address (e.g. a helpline
  // inbox) with her details. Leave empty to disable. Repeat alerts for the same user within
  // the cooldown are recorded but not emailed again.
  crisisAlert: {
    email: (process.env.CRISIS_ALERT_EMAIL || "").trim(),
    cooldownMinutes: int(process.env.CRISIS_ALERT_COOLDOWN_MINUTES, 30),
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: int(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    rejectUnauthorized: bool(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
  },

  enableReminderCron: bool(process.env.ENABLE_REMINDER_CRON, false),
  cronSecret: process.env.CRON_SECRET,
};

export function assertRequiredEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (env.isProduction && env.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
}
