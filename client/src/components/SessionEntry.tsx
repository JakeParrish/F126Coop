import { useEffect, useMemo, useState } from "react";
import { api, type Entrant, type Race, type Session, type ResultRowInput } from "../api";
import Avatar from "./Avatar";

const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

export function pointsFor(session: Session, position: number | null, dnf: boolean) {
  if (dnf || !position || position < 1) return 0;
  const table = session === "SPRINT" ? SPRINT_POINTS : RACE_POINTS;
  return table[position - 1] ?? 0;
}

interface Props {
  careerId: string; // the career's real id (cuid), used for API calls
  race: Race;
  session: Session;
  entrants: Entrant[];
  onSaved: () => Promise<void>; // refresh parent data after a save/clear
  onDone?: () => void; // called after the "Save & …" button succeeds
  doneLabel?: string; // label for that second button
}

// The result-entry table for one session of one race. Shared by the inline
// calendar editor and the standalone race page.
export default function SessionEntry({
  careerId,
  race,
  session,
  entrants,
  onSaved,
  onDone,
  doneLabel = "Save & close",
}: Props) {
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

  // Every driver must have a position or be marked DNF before saving.
  const unclassified = entrants.filter((e) => {
    const r = rows[e.id];
    return !r?.dnf && !r?.position;
  });
  const allClassified = unclassified.length === 0;

  // Display order, frozen to the SAVED state (not live edits) so rows don't
  // jump around while you're typing/clicking: classified 1..N, then unfilled
  // (grid order), then DNFs at the bottom. Re-sorts only after a save.
  const orderedEntrants = useMemo(() => {
    const sortKey = (e: Entrant, i: number) => {
      const r = initial[e.id];
      if (r?.dnf) return 200000 + i;
      if (r?.position) return Number(r.position);
      return 100000 + i;
    };
    return entrants
      .map((e, i) => ({ e, i }))
      .sort((a, b) => sortKey(a.e, a.i) - sortKey(b.e, b.i))
      .map((x) => x.e);
  }, [entrants, initial]);

  async function save(thenDone: boolean) {
    setError(null);
    if (hasDup) return setError("Two drivers share a finishing position.");
    if (!allClassified) return setError("Every driver needs a position or DNF.");
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
      setMsg("Saved · points updated.");
      await onSaved();
      if (thenDone) onDone?.();
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
          {orderedEntrants.map((e) => {
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
                  <Avatar
                    name={e.name}
                    code={e.code}
                    teamColor={e.team.color}
                    imageUrl={e.imageUrl}
                    size={32}
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
      {hasDup && (
        <p className="text-f1-red text-sm mt-3">
          Two or more drivers share a finishing position — fix the highlighted positions to save.
        </p>
      )}
      {!allClassified && (
        <p className="text-amber-400 text-sm mt-3">
          {unclassified.length} driver{unclassified.length > 1 ? "s" : ""} need a position or DNF:{" "}
          {unclassified.slice(0, 14).map((e) => e.code).join(", ")}
          {unclassified.length > 14 ? "…" : ""}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button className="btn-ghost" onClick={clear} disabled={saving}>
          Clear session
        </button>
        <div className="flex gap-2">
          <button
            className={onDone ? "btn-ghost" : "btn-primary"}
            onClick={() => save(false)}
            disabled={saving || hasDup || !allClassified}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {onDone && (
            <button
              className="btn-primary"
              onClick={() => save(true)}
              disabled={saving || hasDup || !allClassified}
            >
              {doneLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
