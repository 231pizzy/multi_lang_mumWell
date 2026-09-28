import cron from "node-cron";
import { assertRequiredEnv, env } from "./config/env.js";
import { connectMongo, disconnectMongo } from "./config/mongo.js";
import { createApp } from "./app.js";
import { activeProvider } from "./services/llm.js";
import { runReminders } from "./services/reminders.js";
import { logger } from "./utils/logger.js";

async function start() {
  assertRequiredEnv();
  await connectMongo();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`MumWell API listening on http://localhost:${env.port}`);
  });

  if (!activeProvider()) {
    logger.warn("No AI provider configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY.");
  }
  if (!env.databaseUrl) {
    logger.warn("DATABASE_URL not set. Program, wellness, consultations and reminders are disabled.");
  }

  let reminderTask;
  if (env.enableReminderCron) {
    let running = false;
    reminderTask = cron.schedule("* * * * *", async () => {
      if (running) return; // don't overlap slow runs
      running = true;
      try {
        await runReminders();
      } catch (err) {
        logger.error("Reminder run failed", { error: err.message });
      } finally {
        running = false;
      }
    });
    logger.info("Reminder emails scheduled every minute");
  }

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    reminderTask?.stop();
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  logger.error("Failed to start server", { error: err.message });
  process.exit(1);
});
