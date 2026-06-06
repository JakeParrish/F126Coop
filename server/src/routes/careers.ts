import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { CALENDAR } from "../data/f126.js";
import { pointsFor } from "../points.js";
import { computeStandings } from "../standings.js";
import { uniqueSlug } from "../slug.js";
import { requireAuth, requireAdmin, publicUser, type AuthedRequest } from "../auth.js";

export const careersRouter = Router();

// --- validation schemas -----------------------------------------------------

const entrantInput = z.object({
  teamId: z.string().min(1),
  name: z.string().min(1).max(40),
  code: z.string().min(1).max(4),
  number: z.number().int().min(0).max(999),
  isPlayer: z.boolean().default(false),
  replacedDriver: z.string().max(40).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
});

const createCareerInput = z.object({
  name: z.string().min(1).max(60),
  seasonYear: z.number().int().min(2000).max(2100).default(2026),
  entrants: z.array(entrantInput).min(2).max(40),
});

const resultRow = z.object({
  entrantId: z.string().min(1),
  position: z.number().int().min(1).max(40).nullable(),
  dnf: z.boolean().default(false),
});

const submitResultsInput = z.object({
  session: z.enum(["RACE", "SPRINT"]),
  results: z.array(resultRow),
});

const editRaceInput = z.object({
  name: z.string().min(1).max(60).optional(),
  country: z.string().min(1).max(40).optional(),
  circuit: z.string().max(80).nullable().optional(),
  date: z.string().max(20).nullable().optional(),
  isSprint: z.boolean().optional(),
  // Fun, non-scoring awards — each holds an entrant id (or null to clear).
  driverOfDayId: z.string().nullable().optional(),
  mostOvertakesId: z.string().nullable().optional(),
  cleanestId: z.string().nullable().optional(),
  fastestLapId: z.string().nullable().optional(),
});

const editEntrantInput = z.object({
  name: z.string().min(1).max(40).optional(),
  code: z.string().min(1).max(4).optional(),
  number: z.number().int().min(0).max(999).optional(),
  isPlayer: z.boolean().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  replacedDriver: z.string().max(40).nullable().optional(),
});

// --- routes -----------------------------------------------------------------

// List careers with a quick summary.
careersRouter.get("/careers", async (_req, res) => {
  const careers = await prisma.career.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { entrants: true } },
      races: { select: { status: true } },
    },
  });

  const summary = careers.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    seasonYear: c.seasonYear,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    driverCount: c._count.entrants,
    totalRaces: c.races.length,
    completedRaces: c.races.filter((r) => r.status === "COMPLETED").length,
  }));

  res.json({ careers: summary });
});

// Create a career: snapshot the chosen grid + the 2026 calendar.
careersRouter.post("/careers", requireAuth, async (req, res) => {
  const parsed = createCareerInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { name, seasonYear, entrants } = parsed.data;

  // Validate referenced teams exist.
  const teamIds = [...new Set(entrants.map((e) => e.teamId))];
  const teams = await prisma.team.findMany({ where: { id: { in: teamIds } } });
  if (teams.length !== teamIds.length) {
    return res.status(400).json({ error: "One or more teamIds are invalid." });
  }

  // Car numbers must be unique across the grid (a player keeps the number of the
  // driver they replaced, so a simple uniqueness check enforces the rule).
  const numbers = entrants.map((e) => e.number);
  if (new Set(numbers).size !== numbers.length) {
    return res.status(400).json({ error: "Car numbers must be unique across the grid." });
  }

  const career = await prisma.career.create({
    data: {
      name,
      slug: await uniqueSlug(name),
      seasonYear,
      entrants: {
        create: entrants.map((e, i) => ({
          teamId: e.teamId,
          name: e.name,
          code: e.code.toUpperCase(),
          number: e.number,
          isPlayer: e.isPlayer,
          replacedDriver: e.replacedDriver ?? null,
          imageUrl: e.imageUrl ?? null,
          order: i,
        })),
      },
      races: {
        create: CALENDAR.map((r) => ({
          round: r.round,
          name: r.name,
          country: r.country,
          circuit: r.circuit,
          date: r.date,
          isSprint: r.isSprint,
        })),
      },
    },
  });

  res.status(201).json({ id: career.id, slug: career.slug });
});

