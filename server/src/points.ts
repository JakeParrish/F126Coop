import { Session } from "@prisma/client";

// 2026 points. The fastest-lap point was removed from 2025 onward, so points
// are purely position-based.

// Grand Prix: top 10.
export const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// Sprint: top 8.
export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

/**
 * Points for a finishing position in a given session.
 * `position` is 1-based. DNF / not-classified yields 0.
 */
export function pointsFor(
  session: Session,
  position: number | null | undefined,
  dnf: boolean
): number {
  if (dnf || !position || position < 1) return 0;
  const table = session === "SPRINT" ? SPRINT_POINTS : RACE_POINTS;
  return table[position - 1] ?? 0;
}
