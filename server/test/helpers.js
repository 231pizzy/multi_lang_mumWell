import "./setup-env.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import request from "supertest";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { setDb } from "../src/config/postgres.js";
import { createApp } from "../src/app.js";
import { setLlmOverride } from "../src/services/llm.js";

// Mirrors src/db/schema.js.
const DDL = `
CREATE TABLE users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(255) NOT NULL,
  age integer NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  credits integer DEFAULT 0,
  "isPregnant" boolean DEFAULT false,
  "numberOfChildren" integer DEFAULT 0,
  "supportSystem" jsonb DEFAULT '{"partner":false,"family":false,"friends":false,"other":""}',
  "hasMentalHealthHistory" boolean DEFAULT false,
  "mentalHealthNotes" text,
  "deliveryType" varchar(120),
  "postpartumWeeks" integer,
  "epdsScore" integer,
  "wellnessHistory" jsonb DEFAULT '[]',
  "hasActiveProgram" boolean DEFAULT false,
  "programStartDate" timestamp,
  "programEndDate" timestamp,
  "programPlan" jsonb DEFAULT '[]',
  "counselingHistory" jsonb DEFAULT '[]',
  "notificationsEnabled" boolean DEFAULT true,
  "notificationTime" time DEFAULT '08:00:00',
  "lastNotificationSent" timestamp,
  timezone varchar(60) DEFAULT 'Australia/Melbourne',
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);
CREATE TABLE "sessionChatTable" (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "sessionId" varchar NOT NULL,
  notes text,
  "selectedDoctor" json,
  conversation json,
  report json,
  "createdBy" varchar NOT NULL,
  "createdOn" varchar
);`;

// Test conversations write addresses like "12 Storgatan, Uppsala" and numbers like "+46 70 123 45 67".
const ADDRESS = /\d+\s+\p{L}+(?:gatan|vägen|\s+(?:street|road|avenue))[^.\n]*/iu;
const PHONE = /\+?\d[\d\s-]{6,}\d/;
const found = (pattern, text) => text.match(pattern)?.[0].trim() ?? null;

/** Deterministic stand-in for the LLM, keyed off each feature's system prompt. */
export function fakeLlm({ system = "", prompt = "" }) {
  if (system.includes("contact-details extractor")) {
    const said = prompt
      .split("\n")
      .filter((line) => line.startsWith("Mother:"))
      .join("\n");
    return JSON.stringify({ address: found(ADDRESS, said), phone: found(PHONE, said) });
  }
  if (system.includes("MumWell Therapist")) {
    const latest = prompt.split("Mother:").pop().split("Return ONLY")[0];
    const worried = /die|hopeless/i.test(latest);
    const language = system.match(/Always write your reply in (\w+)/)?.[1] ?? "unknown";
    return JSON.stringify({
      reply: `Thank you for sharing that with me. How has your sleep been? [${language}]`,
      analysis: {
        emotionalState: worried ? "hopeless" : "tired",
        themes: ["sleep", "exhaustion"],
        riskLevel: 2, // deliberately low: the keyword backstop must still flag a crisis
        recommendedApproach: "validation",
        progressIndicators: ["opened up"],
        sharedAddress: found(ADDRESS, latest),
        sharedPhone: found(PHONE, latest),
      },
    });
  }
  if (system.includes("Program Generator")) {
    const [, start, end] = prompt.match(/days (\d+) to (\d+)/);
    const days = [];
    for (let day = Number(start); day <= Number(end); day++) {
      days.push({
        day,
        theme: `Theme ${day}`,
        welcomeMessage: `Welcome to day ${day}`,
        encouragementMessage: "You're doing great",
        objectives: ["Rest"],
        tasks: ["Drink water", "Take a short walk"],
        reflectionPrompt: "How did today feel?",
      });
    }
    // Wrapped in a code fence to exercise the tolerant JSON parser.
    return "```json\n" + JSON.stringify({ days }) + "\n```";
  }
  if (system.includes("doctor-recommendation")) {
    return JSON.stringify({ doctorIds: [7, 1, 999] });
  }
  if (system.includes("medical-report")) {
    return JSON.stringify({
      agent: "Mental Health Specialist",
      user: "Ada",
      chiefComplaint: "Low mood after birth",
      summary: "Discussed low mood.",
      symptoms: ["low mood"],
      duration: "2 weeks",
      severity: "moderate",
      medicationsMentioned: [],
      recommendations: ["Speak to your GP"],
    });
  }
  throw new Error(`Unexpected LLM call: ${system.slice(0, 60)}`);
}

export async function startTestServer() {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 120_000 } });
  await connectMongo(mongo.getUri());

  const pg = new PGlite();
  await pg.exec(DDL);
  setDb(drizzle({ client: pg }));

  setLlmOverride(async (args) => fakeLlm(args));

  const app = createApp();
  return {
    app,
    request: () => request(app),
    async stop() {
      setLlmOverride(null);
      await disconnectMongo();
      await mongo.stop();
      await pg.close();
    },
  };
}

let counter = 0;
export async function registerUser(server, overrides = {}) {
  counter++;
  const body = {
    name: "Ada Mother",
    email: `mum${counter}@example.com`,
    password: "correct-horse-battery",
    phone: "+46 70 123 45 67",
    country: "SE",
    acceptTerms: true,
    healthDataConsent: true,
    ageConfirmed: true,
    ...overrides,
  };
  const res = await server.request().post("/api/auth/register").send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { ...body, token: res.body.token, user: res.body.user, auth: `Bearer ${res.body.token}` };
}
