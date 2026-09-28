import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { api } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

export function createApp() {
  const app = express();

  // Needed for correct client IPs (rate limiting) behind a proxy/load balancer.
  if (env.isProduction) app.set("trust proxy", 1);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(
    cors({
      origin: env.clientUrls,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  if (!env.isTest) app.use(morgan(env.isProduction ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", api);
  app.use("/api", notFoundHandler);

  // Optional: serve the built React app from this server.
  if (env.serveClient && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
  } else {
    app.get("/", (_req, res) => res.json({ name: "MumWell API", status: "ok" }));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
