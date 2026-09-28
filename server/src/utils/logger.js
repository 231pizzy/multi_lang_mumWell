import winston from "winston";
import { env } from "../config/env.js";

const transports = [
  new winston.transports.Console({
    silent: env.isTest,
    format: env.isProduction
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
];

if (process.env.LOG_TO_FILE === "true") {
  transports.push(
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports,
});
