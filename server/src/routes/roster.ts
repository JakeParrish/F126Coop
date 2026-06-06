import { Router } from "express";
import { prisma } from "../db.js";
import { CALENDAR } from "../data/f126.js";

export const rosterRouter = Router();

// Reference roster (teams + their drivers) used to pre-fill a new career.
rosterRouter.get("/roster", async (_req, res) => {
  const teams = await prisma.team.findMany({
    orderBy: { order: "asc" },
    include: { drivers: true },
  });
  res.json({ teams });
});

// The default 2026 calendar template (used by the UI to preview a new career).
rosterRouter.get("/calendar", (_req, res) => {
  res.json({ calendar: CALENDAR });
});
