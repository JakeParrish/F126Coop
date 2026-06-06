import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type CareerDetail } from "../api";
import TeamLogo from "../components/TeamLogo";
import DriverPortrait from "../components/DriverPortrait";
import { driverKey, flagFor, nationalityFlag } from "../lib/ui";

export default function DriverPage() {
  const { slug, name: nameParam } = useParams();
  const [data, setData] = useState<CareerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setData(await api.getCareer(slug));
  }, [slug]);

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, [load]);

  if (error) return <p className="text-f1-red">{error}</p>;
  if (!data) return <p className="text-zinc-500">Loading…</p>;

  const { career, standings } = data;
  // Match by name key (e.g. "MaxVerstappen"); fall back to id for old links.
  const key = (nameParam ?? "").toLowerCase();
  const entrant =
    career.entrants.find((e) => driverKey(e.name).toLowerCase() === key) ??
    career.entrants.find((e) => e.id === nameParam);
  if (!entrant) return <p className="text-zinc-500">Driver not found in this career.</p>;

  const backTo = `/career/${career.slug ?? career.id}`;
  const standing = standings.drivers.find((d) => d.entrantId === entrant.id);
  const rank = standings.drivers.findIndex((d) => d.entrantId === entrant.id) + 1;

  const rows = career.races.map((r) => ({
    r,
    race: r.results.find((x) => x.session === "RACE" && x.entrantId === entrant.id),
    sprint: r.results.find((x) => x.session === "SPRINT" && x.entrantId === entrant.id),
  }));
  const best = rows.reduce(
    (b, { race }) => (race && !race.dnf && race.position ? Math.min(b, race.position) : b),
    Infinity
  );

  const color = entrant.team.color;
  const [first, ...rest] = entrant.name.split(" ");
  const last = rest.join(" ");
  const nat = nationalityFlag(entrant.code);

  return (
    <div className="max-w-4xl mx-auto">
      <Link to={backTo} className="text-xs text-zinc-500 hover:text-zinc-300">
        ← {career.name}
      </Link>

      {/* F1-style driver card */}
      <div
        className="relative panel overflow-hidden mt-1 mb-5"
        style={{ background: `linear-gradient(105deg, ${color} 0%, ${color}cc 35%, #0B0B0F 82%)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
        <div className="relative flex items-end justify-between gap-4 p-6 min-h-[210px]">
          <div className="text-white drop-shadow">
            <div className="text-xl sm:text-2xl font-light leading-none">{first}</div>
            <div className="text-3xl sm:text-5xl font-extrabold leading-tight">{last || first}</div>
            <div className="text-sm opacity-95 mt-2 flex items-center gap-2">
              <TeamLogo name={entrant.team.name} color={color} size={20} />
              {entrant.team.fullName}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-4xl sm:text-5xl font-extrabold italic">{entrant.number}</span>
              {nat && <span className="text-2xl">{nat}</span>}
              {entrant.isPlayer && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20">PLAYER</span>
              )}
            </div>
          </div>
          <DriverPortrait
            name={entrant.name}
            code={entrant.code}
            teamColor={color}
            imageUrl={entrant.imageUrl}
            height={210}
            className="self-end hidden sm:block"
          />
        </div>
      </div>

      {/* Season summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Stat label="Championship" value={rank ? `P${rank}` : "—"} />
        <Stat label="Points" value={standing?.points ?? 0} />
        <Stat label="Wins" value={standing?.wins ?? 0} />
        <Stat label="Podiums" value={standing?.podiums ?? 0} />
        <Stat label="Best finish" value={isFinite(best) ? `P${best}` : "—"} />
      </div>

      {/* Per-race results */}
      <h2 className="font-bold text-lg mb-2">Results</h2>
      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-zinc-500 border-b border-f1-line">
            <tr>
              <th className="px-3 py-2 w-10">R</th>
              <th className="px-3 py-2">Grand Prix</th>
              <th className="px-3 py-2 text-center">Sprint</th>
              <th className="px-3 py-2 text-center">Race</th>
              <th className="px-3 py-2 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, race, sprint }) => {
              const completed = r.status === "COMPLETED";
              const pts = (race?.points ?? 0) + (sprint?.points ?? 0);
              return (
                <tr key={r.id} className="border-b border-f1-line/60 last:border-0">
                  <td className="px-3 py-2 font-mono text-zinc-500">{r.round}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`${backTo}/race/${r.round}`}
                      className="flex items-center gap-2 hover:text-f1-red"
                    >
                      <span>{flagFor(r.country)}</span>
                      <span className="font-medium">{r.country}</span>
                      {r.isSprint && (
                        <span className="text-[9px] font-bold px-1 rounded bg-yellow-500/20 text-yellow-400">
                          S
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {r.isSprint ? <Finish res={sprint} completed={completed} /> : <span className="text-zinc-700">—</span>}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Finish res={race} completed={completed} />
                  </td>
                  <td className="px-3 py-2 text-right font-bold">{completed && pts ? pts : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Finish({
  res,
  completed,
}: {
  res?: { position: number | null; dnf: boolean };
  completed: boolean;
}) {
  if (!completed) return <span className="text-zinc-700">·</span>;
  if (!res) return <span className="text-zinc-600">—</span>;
  if (res.dnf) return <span className="text-zinc-500 font-semibold">DNF</span>;
  const p = res.position!;
  const cls =
    p === 1 ? "text-yellow-400" : p === 2 ? "text-zinc-300" : p === 3 ? "text-amber-600" : "text-zinc-200";
  return <span className={`font-bold ${cls}`}>P{p}</span>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel p-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="text-2xl font-extrabold mt-0.5">{value}</div>
    </div>
  );
}
