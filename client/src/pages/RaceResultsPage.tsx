import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type CareerDetail, type Session } from "../api";
import SessionEntry from "../components/SessionEntry";
import RaceAwards from "../components/RaceAwards";
import TrackMap from "../components/TrackMap";
import Flag from "../components/Flag";
import { countryIso } from "../lib/ui";

export default function RaceResultsPage() {
  const { slug, round } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<CareerDetail | null>(null);
  const [session, setSession] = useState<Session>("RACE");
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
        <div className="flex gap-1 mb-5 bg-f1-panel border border-f1-line rounded-xl p-1 w-fit">
          {(["SPRINT", "RACE"] as Session[]).map((s) => (
            <button
              key={s}
              onClick={() => setSession(s)}
              className={`tab ${session === s ? "bg-f1-red text-white" : "text-zinc-400 hover:text-white"}`}
            >
              {s === "SPRINT" ? "Sprint" : "Grand Prix"}
            </button>
          ))}
        </div>
      )}

      <SessionEntry
        key={session}
        careerId={data.career.id}
        race={race}
        session={session}
        entrants={data.career.entrants}
        onSaved={load}
        onDone={() => nav(backTo)}
        doneLabel="Save & back to schedule"
      />

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
