import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type CareerDetail, type Entrant, type Race } from "../api";
import TrackMap from "../components/TrackMap";
import Avatar from "../components/Avatar";
import TeamBadge from "../components/TeamBadge";
import { flagFor } from "../lib/ui";

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

      {tab === "calendar" && <Calendar career={career} />}
      {tab === "drivers" && <DriverStandings standings={standings} />}
      {tab === "constructors" && <ConstructorStandings standings={standings} />}
    </div>
  );
}

function Calendar({ career }: { career: CareerDetail["career"] }) {
  const entrantById = new Map<string, Entrant>(career.entrants.map((e) => [e.id, e]));
  const slug = career.slug ?? career.id;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {career.races.map((r) => {
        const done = r.status === "COMPLETED";
        const winner = winnerOf(r, entrantById);
        return (
          <Link
            key={r.id}
            to={`/career/${slug}/race/${r.round}`}
            className="panel p-4 flex flex-col hover:border-f1-red/60 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-zinc-500">ROUND {r.round}</span>
              {r.isSprint && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                  SPRINT
                </span>
              )}
            </div>

            <div className="h-28 my-1 flex items-center justify-center">
              <TrackMap
                round={r.round}
                color={done ? "#22c55e" : "#9aa0ad"}
                strokeWidth={20}
                className="h-full w-full"
              />
            </div>

            <div className="mt-1">
              <div className="font-bold flex items-center gap-2 leading-tight">
                <span>{flagFor(r.country)}</span>
                {r.name}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {r.circuit} · {r.date}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-f1-line flex items-center justify-between">
              {done && winner ? (
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="text-yellow-400">🏆</span>
                  <Avatar
                    name={winner.name}
                    code={winner.code}
                    teamColor={winner.team.color}
                    imageUrl={winner.imageUrl}
                    size={22}
                  />
                  <span className="font-semibold">{winner.name}</span>
                </span>
              ) : (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    done
                      ? "bg-green-500/15 text-green-400 border border-green-500/30"
                      : "bg-f1-line text-zinc-400"
                  }`}
                >
                  {done ? "Completed" : "Upcoming"}
                </span>
              )}
              <span className="text-zinc-600 text-xs">→</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// The Grand Prix winner's entrant, if results are in.
function winnerOf(race: Race, byId: Map<string, Entrant>): Entrant | undefined {
  const win = race.results.find((r) => r.session === "RACE" && r.position === 1 && !r.dnf);
  return win ? byId.get(win.entrantId) : undefined;
}

function DriverStandings({ standings }: { standings: CareerDetail["standings"] }) {
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500 border-b border-f1-line">
          <tr>
            <th className="px-3 py-2 w-10">#</th>
            <th className="px-3 py-2">Driver</th>
            <th className="px-3 py-2 hidden sm:table-cell">Team</th>
            <th className="px-3 py-2 text-center">Wins</th>
            <th className="px-3 py-2 text-center hidden sm:table-cell">Podiums</th>
            <th className="px-3 py-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.drivers.map((d, i) => (
            <tr key={d.entrantId} className="border-b border-f1-line/60 last:border-0">
              <td className="px-3 py-2 font-mono text-zinc-500">{i + 1}</td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-2.5">
                  <Avatar
                    name={d.name}
                    code={d.code}
                    teamColor={d.teamColor}
                    imageUrl={d.imageUrl}
                    size={32}
                  />
                  <span className="font-semibold">{d.name}</span>
                  <span className="font-mono text-xs text-zinc-500">{d.code}</span>
                  {d.isPlayer && (
                    <span className="text-[10px] font-bold px-1 rounded bg-f1-red/20 text-f1-red">
                      YOU
                    </span>
                  )}
                </span>
              </td>
              <td className="px-3 py-2 hidden sm:table-cell">
                <TeamBadge name={d.teamName} color={d.teamColor} />
              </td>
              <td className="px-3 py-2 text-center">{d.wins}</td>
              <td className="px-3 py-2 text-center hidden sm:table-cell">{d.podiums}</td>
              <td className="px-3 py-2 text-right font-bold">{d.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConstructorStandings({ standings }: { standings: CareerDetail["standings"] }) {
  const max = Math.max(1, ...standings.constructors.map((c) => c.points));
  return (
    <div className="space-y-2">
      {standings.constructors.map((c, i) => (
        <div key={c.teamId} className="panel px-4 py-3 flex items-center gap-3">
          <span className="font-mono text-zinc-500 w-6">{i + 1}</span>
          <span
            className="w-1.5 h-8 rounded-sm"
            style={{ background: c.teamColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold">{c.teamName}</span>
              <span className="font-bold">{c.points}</span>
            </div>
            <div className="h-1.5 bg-f1-line rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full"
                style={{ width: `${(c.points / max) * 100}%`, background: c.teamColor }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
