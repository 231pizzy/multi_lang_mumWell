import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter, authLimiter, transcriptLimiter } from "../middleware/rateLimit.js";
import * as auth from "../controllers/authController.js";
import * as account from "../controllers/accountController.js";
import * as chat from "../controllers/chatController.js";
import * as tracking from "../controllers/trackingController.js";
import * as program from "../controllers/programController.js";
import * as consultations from "../controllers/consultationController.js";
import * as notifications from "../controllers/notificationController.js";
import { activeProvider } from "../services/llm.js";
import { env } from "../config/env.js";

export const api = Router();

api.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    ai: activeProvider() ?? "not configured",
    programDatabase: env.databaseUrl ? "configured" : "not configured",
  });
});

// ---------- Auth ----------
api.post("/auth/register", authLimiter, auth.register);
api.post("/auth/login", authLimiter, auth.login);
api.post("/auth/forgot-password", authLimiter, auth.forgotPassword);
api.post("/auth/reset-password", authLimiter, auth.resetPassword);
api.post("/auth/logout", requireAuth, auth.logout);
api.get("/auth/me", requireAuth, auth.me);

// Reminder trigger for external schedulers (authenticated by CRON_SECRET, not a user token).
api.post("/notifications/run", notifications.runNow);

// Everything below requires a signed-in user.
api.use(requireAuth);

// ---------- Account & GDPR rights ----------
api.patch("/account", account.updateAccount);
api.post("/account/consents", account.acceptConsents);
api.put("/account/password", authLimiter, account.changePassword);
api.get("/account/export", account.exportData);
api.delete("/account", authLimiter, account.deleteAccount);

// ---------- AI therapist chat ----------
api.post("/chat/sessions", chat.createSession);
api.get("/chat/sessions", chat.listSessions);
api.get("/chat/sessions/:sessionId", chat.getSession);
api.get("/chat/sessions/:sessionId/history", chat.getHistory);
api.post("/chat/sessions/:sessionId/messages", aiLimiter, chat.sendMessage);

// ---------- Mood, EPDS test, activities ----------
api.post("/mood", tracking.createMood);
api.get("/mood", tracking.getLatestMood);
api.get("/mood/history", tracking.getMoodHistory);

api.post("/test", tracking.createTest);
api.get("/test", tracking.getLatestTest);
api.get("/test/history", tracking.getTestHistory);

api.post("/activity", tracking.logActivity);
api.get("/activity", tracking.listActivities);

// ---------- 90-day program & wellness check-ins ----------
api.get("/program", program.getProgram);
api.post("/program", aiLimiter, program.createProgram);
api.put("/program/day", program.completeDay);

api.get("/wellness", program.getWellness);
api.post("/wellness", program.saveWellness);

// ---------- Voice consultations ----------
api.get("/consultations/doctors", consultations.listDoctors);
api.post("/consultations/suggest", aiLimiter, consultations.suggest);
api.get("/consultations", consultations.listConsultations);
api.post("/consultations", consultations.createConsultation);
api.get("/consultations/:sessionId", consultations.getConsultation);
api.post("/consultations/:sessionId/utterances", transcriptLimiter, consultations.checkUtterance);
api.post("/consultations/:sessionId/report", aiLimiter, consultations.createReport);

// ---------- Reminder settings ----------
api.get("/notifications", notifications.getSettings);
api.put("/notifications", notifications.updateSettings);
