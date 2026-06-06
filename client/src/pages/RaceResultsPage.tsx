import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type CareerDetail, type Entrant, type Race, type Session } from "../api";
import SessionEntry from "../components/SessionEntry";
import RaceAwards from "../components/RaceAwards";
import TrackMap from "../components/TrackMap";
import Flag from "../components/Flag";
import Avatar from "../components/Avatar";
import { countryIso } from "../lib/ui";

type Tab = "SPRINT" | "RACE" | "WEEKEND";

// Which tab to land on, based on what's been saved.
function defaultTab(race: Race): Tab {
  if (!race.isSprint) return "RACE";
  const sprintSaved = race.results.some((r) => r.session === "SPRINT");
  const raceSaved = race.results.some((r) => r.session === "RACE");
  if (sprintSaved && raceSaved) return "WEEKEND";
  if (sprintSaved) return "RACE";
  return "SPRINT";
}

export default function RaceResultsPage() {
  const { slug, round } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<CareerDetail | null>(null);
  const [override, setOverride] = useState<Tab | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setData(await api.getCareer(slug));
  }, [slug]);

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, [load]);

  const race = data?.career.races.find((r) => r.round === Number(round));

  if (error) return <p className="text-f1-red">{error}</p>;
  if (!data || !race) return <p className="text-zinc-500">Loading…</p>;

  const backTo = `/career/${data.career.slug ?? data.career.id}`;
  // Until the user clicks a tab, follow the saved-state default.
  const tab: Tab = override ?? defaultTab(race);

  const tabs: [Tab, string][] = [
    ["SPRINT", "Sprint"],
    ["RACE", "Grand Prix"],
    ["WEEKEND", "Weekend Results"],
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Link to={backTo} className="text-xs text-zinc-500 hover:text-zinc-300">
        ← {data.career.name}
      </Link>

      <div className="panel p-5 mt-1 mb-5 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-full sm:w-52 h-36 shrink-0 flex items-center justify-center">
          <TrackMap round={race.round} color="#E10600" strokeWidth={16} className="h-full w-full" />
        </div>
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-500">ROUND {race.round}</span>
            {race.isSprint && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                SPRINT WEEKEND
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold mt-1 flex items-center gap-2">
            <Flag iso={countryIso(race.country)} className="h-6" />
            {race.name}
          </h1>
          <p className="text-zinc-400">{race.circuit}</p>
          <p className="text-zinc-500 text-sm">
            {race.date} · {race.country}
          </p>
        </div>
      </div>

      {race.isSprint && (
        <div className="flex flex-wrap gap-1 mb-5 bg-f1-panel border border-f1-line rounded-xl p-1 w-fit">
          {tabs.map(([t, label]) => (
            <button
              key={t}
              onClick={() => setOverride(t)}
              className={`tab ${tab === t ? "bg-f1-red text-white" : "text-zinc-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === "WEEKEND" ? (
        <WeekendResults race={race} entrants={data.career.entrants} />
      ) : (
        <SessionEntry
          key={tab}
          careerId={data.career.id}
          race={race}
          session={tab as Session}
          entrants={data.career.entrants}
          onSaved={load}
          onDone={() => nav(backTo)}
          doneLabel="Save & back to schedule"
        />
      )}

      <section className="mt-8">
        <h2 className="font-bold text-lg mb-1">
          Awards <span className="text-zinc-500 text-sm font-normal">· just for fun, no points</span>
        </h2>
        <p className="text-zinc-500 text-xs mb-3">Driver of the Day, Fastest Lap, Most Overtakes, Cleanest Driver.</p>
        <RaceAwards
          careerId={data.career.id}
          race={race}
          entrants={data.career.entrants}
          onSaved={load}
        />
      </section>
    </div>
  );
}

// Read-only combined sprint + Grand Prix points for a sprint weekend.
function WeekendResults({ race, entrants }: { race: Race; entrants: Entrant[] }) {
  const rows = entrants
    .map((e) => {
      const rr = race.results.find((x) => x.session === "RACE" && x.entrantId === e.id);
      const sr = race.results.find((x) => x.session === "SPRINT" && x.entrantId === e.id);
      const racePts = rr?.points ?? 0;
      const sprintPts = sr?.points ?? 0;
      return {
        e,
        racePts,
        sprintPts,
        total: racePts + sprintPts,
        racePos: rr && !rr.dnf ? rr.position : null,
      };
    })
    .sort(
      (a, b) =>
        b.total - a.total ||
        (a.racePos ?? 99) - (b.racePos ?? 99) ||
        a.e.order - b.e.order
    );

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500 border-b border-f1-line">
          <tr>
            <th className="px-3 py-2 w-10">#</th>
            <th className="px-3 py-2">Driver</th>
            <th className="px-3 py-2 text-center">Sprint</th>
            <th className="px-3 py-2 text-center">Race</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.e.id} className="border-b border-f1-line/60 last:border-0">
              <td className="px-3 py-2 font-mono text-zinc-500">{i + 1}</td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-2">
                  <Avatar
                    name={r.e.name}
                    code={r.e.code}
                    teamColor={r.e.team.color}
                    imageUrl={r.e.imageUrl}
                    size={28}
                  />
                  <span className="font-medium">{r.e.name}</span>
                  <span className="font-mono text-xs text-zinc-500">{r.e.code}</span>
                </span>
              </td>
              <td className="px-3 py-2 text-center text-zinc-400">{r.sprintPts || ""}</td>
              <td className="px-3 py-2 text-center text-zinc-400">{r.racePts || ""}</td>
              <td className="px-3 py-2 text-right font-bold">{r.total || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
