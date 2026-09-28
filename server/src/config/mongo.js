import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectMongo(uri = env.mongoUri) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    // Set MONGO_AUTO_INDEX=false to skip index builds on startup (e.g. read-only checks).
    autoIndex: process.env.MONGO_AUTO_INDEX !== "false",
  });
  logger.info("Connected to MongoDB");
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
