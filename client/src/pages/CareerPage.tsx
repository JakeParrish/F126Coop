import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type CareerDetail, type Race, type Session } from "../api";
import SessionEntry from "../components/SessionEntry";

type Tab = "calendar" | "drivers" | "constructors";

export default function CareerPage() {
  const { slug } = useParams();
  const [data, setData] = useState<CareerDetail | null>(null);
  const [tab, setTab] = useState<Tab>("calendar");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      setData(await api.getCareer(slug));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleSprint(race: Race) {
    if (!data) return;
    // Mutations target the career's real id, not the URL slug.
    await api.editRace(data.career.id, race.id, { isSprint: !race.isSprint });
    load();
  }

  if (error) return <p className="text-f1-red">{error}</p>;
  if (!data) return <p className="text-zinc-500">Loading…</p>;

  const { career, standings } = data;
  const done = career.races.filter((r) => r.status === "COMPLETED").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← All careers
          </Link>
          <h1 className="text-2xl font-extrabold mt-1">{career.name}</h1>
          <p className="text-zinc-500 text-sm">
            {career.seasonYear} · {done}/{career.races.length} races complete
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-f1-panel border border-f1-line rounded-xl p-1 w-fit">
        {(["calendar", "drivers", "constructors"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab capitalize ${tab === t ? "bg-f1-red text-white" : "text-zinc-400 hover:text-white"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "calendar" && (
        <Calendar career={career} onToggleSprint={toggleSprint} onSaved={load} />
      )}
      {tab === "drivers" && <DriverStandings standings={standings} />}
      {tab === "constructors" && <ConstructorStandings standings={standings} />}
    </div>
  );
}

function Calendar({
  career,
  onToggleSprint,
  onSaved,
}: {
  career: CareerDetail["career"];
  onToggleSprint: (race: Race) => void;
  onSaved: () => Promise<void>;
}) {
  // Which race's inline editor is open (by round; null = all collapsed).
  const [openRound, setOpenRound] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {career.races.map((r) => {
        const done = r.status === "COMPLETED";
        const open = openRound === r.round;
        return (
          <div key={r.id} className="panel overflow-hidden">
            <button
              onClick={() => setOpenRound(open ? null : r.round)}
              className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-f1-line/20 transition-colors"
            >
              <span className="w-8 text-center font-mono text-zinc-500 text-sm">{r.round}</span>
              <div className="flex-1 min-w-[12rem]">
                <div className="font-semibold flex items-center gap-2">
                  {r.name}
                  {r.isSprint && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                      SPRINT
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  {r.circuit} · {r.date}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  done
                    ? "bg-green-500/15 text-green-400 border border-green-500/30"
                    : "bg-f1-line text-zinc-400"
                }`}
              >
                {done ? "Completed" : "Upcoming"}
              </span>
              <span className="text-zinc-500 text-xs w-4 text-center">{open ? "▲" : "▼"}</span>
            </button>

            {open && (
              <div className="border-t border-f1-line p-4">
                <RacePanel
                  career={career}
                  race={r}
                  onToggleSprint={onToggleSprint}
                  onSaved={onSaved}
                  onClose={() => setOpenRound(null)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Inline editor shown when a calendar row is expanded: sprint toggle, a
// session switch for sprint weekends, and the result-entry table.
function RacePanel({
  career,
  race,
  onToggleSprint,
  onSaved,
  onClose,
}: {
  career: CareerDetail["career"];
  race: Race;
  onToggleSprint: (race: Race) => void;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const [session, setSession] = useState<Session>(race.isSprint ? "SPRINT" : "RACE");
  // A non-sprint race only has a Grand Prix session.
  const effective: Session = race.isSprint ? session : "RACE";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-xs text-zinc-400 flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={race.isSprint}
            onChange={() => onToggleSprint(race)}
            className="accent-yellow-500"
          />
          Sprint weekend
        </label>

        {race.isSprint && (
          <div className="flex gap-1 bg-f1-dark border border-f1-line rounded-lg p-1">
            {(["SPRINT", "RACE"] as Session[]).map((s) => (
              <button
                key={s}
                onClick={() => setSession(s)}
                className={`tab text-xs ${
                  effective === s ? "bg-f1-red text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {s === "SPRINT" ? "Sprint" : "Grand Prix"}
              </button>
            ))}
          </div>
        )}
      </div>

      <SessionEntry
        key={effective}
        careerId={career.id}
        race={race}
        session={effective}
        entrants={career.entrants}
        onSaved={onSaved}
        onDone={onClose}
        doneLabel="Save & close"
      />
    </div>
  );
}

function DriverStandings({ standings }: { standings: CareerDetail["standings"] }) {
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500 border-b border-f1-line">
          <tr>
            <th className="px-3 py-2 w-10">#</th>
            <th className="px-3 py-2">Driver</th>
            <th className="px-3 py-2">Team</th>
            <th className="px-3 py-2 text-center">Wins</th>
            <th className="px-3 py-2 text-center">Podiums</th>
            <th className="px-3 py-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.drivers.map((d, i) => (
            <tr key={d.entrantId} className="border-b border-f1-line/60 last:border-0">
              <td className="px-3 py-2 font-mono text-zinc-500">{i + 1}</td>
              <td className="px-3 py-2 font-semibold">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block w-1 h-4 rounded-sm"
                    style={{ background: d.teamColor }}
                  />
                  {d.name}
                  <span className="font-mono text-xs text-zinc-500">{d.code}</span>
                  {d.isPlayer && (
                    <span className="text-[10px] font-bold px-1 rounded bg-f1-red/20 text-f1-red">
                      YOU
                    </span>
                  )}
                </span>
              </td>
              <td className="px-3 py-2 text-zinc-400">{d.teamName}</td>
              <td className="px-3 py-2 text-center">{d.wins}</td>
              <td className="px-3 py-2 text-center">{d.podiums}</td>
              <td className="px-3 py-2 text-right font-bold">{d.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConstructorStandings({ standings }: { standings: CareerDetail["standings"] }) {
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500 border-b border-f1-line">
          <tr>
            <th className="px-3 py-2 w-10">#</th>
            <th className="px-3 py-2">Team</th>
            <th className="px-3 py-2 text-center">Wins</th>
            <th className="px-3 py-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.constructors.map((c, i) => (
            <tr key={c.teamId} className="border-b border-f1-line/60 last:border-0">
              <td className="px-3 py-2 font-mono text-zinc-500">{i + 1}</td>
              <td className="px-3 py-2 font-semibold">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block w-1 h-4 rounded-sm"
                    style={{ background: c.teamColor }}
                  />
                  {c.teamName}
                </span>
              </td>
              <td className="px-3 py-2 text-center">{c.wins}</td>
              <td className="px-3 py-2 text-right font-bold">{c.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
