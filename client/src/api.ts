// Typed API client for the F1CoopSim backend.

export type Session = "RACE" | "SPRINT";
export type RaceStatus = "UPCOMING" | "COMPLETED";

export interface Driver {
  id: string;
  name: string;
  code: string;
  number: number;
  imageUrl: string | null;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  fullName: string;
  color: string;
  order: number;
  drivers: Driver[];
}

export interface Entrant {
  id: string;
  careerId: string;
  teamId: string;
  name: string;
  code: string;
  number: number;
  isPlayer: boolean;
  replacedDriver: string | null;
  imageUrl: string | null;
  order: number;
  team: Team;
}

export interface Result {
  id: string;
  raceId: string;
  entrantId: string;
  session: Session;
  position: number | null;
  dnf: boolean;
  points: number;
}

export interface Race {
  id: string;
  careerId: string;
  round: number;
  name: string;
  country: string;
  circuit: string | null;
  date: string | null;
  isSprint: boolean;
  status: RaceStatus;
  results: Result[];
  driverOfDayId: string | null;
  mostOvertakesId: string | null;
  cleanestId: string | null;
  fastestLapId: string | null;
}

// Keys of the four non-scoring race awards.
export type AwardKey = "driverOfDayId" | "mostOvertakesId" | "cleanestId" | "fastestLapId";

export interface Career {
  id: string;
  slug: string | null;
  name: string;
  seasonYear: number;
  createdAt: string;
  updatedAt: string;
  entrants: Entrant[];
  races: Race[];
}

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

export interface Standings {
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
}

export interface CareerSummary {
  id: string;
  slug: string | null;
  name: string;
  seasonYear: number;
  createdAt: string;
  updatedAt: string;
  driverCount: number;
  totalRaces: number;
  completedRaces: number;
}

export interface CareerDetail {
  career: Career;
  standings: Standings;
}

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export interface EntrantInput {
  teamId: string;
  name: string;
  code: string;
  number: number;
  isPlayer: boolean;
  replacedDriver: string | null;
  imageUrl: string | null;
}

export interface ResultRowInput {
  entrantId: string;
  position: number | null;
  dnf: boolean;
}

export const api = {
  getRoster: () => req<{ teams: Team[] }>("/api/roster"),

  listCareers: () => req<{ careers: CareerSummary[] }>("/api/careers"),

  createCareer: (data: { name: string; seasonYear?: number; entrants: EntrantInput[] }) =>
    req<{ id: string; slug: string | null }>("/api/careers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCareer: (id: string) => req<CareerDetail>(`/api/careers/${id}`),

  renameCareer: (id: string, name: string) =>
    req<{ ok: true }>(`/api/careers/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),

  deleteCareer: (id: string) => req<{ ok: true }>(`/api/careers/${id}`, { method: "DELETE" }),

  editRace: (
    careerId: string,
    raceId: string,
    data: Partial<
      Pick<
        Race,
        | "name"
        | "country"
        | "circuit"
        | "date"
        | "isSprint"
        | "driverOfDayId"
        | "mostOvertakesId"
        | "cleanestId"
        | "fastestLapId"
      >
    >
  ) =>
    req<{ race: Race }>(`/api/careers/${careerId}/races/${raceId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  submitResults: (careerId: string, raceId: string, session: Session, results: ResultRowInput[]) =>
    req<{ race: Race; standings: Standings }>(
      `/api/careers/${careerId}/races/${raceId}/results`,
      { method: "PUT", body: JSON.stringify({ session, results }) }
    ),

  clearResults: (careerId: string, raceId: string, session: Session) =>
    req<{ ok: true; standings: Standings }>(
      `/api/careers/${careerId}/races/${raceId}/results?session=${session}`,
      { method: "DELETE" }
    ),
};
