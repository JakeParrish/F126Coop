import { prisma } from "./db.js";

export interface DriverStanding {
  entrantId: string;
  name: string;
  code: string;
  number: number;
  isPlayer: boolean;
  imageUrl: string | null;
  teamId: string;
  teamName: string;
  teamColor: string;
  points: number;
  wins: number;
  podiums: number;
}

export interface ConstructorStanding {
  teamId: string;
  teamName: string;
  teamColor: string;
  points: number;
  wins: number;
}

/** Computes driver + constructor standings for a career from stored results. */
export async function computeStandings(careerId: string) {
  const entrants = await prisma.entrant.findMany({
    where: { careerId },
    orderBy: { order: "asc" },
    include: {
      team: true,
      results: true,
    },
  });

  const drivers: DriverStanding[] = entrants.map((e) => {
    let points = 0;
    let wins = 0;
    let podiums = 0;
    for (const r of e.results) {
      points += r.points;
      // Wins/podiums count the Grand Prix only, not the sprint.
      if (r.session === "RACE" && !r.dnf && r.position) {
        if (r.position === 1) wins++;
        if (r.position <= 3) podiums++;
      }
    }
    return {
      entrantId: e.id,
      name: e.name,
      code: e.code,
      number: e.number,
      isPlayer: e.isPlayer,
      imageUrl: e.imageUrl,
      teamId: e.teamId,
      teamName: e.team.name,
      teamColor: e.team.color,
      points,
      wins,
      podiums,
    };
  });

  drivers.sort((a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums);

  // Aggregate constructors.
  const byTeam = new Map<string, ConstructorStanding>();
  for (const d of drivers) {
    const c = byTeam.get(d.teamId) ?? {
      teamId: d.teamId,
      teamName: d.teamName,
      teamColor: d.teamColor,
      points: 0,
      wins: 0,
    };
    c.points += d.points;
    c.wins += d.wins;
    byTeam.set(d.teamId, c);
  }
  const constructors = [...byTeam.values()].sort(
    (a, b) => b.points - a.points || b.wins - a.wins
  );

  return { drivers, constructors };
}
