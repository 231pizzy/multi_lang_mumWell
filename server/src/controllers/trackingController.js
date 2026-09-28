import { Activity, ACTIVITY_TYPES } from "../models/Activity.js";
import { Mood } from "../models/Mood.js";
import { Test } from "../models/Test.js";
import { badRequest } from "../utils/httpError.js";
import { daysAgo } from "../utils/dates.js";
import { optionalString, requireNumber, requireString } from "../utils/validate.js";
import { crisisMatches } from "../services/safety.js";
import { describeSignals, raiseCrisisAlert } from "../services/crisisAlert.js";

const clampDays = (value, fallback, max = 365) =>
  Math.min(max, Math.max(1, Number.parseInt(value, 10) || fallback));

// ---------- Mood ----------

// EPDS question 10: "The thought of harming myself has occurred to me".
const SELF_HARM_ITEM = 9;
const SELF_HARM_ANSWERS = ["Never", "Hardly ever", "Sometimes", "Yes, quite often"];

export async function createMood(req, res) {
  const score = requireNumber(req.body?.score, "Mood score", { min: 0, max: 100 });
  const note = optionalString(req.body?.note, "Note", { max: 1000 });
  const mood = await Mood.create({ userId: req.user._id, score, note, timestamp: new Date() });
  const phrases = crisisMatches(note);
  if (phrases.length) {
    raiseCrisisAlert({ user: req.user, source: "mood", reasons: describeSignals({ phrases }), excerpt: note });
  }
  res.status(201).json({ success: true, data: mood });
}

// Latest mood check-in (null if none yet).
export async function getLatestMood(req, res) {
  const mood = await Mood.findOne({ userId: req.user._id }).sort({ timestamp: -1 }).lean();
  res.json({
    success: true,
    data: mood ? { score: mood.score, note: mood.note, timestamp: mood.timestamp } : null,
  });
}

export async function getMoodHistory(req, res) {
  const days = clampDays(req.query.days, 30);
  const moods = await Mood.find({ userId: req.user._id, timestamp: { $gte: daysAgo(days) } })
    .sort({ timestamp: 1 })
    .lean();
  res.json({ success: true, data: moods });
}

// ---------- EPDS test ----------

function epdsLevel(score) {
  if (score <= 9) return "Low Risk";
  if (score <= 12) return "Mild Risk";
  return "High Risk";
}

export async function createTest(req, res) {
  const score = requireNumber(req.body?.score, "Test score", { min: 0, max: 30, integer: true });

  let answers;
  if (req.body?.answers !== undefined) {
    const list = req.body.answers;
    if (!Array.isArray(list) || list.length !== 10 || list.some((a) => ![0, 1, 2, 3].includes(a))) {
      throw badRequest("validation.invalid", { field: "answers" });
    }
    if (list.reduce((a, b) => a + b, 0) !== score) {
      throw badRequest("validation.invalid", { field: "answers" });
    }
    answers = list;
  }

  const test = await Test.create({
    userId: req.user._id,
    score,
    // Level is derived on the server so stored results are always consistent.
    level: epdsLevel(score),
    message: optionalString(req.body?.message, "Message", { max: 1000 }),
    answers,
    timestamp: new Date(),
  });
  if (answers?.[SELF_HARM_ITEM] > 0) {
    raiseCrisisAlert({
      user: req.user,
      source: "screening",
      reasons: [
        `EPDS question 10 (thoughts of self-harm) answered "${SELF_HARM_ANSWERS[answers[SELF_HARM_ITEM]]}"`,
      ],
      excerpt: `EPDS total score ${score}/30 (${test.level}).`,
    });
  }
  res.status(201).json({ success: true, message: "Test result saved", data: test });
}

// Latest EPDS result (null if the user hasn't taken the test).
export async function getLatestTest(req, res) {
  const test = await Test.findOne({ userId: req.user._id }).sort({ timestamp: -1 }).lean();
  res.json({
    success: true,
    data: test
      ? { score: test.score, level: test.level, message: test.message, timestamp: test.timestamp }
      : null,
  });
}

export async function getTestHistory(req, res) {
  const tests = await Test.find({ userId: req.user._id })
    .sort({ timestamp: -1 })
    .limit(50)
    .select("score level timestamp")
    .lean();
  res.json({ success: true, data: tests });
}

// ---------- Activities ----------

export async function logActivity(req, res) {
  const type = requireString(req.body?.type, "Activity type", { max: 30 });
  if (!ACTIVITY_TYPES.includes(type)) {
    throw badRequest("validation.invalid", { field: "type" });
  }
  const duration =
    req.body?.duration === undefined || req.body?.duration === ""
      ? undefined
      : requireNumber(req.body.duration, "Duration", { min: 0, max: 24 * 60 });

  const activity = await Activity.create({
    userId: req.user._id,
    type,
    name: requireString(req.body?.name, "Name", { max: 200 }),
    description: optionalString(req.body?.description, "Description", { max: 1000 }),
    duration,
    timestamp: new Date(),
  });
  res.status(201).json({ success: true, data: activity });
}

export async function listActivities(req, res) {
  const days = clampDays(req.query.days, 28);
  const activities = await Activity.find({
    userId: req.user._id,
    timestamp: { $gte: daysAgo(days) },
  })
    .sort({ timestamp: -1 })
    .limit(500)
    .lean();
  res.json({ success: true, data: activities });
}