// Full career detail: grid, calendar (with results), and standings.
careersRouter.get("/careers/:id", async (req, res) => {
  const key = req.params.id;
  const career = await prisma.career.findFirst({
    where: { OR: [{ slug: key }, { id: key }] },
    include: {
      entrants: { orderBy: { order: "asc" }, include: { team: true, claimedBy: true } },
      races: {
        orderBy: { round: "asc" },
        include: { results: true },
      },
    },
  });
  if (!career) return res.status(404).json({ error: "Career not found." });

  // Trim the claiming user to a public-safe shape.
  const careerOut = {
    ...career,
    entrants: career.entrants.map((e) => ({ ...e, claimedBy: publicUser(e.claimedBy) })),
  };
  const standings = await computeStandings(career.id);
  res.json({ career: careerOut, standings });
});

// Rename a career.
careersRouter.patch("/careers/:id", requireAuth, async (req, res) => {
  const schema = z.object({ name: z.string().min(1).max(60) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    await prisma.career.update({ where: { id: req.params.id }, data: { name: parsed.data.name } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Career not found." });
  }
});

// Delete a career (cascades to entrants, races, results).
careersRouter.delete("/careers/:id", requireAuth, async (req, res) => {
  try {
    await prisma.career.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Career not found." });
  }
});

// Edit a race (toggle sprint, fix date/name, etc.).
careersRouter.patch("/careers/:id/races/:raceId", requireAuth, async (req, res) => {
  const parsed = editRaceInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const race = await prisma.race.findFirst({
    where: { id: req.params.raceId, careerId: req.params.id },
  });
  if (!race) return res.status(404).json({ error: "Race not found." });

  const updated = await prisma.race.update({
    where: { id: race.id },
    data: parsed.data,
  });

  // If the sprint flag changed, recompute any stored sprint points.
  if (parsed.data.isSprint !== undefined && parsed.data.isSprint !== race.isSprint && !parsed.data.isSprint) {
    // Sprint turned off: clear sprint results for this race.
    await prisma.result.deleteMany({ where: { raceId: race.id, session: "SPRINT" } });
  }
  await prisma.career.update({ where: { id: req.params.id }, data: {} }); // bump updatedAt
  res.json({ race: updated });
});

// Submit (replace) results for one session of a race; points auto-assigned.
careersRouter.put("/careers/:id/races/:raceId/results", requireAuth, async (req, res) => {
  const parsed = submitResultsInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { session, results } = parsed.data;

  const race = await prisma.race.findFirst({
    where: { id: req.params.raceId, careerId: req.params.id },
  });
  if (!race) return res.status(404).json({ error: "Race not found." });
  if (session === "SPRINT" && !race.isSprint) {
    return res.status(400).json({ error: "This race is not a sprint weekend." });
  }

  // Validate entrants belong to this career.
  const entrants = await prisma.entrant.findMany({
    where: { careerId: req.params.id },
    select: { id: true },
  });
  const validIds = new Set(entrants.map((e) => e.id));
  for (const r of results) {
    if (!validIds.has(r.entrantId)) {
      return res.status(400).json({ error: `Unknown entrant ${r.entrantId}.` });
    }
  }

  // Reject duplicate positions among classified (non-DNF) finishers.
  const positions = results.filter((r) => !r.dnf && r.position != null).map((r) => r.position);
  if (new Set(positions).size !== positions.length) {
    return res.status(400).json({ error: "Duplicate finishing positions are not allowed." });
  }

  await prisma.$transaction(async (tx) => {
    await tx.result.deleteMany({ where: { raceId: race.id, session } });
    await tx.result.createMany({
      data: results
        .filter((r) => r.dnf || r.position != null)
        .map((r) => ({
          raceId: race.id,
          entrantId: r.entrantId,
          session,
          position: r.dnf ? null : r.position,
          dnf: r.dnf,
          points: pointsFor(session, r.position, r.dnf),
        })),
    });

    // A race is COMPLETED once its Grand Prix result is entered.
    if (session === "RACE") {
      const hasRace = results.some((r) => r.dnf || r.position != null);
      await tx.race.update({
        where: { id: race.id },
        data: { status: hasRace ? "COMPLETED" : "UPCOMING" },
      });
    }
    await tx.career.update({ where: { id: req.params.id }, data: {} }); // bump updatedAt
  });

  const standings = await computeStandings(req.params.id);
  const refreshed = await prisma.race.findUnique({
    where: { id: race.id },
    include: { results: true },
  });
  res.json({ race: refreshed, standings });
});

// Clear all results for one session of a race.
careersRouter.delete("/careers/:id/races/:raceId/results", requireAuth, async (req, res) => {
  const session = req.query.session === "SPRINT" ? "SPRINT" : "RACE";
  const race = await prisma.race.findFirst({
    where: { id: req.params.raceId, careerId: req.params.id },
  });
  if (!race) return res.status(404).json({ error: "Race not found." });

  await prisma.result.deleteMany({ where: { raceId: race.id, session } });
  if (session === "RACE") {
    await prisma.race.update({ where: { id: race.id }, data: { status: "UPCOMING" } });
  }
  const standings = await computeStandings(req.params.id);
  res.json({ ok: true, standings });
});

// Edit a single grid seat (rename, renumber, set photo, mark as player).
careersRouter.patch("/careers/:id/entrants/:entrantId", requireAuth, async (req, res) => {
  const parsed = editEntrantInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const entrant = await prisma.entrant.findFirst({
    where: { id: req.params.entrantId, careerId: req.params.id },
  });
  if (!entrant) return res.status(404).json({ error: "Seat not found." });

  const changes: {
    name?: string;
    code?: string;
    number?: number;
    isPlayer?: boolean;
    imageUrl?: string | null;
    replacedDriver?: string | null;
  } = {
    ...parsed.data,
    code: parsed.data.code ? parsed.data.code.toUpperCase() : undefined,
  };

  // Unchecking "player" restores the real driver this seat replaced.
  if (parsed.data.isPlayer === false && entrant.isPlayer && entrant.replacedDriver) {
    const original = await prisma.driver.findFirst({ where: { name: entrant.replacedDriver } });
    if (original) {
      changes.name = original.name;
      changes.code = original.code;
      changes.number = original.number;
      changes.imageUrl = original.imageUrl;
      changes.replacedDriver = null;
    }
  }

  // Car numbers stay unique across the grid (check the effective number).
  if (changes.number !== undefined) {
    const clash = await prisma.entrant.findFirst({
      where: { careerId: req.params.id, number: changes.number, id: { not: entrant.id } },
    });
    if (clash) {
      return res.status(400).json({ error: `Car #${changes.number} is already used by ${clash.name}.` });
    }
  }

  const updated = await prisma.entrant.update({ where: { id: entrant.id }, data: changes });
  await prisma.career.update({ where: { id: req.params.id }, data: {} }); // bump updatedAt
  res.json({ entrant: updated });
});

// Claim a custom-driver seat for the logged-in user (1 per career, unless admin).
careersRouter.post(
  "/careers/:id/entrants/:entrantId/claim",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const user = req.user!;
    const entrant = await prisma.entrant.findFirst({
      where: { id: req.params.entrantId, careerId: req.params.id },
    });
    if (!entrant) return res.status(404).json({ error: "Seat not found." });
    if (!entrant.isPlayer) {
      return res.status(400).json({ error: "Only custom drivers can be claimed." });
    }
    if (entrant.claimedById && entrant.claimedById !== user.id && !user.isAdmin) {
      return res.status(400).json({ error: "That driver is already claimed by someone else." });
    }
    if (!user.isAdmin) {
      const existing = await prisma.entrant.findFirst({
        where: { careerId: req.params.id, claimedById: user.id, id: { not: entrant.id } },
      });
      if (existing) {
        return res
          .status(400)
          .json({ error: `You already claimed ${existing.name} in this career.` });
      }
    }
    await prisma.entrant.update({ where: { id: entrant.id }, data: { claimedById: user.id } });
    res.json({ ok: true });
  }
);

// List all logged-in users (admin only) — for manual driver assignment.
careersRouter.get("/users", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json({ users: users.map(publicUser) });
});

// Admin: assign (or clear) a custom driver to a specific user, bypassing claims.
careersRouter.post(
  "/careers/:id/entrants/:entrantId/assign",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const parsed = z.object({ userId: z.string().nullable() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const entrant = await prisma.entrant.findFirst({
      where: { id: req.params.entrantId, careerId: req.params.id },
    });
    if (!entrant) return res.status(404).json({ error: "Seat not found." });
    if (!entrant.isPlayer) {
      return res.status(400).json({ error: "Only custom drivers can be assigned." });
    }
    if (parsed.data.userId) {
      const u = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
      if (!u) return res.status(400).json({ error: "Unknown user." });
    }
    await prisma.entrant.update({
      where: { id: entrant.id },
      data: { claimedById: parsed.data.userId },
    });
    res.json({ ok: true });
  }
);

// Release a claim (claimer or admin only).
careersRouter.delete(
  "/careers/:id/entrants/:entrantId/claim",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const user = req.user!;
    const entrant = await prisma.entrant.findFirst({
      where: { id: req.params.entrantId, careerId: req.params.id },
    });
    if (!entrant) return res.status(404).json({ error: "Seat not found." });
    if (entrant.claimedById && entrant.claimedById !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: "You can only unclaim your own driver." });
    }
    await prisma.entrant.update({ where: { id: entrant.id }, data: { claimedById: null } });
    res.json({ ok: true });
  }
);
