import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  type CareerDetail,
  type Entrant,
  type Race,
  type Session,
  type ResultRowInput,
} from "../api";

const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

function pointsFor(session: Session, position: number | null, dnf: boolean) {
  if (dnf || !position || position < 1) return 0;
  const table = session === "SPRINT" ? SPRINT_POINTS : RACE_POINTS;
  return table[position - 1] ?? 0;
}

export default function RaceResultsPage() {
  const { id, raceId } = useParams();
  const [data, setData] = useState<CareerDetail | null>(null);
  const [session, setSession] = useState<Session>("RACE");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setData(await api.getCareer(id));
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, [load]);

  const race = data?.career.races.find((r) => r.id === raceId);

  if (error) return <p className="text-f1-red">{error}</p>;
  if (!data || !race) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to={`/career/${id}`} className="text-xs text-zinc-500 hover:text-zinc-300">
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
        careerId={id!}
        race={race}
        session={session}
        entrants={data.career.entrants}
        onSaved={load}
      />
    </div>
  );
}

function SessionEntry({
  careerId,
  race,
  session,
  entrants,
  onSaved,
}: {
  careerId: string;
  race: Race;
  session: Session;
  entrants: Entrant[];
  onSaved: () => Promise<void>;
}) {
  // entrantId -> { position string, dnf }
  const initial = useMemo(() => {
    const m: Record<string, { position: string; dnf: boolean }> = {};
    for (const e of entrants) {
      const existing = race.results.find((r) => r.entrantId === e.id && r.session === session);
      m[e.id] = {
        position: existing?.position != null ? String(existing.position) : "",
        dnf: existing?.dnf ?? false,
      };
    }
    return m;
  }, [entrants, race.results, session]);

  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(initial);
    setMsg(null);
    setError(null);
  }, [initial]);

  function set(entrantId: string, patch: Partial<{ position: string; dnf: boolean }>) {
    setRows((prev) => ({ ...prev, [entrantId]: { ...prev[entrantId], ...patch } }));
    setMsg(null);
  }

  // Detect duplicate positions among classified finishers.
  const dupPositions = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entrants) {
      const r = rows[e.id];
      if (!r?.dnf && r?.position) counts[r.position] = (counts[r.position] ?? 0) + 1;
    }
    return new Set(Object.keys(counts).filter((p) => counts[p] > 1));
  }, [rows, entrants]);

  const hasDup = dupPositions.size > 0;

  async function save() {
    setError(null);
    if (hasDup) return setError("Two drivers share a finishing position.");
    setSaving(true);
    try {
      const results: ResultRowInput[] = entrants
        .map((e) => {
          const r = rows[e.id];
          const pos = r.position ? Number(r.position) : null;
          return { entrantId: e.id, position: r.dnf ? null : pos, dnf: r.dnf };
        })
        .filter((r) => r.dnf || r.position != null);
      await api.submitResults(careerId, race.id, session, results);
      setMsg("Results saved · points updated.");
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    if (!confirm("Clear all results for this session?")) return;
    setSaving(true);
    try {
      await api.clearResults(careerId, race.id, session);
      await onSaved();
      setRows((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next)) next[k] = { position: "", dnf: false };
        return next;
      });
      setMsg("Results cleared.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const maxPos = entrants.length;

  return (
    <div>
      <div className="panel overflow-hidden">
        <div className="px-4 py-2 text-xs uppercase text-zinc-500 border-b border-f1-line flex">
          <span className="w-24">Position</span>
          <span className="flex-1">Driver</span>
          <span className="w-16 text-center">DNF</span>
          <span className="w-14 text-right">Pts</span>
        </div>
        <div className="divide-y divide-f1-line">
          {entrants.map((e) => {
            const r = rows[e.id];
            const pos = r?.position ? Number(r.position) : null;
            const pts = pointsFor(session, pos, r?.dnf ?? false);
            const dup = r?.position ? dupPositions.has(r.position) : false;
            return (
              <div key={e.id} className="px-4 py-2 flex items-center">
                <span className="w-24">
                  <input
                    className={`input w-16 text-center ${dup ? "border-f1-red text-f1-red" : ""}`}
                    type="number"
                    min={1}
                    max={maxPos}
                    placeholder="–"
                    disabled={r?.dnf}
                    value={r?.position ?? ""}
                    onChange={(ev) => set(e.id, { position: ev.target.value })}
                  />
                </span>
                <span className="flex-1 flex items-center gap-2">
                  <span
                    className="inline-block w-1 h-4 rounded-sm"
                    style={{ background: e.team.color }}
                  />
                  <span className="font-medium">{e.name}</span>
                  <span className="font-mono text-xs text-zinc-500">{e.code}</span>
                  {e.isPlayer && (
                    <span className="text-[10px] font-bold px-1 rounded bg-f1-red/20 text-f1-red">
                      YOU
                    </span>
                  )}
                </span>
                <span className="w-16 text-center">
                  <input
                    type="checkbox"
                    className="accent-f1-red"
                    checked={r?.dnf ?? false}
                    onChange={(ev) => set(e.id, { dnf: ev.target.checked })}
                  />
                </span>
                <span className="w-14 text-right font-bold text-zinc-300">{pts || ""}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-f1-red text-sm mt-3">{error}</p>}
      {msg && <p className="text-green-400 text-sm mt-3">{msg}</p>}

      <div className="sticky bottom-0 mt-5 -mx-4 px-4 py-3 bg-f1-dark/90 backdrop-blur border-t border-f1-line flex justify-between gap-3">
        <button className="btn-ghost" onClick={clear} disabled={saving}>
          Clear session
        </button>
        <button className="btn-primary" onClick={save} disabled={saving || hasDup}>
          {saving ? "Saving…" : `Save ${session === "SPRINT" ? "sprint" : "race"} results`}
        </button>
      </div>
    </div>
  );
}
