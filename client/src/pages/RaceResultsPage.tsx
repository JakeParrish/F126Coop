import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type CareerDetail, type Session } from "../api";
import SessionEntry from "../components/SessionEntry";

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
    <div className="max-w-3xl mx-auto">
      <Link to={backTo} className="text-xs text-zinc-500 hover:text-zinc-300">
        ← {data.career.name}
      </Link>
      <h1 className="text-2xl font-extrabold mt-1 flex items-center gap-2">
        R{race.round} · {race.name}
        {race.isSprint && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
            SPRINT WEEKEND
          </span>
        )}
      </h1>
      <p className="text-zinc-500 text-sm mb-5">
        {race.circuit} · {race.date}
      </p>

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
    </div>
  );
}
