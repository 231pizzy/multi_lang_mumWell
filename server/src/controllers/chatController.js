import crypto from "node:crypto";
import { env } from "../config/env.js";
import { ChatSession } from "../models/ChatSession.js";
import { generateTherapistReply } from "../services/therapist.js";
import { notFound } from "../utils/httpError.js";
import { requireString } from "../utils/validate.js";
import { logger } from "../utils/logger.js";
import { describeSignals, raiseCrisisAlert, recordSharedContact } from "../services/crisisAlert.js";
import { requestLanguage } from "../i18n/index.js";

const MAX_MESSAGE_LENGTH = 4000;

const expiryDate = () =>
  env.chatSessionTtlHours > 0
    ? new Date(Date.now() + env.chatSessionTtlHours * 60 * 60 * 1000)
    : undefined;

async function findOwnSession(req) {
  const session = await ChatSession.findOne({
    sessionId: req.params.sessionId,
    userId: req.user._id,
  });
  // Same 404 whether the session doesn't exist or belongs to someone else.
  if (!session) throw notFound("chat.notFound");
  return session;
}

const toSummary = (session) => ({
  sessionId: session.sessionId,
  status: session.status,
  startTime: session.startTime,
  updatedAt: session.updatedAt ?? session.startTime,
  expiresAt: session.expiresAt,
  messages: session.messages,
});

export async function createSession(req, res) {
  const session = await ChatSession.create({
    sessionId: crypto.randomUUID(),
    userId: req.user._id,
    startTime: new Date(),
    expiresAt: expiryDate(),
    messages: [],
  });
  res.status(201).json({ message: "Chat session created", sessionId: session.sessionId });
}

export async function listSessions(req, res) {
  const sessions = await ChatSession.find({ userId: req.user._id })
    .sort({ updatedAt: -1, startTime: -1 })
    .lean();
  res.json(sessions.map(toSummary));
}

export async function getSession(req, res) {
  res.json(toSummary(await findOwnSession(req)));
}

export async function getHistory(req, res) {
  const session = await findOwnSession(req);
  res.json(session.messages);
}

export async function sendMessage(req, res) {
  const message = requireString(req.body?.message, "Message", { max: MAX_MESSAGE_LENGTH });
  const session = await findOwnSession(req);

  const memory = session.memory ?? {};
  const crisisState = {
    active: Boolean(memory.crisis?.flaggedAt),
    contactAsked: Boolean(memory.crisis?.contactAsked),
    addressShared: Boolean(memory.crisis?.addressShared),
  };

  const { reply, analysis, crisis, crisisSignals } = await generateTherapistReply({
    message,
    history: session.messages,
    memory: {
      conversationThemes: memory.sessionContext?.conversationThemes ?? [],
      recentEmotionalStates: memory.userProfile?.emotionalState ?? [],
    },
    userName: req.user.name,
    language: requestLanguage(req),
    crisisState,
    phoneOnFile: Boolean(req.user.phone),
  });

  // Update session memory used for continuity in later replies.
  const themes = new Set([...(memory.sessionContext?.conversationThemes ?? []), ...analysis.themes]);
  session.set("memory.sessionContext.conversationThemes", [...themes].slice(-20));
  session.set(
    "memory.userProfile.emotionalState",
    [...(memory.userProfile?.emotionalState ?? []), analysis.emotionalState].slice(-5),
  );
  session.set("memory.userProfile.riskLevel", analysis.riskLevel);
  if (crisis && !memory.crisis?.flaggedAt) {
    session.set("memory.crisis.flaggedAt", new Date());
    // The crisis reply is where the AI is told to ask for contact details, once.
    session.set("memory.crisis.contactAsked", true);
  }
  if ((crisis || memory.crisis?.flaggedAt) && analysis.sharedAddress) {
    session.set("memory.crisis.addressShared", true);
  }

  const now = new Date();
  session.messages.push({ role: "user", content: message, timestamp: now });
  session.messages.push({
    role: "assistant",
    content: reply,
    timestamp: new Date(),
    metadata: {
      analysis,
      progress: { emotionalState: analysis.emotionalState, riskLevel: analysis.riskLevel },
      crisis,
    },
  });
  session.updatedAt = now;
  // Active conversations stay available for the full TTL after the latest message.
  if (session.expiresAt) session.expiresAt = expiryDate();
  await session.save();

  // Contact details only count once a crisis is in play; otherwise they're not collected.
  const inCrisis = crisis || crisisState.active;
  const contact = inCrisis ? { address: analysis.sharedAddress, phone: analysis.sharedPhone } : {};

  if (crisis && !crisisState.active) {
    // First crisis in this conversation: escalate to the helpline. The reply below is not
    // held up by the email.
    raiseCrisisAlert({
      user: req.user,
      source: "chat",
      reasons: describeSignals(crisisSignals),
      riskLevel: analysis.riskLevel,
      excerpt: message,
      sessionId: session.sessionId,
      contact,
    });
  } else if (inCrisis) {
    if (crisis) {
      // Further crisis messages in the same conversation are recorded against the helpline's
      // cooldown rather than starting a new case.
      raiseCrisisAlert({
        user: req.user,
        source: "chat",
        reasons: describeSignals(crisisSignals),
        riskLevel: analysis.riskLevel,
        excerpt: message,
        sessionId: session.sessionId,
      });
    }
    recordSharedContact({ user: req.user, sessionId: session.sessionId, ...contact });
  }

  res.json({
    response: reply,
    message: reply,
    analysis,
    crisis,
    metadata: {
      progress: { emotionalState: analysis.emotionalState, riskLevel: analysis.riskLevel },
    },
  });
}
