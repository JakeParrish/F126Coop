import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { rosterRouter } from "./routes/roster.js";
import { careersRouter } from "./routes/careers.js";
import { authRouter } from "./routes/auth.js";
import { attachUser } from "./auth.js";

const app = express();
app.set("trust proxy", 1); // Railway terminates TLS at a proxy
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// CORS — only needed for the Vite dev server hitting the API cross-origin.
const origins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: origins }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use(attachUser); // populate req.user from the session cookie (non-blocking)
app.use("/api", authRouter);
app.use("/api", rosterRouter);
app.use("/api", careersRouter);

// In production, serve the built React app and let client-side routing handle
// everything that isn't an /api route.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`F1CoopSim server listening on :${port}`);
});
