import "./setup-env.js";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import moment from "moment-timezone";
import { parseJsonResponse } from "../src/services/llm.js";
import { mentionsCrisis } from "../src/services/safety.js";
import { dueReminder } from "../src/services/reminders.js";
import { parseAcceptLanguage, t } from "../src/i18n/index.js";
import { messages } from "../src/i18n/messages.js";

describe("parseJsonResponse", () => {
  test("parses plain, fenced and prose-wrapped JSON", () => {
    assert.deepEqual(parseJsonResponse('{"a":1}'), { a: 1 });
    assert.deepEqual(parseJsonResponse('```json\n{"a":1}\n```'), { a: 1 });
    assert.deepEqual(parseJsonResponse('Sure! Here it is: {"a":{"b":2}} Hope that helps'), { a: { b: 2 } });
  });

  test("throws when there is no JSON", () => {
    assert.throws(() => parseJsonResponse("no json here"));
  });
});

describe("mentionsCrisis", () => {
  test("detects explicit crisis statements", () => {
    for (const text of [
      "I want to die",
      "I've been thinking about suicide",
      "sometimes I think about hurting myself",
      "they'd be better off without me",
      "I'm scared I might hurt my baby",
    ]) {
      assert.equal(mentionsCrisis(text), true, text);
    }
  });

  test("detects crisis statements in Swedish, German, French and Spanish", () => {
    for (const text of [
      "Jag vill inte leva längre",
      "Ich will nicht mehr leben",
      "Ich habe an Selbstmord gedacht",
      "Parfois je veux mourir",
      "J'ai envie d'en finir",
      "No quiero vivir así",
      "He pensado en hacerme daño",
    ]) {
      assert.equal(mentionsCrisis(text), true, text);
    }
  });

  test("ignores ordinary distress", () => {
    for (const text of [
      "I'm exhausted",
      "the baby won't sleep",
      "I feel sad today",
      "Jag är så trött",
      "Ich bin total erschöpft",
      "Je suis fatiguée",
      "Estoy muy cansada",
    ]) {
      assert.equal(mentionsCrisis(text), false, text);
    }
  });
});

describe("dueReminder", () => {
  const user = (notificationTime, lastNotificationSent = null) => ({ notificationTime, lastNotificationSent });
  const at = (iso) => moment.utc(iso);

  test("sends each reminder at its time", () => {
    assert.equal(dueReminder(user("09:00:00"), at("2026-01-10T08:00:00Z"))?.label, "60-min-before");
    assert.equal(dueReminder(user("09:00:00"), at("2026-01-10T08:30:00Z"))?.label, "30-min-before");
    assert.equal(dueReminder(user("09:00:00"), at("2026-01-10T08:50:00Z"))?.label, "10-min-before");
    assert.equal(dueReminder(user("09:00:00"), at("2026-01-10T08:15:00Z")), null);
  });

  test("still sends when the scheduler tick is a few minutes late", () => {
    assert.equal(dueReminder(user("09:00:00"), at("2026-01-10T08:03:00Z"))?.label, "60-min-before");
    assert.equal(dueReminder(user("09:00:00"), at("2026-01-10T08:06:00Z")), null);
  });

  test("does not send twice", () => {
    const sent = "2026-01-10T08:00:30Z";
    assert.equal(dueReminder(user("09:00:00", sent), at("2026-01-10T08:02:00Z")), null);
    // but the next reminder still goes out
    assert.equal(dueReminder(user("09:00:00", sent), at("2026-01-10T08:30:00Z"))?.label, "30-min-before");
  });

  test("handles reminders that fall on the previous UTC day", () => {
    // Check-in at 00:30 UTC → the 1-hour reminder is at 23:30 the day before.
    assert.equal(dueReminder(user("00:30:00"), at("2026-01-10T23:30:00Z"))?.label, "60-min-before");
    assert.equal(dueReminder(user("00:30:00"), at("2026-01-11T00:20:00Z"))?.label, "10-min-before");
  });
});

describe("i18n", () => {
  test("parses Accept-Language headers", () => {
    assert.equal(parseAcceptLanguage("de-AT,de;q=0.9,en;q=0.8"), "de");
    assert.equal(parseAcceptLanguage("pl,fr;q=0.5"), "fr");
    assert.equal(parseAcceptLanguage("pl,it"), null);
    assert.equal(parseAcceptLanguage(undefined), null);
  });

  test("every message exists in all five languages", () => {
    const keys = Object.keys(messages.en);
    for (const lang of ["sv", "de", "fr", "es"]) {
      const missing = keys.filter((k) => !messages[lang][k]);
      assert.deepEqual(missing, [], `${lang} is missing ${missing.join(", ")}`);
    }
  });

  test("interpolates parameters and falls back to English", () => {
    assert.equal(t("de", "auth.passwordTooShort", { min: 8 }), "Das Passwort muss mindestens 8 Zeichen lang sein.");
    assert.equal(t("xx", "auth.required"), messages.en["auth.required"]);
  });
});

describe("stripDashes", async () => {
  const { stripDashes } = await import("../src/utils/text.js");
  test("turns dash punctuation into commas", () => {
    assert.equal(stripDashes("You deserve support — you are not alone."), "You deserve support, you are not alone.");
    assert.equal(stripDashes("MumWell supports — never replaces — midwives."), "MumWell supports, never replaces, midwives.");
    assert.equal(stripDashes("Rest well–small steps count"), "Rest well, small steps count");
  });
  test("keeps number ranges and leaves no stray commas", () => {
    assert.equal(stripDashes("Days 1–30 focus on rest, in 2–3 short steps"), "Days 1–30 focus on rest, in 2–3 short steps");
    assert.equal(stripDashes("It happens — ."), "It happens.");
  });
});
