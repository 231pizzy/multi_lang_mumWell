import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "./env.js";
import { HttpError } from "../utils/httpError.js";

let db = null;

/**
 * Postgres (Neon) holds the wellness profile, 90-day program, wellness history,
 * reminder settings and voice-consultation records. Features that need it return
 * 503 when DATABASE_URL is not configured instead of crashing the server.
 */
export function getDb() {
  if (!env.databaseUrl) {
    throw new HttpError(503, "program.databaseUnavailable");
  }
  if (!db) {
    db = drizzle({ client: neon(env.databaseUrl) });
  }
  return db;
}

// Allows tests to swap in a different drizzle instance.
export function setDb(instance) {
  db = instance;
}
