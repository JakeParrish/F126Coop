import { useEffect, useState } from "react";
import { api, type CareerDetail, type ClaimUser, type Entrant, type Team } from "../api";
import Avatar from "./Avatar";
import TeamLogo from "./TeamLogo";
import { useAuth } from "../auth";
import { COUNTRIES } from "../lib/ui";

interface Row {
  name: string;
  code: string;
  number: number;
  imageUrl: string | null;
  isPlayer: boolean;
  nationality: string | null;
}

// Edit the seats of an existing career: rename, renumber, set a photo, or mark
// a seat as a human player. Saved one seat at a time.
export default function RosterEditor({
  career,
  onSaved,
}: {
  career: CareerDetail["career"];
  onSaved: () => Promise<void>;
}) {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;
  const entrantById = new Map<string, Entrant>(career.entrants.map((e) => [e.id, e]));

  const [users, setUsers] = useState<ClaimUser[]>([]);
  useEffect(() => {
    if (isAdmin) {
      api
        .listUsers()
        .then((r) => setUsers(r.users))
        .catch(() => {});
    }
  }, [isAdmin]);

  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      career.entrants.map((e) => [
        e.id,
        {
          name: e.name,
          code: e.code,
          number: e.number,
          imageUrl: e.imageUrl,
          isPlayer: e.isPlayer,
          nationality: e.nationality,
        },
      ])
    )
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Numbers used more than once across the (locally edited) grid.
  const counts = new Map<number, number>();
  for (const r of Object.values(rows)) counts.set(r.number, (counts.get(r.number) ?? 0) + 1);
  const dupNumbers = new Set([...counts.entries()].filter(([, n]) => n > 1).map(([n]) => n));

  function set(id: string, patch: Partial<Row>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    setSavedId(null);
    setError(null);
  }

  async function save(id: string) {
    const r = rows[id];
    if (!r.name.trim() || !r.code.trim()) return setError("Name and code are required.");
    if (dupNumbers.has(r.number)) return setError("That car number is already used on the grid.");
    setSavingId(id);
    setError(null);
    try {
      const { entrant } = await api.updateEntrant(career.id, id, {
        name: r.name.trim(),
        code: r.code.trim().toUpperCase(),
        number: r.number,
        imageUrl: r.imageUrl && r.imageUrl.trim() ? r.imageUrl.trim() : null,
        isPlayer: r.isPlayer,
        nationality: r.isPlayer ? r.nationality || "us" : null,
      });
      // Sync the row from the server response (e.g. a reverted player is
      // restored to the original driver's name/code/number/photo).
      setRows((prev) => ({
        ...prev,
        [id]: {
          name: entrant.name,
          code: entrant.code,
          number: entrant.number,
          imageUrl: entrant.imageUrl,
          isPlayer: entrant.isPlayer,
          nationality: entrant.nationality,
        },
      }));
      setSavedId(id);
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  async function assign(id: string, userId: string | null) {
    setSavingId(id);
    setError(null);
    try {
      await api.assignDriver(career.id, id, userId);
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  // Group seat ids by team, preserving grid order.
  const groups: { team: Team; ids: string[] }[] = [];
  const idx = new Map<string, number>();
  for (const e of career.entrants) {
    let i = idx.get(e.teamId);
    if (i === undefined) {
      i = groups.length;
      idx.set(e.teamId, i);
      groups.push({ team: e.team, ids: [] });
    }
    groups[i].ids.push(e.id);
  }

  return (
    <div className="space-y-4">
      <p className="text-zinc-500 text-sm">
        Edit any seat — rename a driver, change a number or photo, or turn a seat into a player.
        Changes save per row.
      </p>
      {error && <p className="text-f1-red text-sm">{error}</p>}

      {groups.map(({ team, ids }) => (
        <div key={team.id} className="panel overflow-hidden">
          <div
            className="px-4 py-2 flex items-center gap-2 border-b border-f1-line"
            style={{ borderLeft: `4px solid ${team.color}` }}
          >
            <TeamLogo name={team.name} color={team.color} size={20} />
            <span className="font-bold">{team.name}</span>
            <span className="text-xs text-zinc-500">{team.fullName}</span>
          </div>
          <div className="divide-y divide-f1-line">
            {ids.map((id) => {
              const r = rows[id];
              const e = entrantById.get(id)!;
              const dup = dupNumbers.has(r.number);
              return (
                <div key={id} className="px-4 py-3 flex flex-wrap items-center gap-2">
                  <Avatar
                    name={r.name || r.code || "?"}
                    code={r.code || "?"}
                    teamColor={team.color}
                    imageUrl={r.imageUrl}
                    size={40}
                  />
                  <input
                    className="input flex-1 min-w-[8rem]"
                    placeholder="Driver name"
                    value={r.name}
                    onChange={(ev) => set(id, { name: ev.target.value })}
                  />
                  <input
                    className="input w-20 uppercase"
                    placeholder="ABB"
                    maxLength={4}
                    value={r.code}
                    onChange={(ev) => set(id, { code: ev.target.value.toUpperCase() })}
                  />
                  <input
                    className={`input w-20 ${dup ? "border-f1-red text-f1-red" : ""}`}
                    type="number"
                    value={r.number}
                    onChange={(ev) => set(id, { number: Number(ev.target.value) })}
                  />
                  {r.isPlayer && (
                    <>
                      <input
                        className="input w-full sm:flex-1 sm:min-w-[10rem]"
                        placeholder="Photo URL (optional)"
                        value={r.imageUrl ?? ""}
                        onChange={(ev) => set(id, { imageUrl: ev.target.value || null })}
                      />
                      <select
                        className="input w-full sm:w-44"
                        value={r.nationality ?? "us"}
                        onChange={(ev) => set(id, { nationality: ev.target.value })}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.iso} value={c.iso}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  <label className="text-xs text-zinc-400 flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="accent-f1-red"
                      checked={r.isPlayer}
                      onChange={(ev) => set(id, { isPlayer: ev.target.checked })}
                    />
                    Player
                  </label>
                  <button
                    className="btn-ghost text-xs"
                    disabled={savingId === id || dup}
                    onClick={() => save(id)}
                  >
                    {savingId === id ? "Saving…" : savedId === id ? "Saved ✓" : "Save"}
                  </button>
                  {e.replacedDriver && r.isPlayer && (
                    <span className="text-[11px] text-zinc-600 w-full">replaces {e.replacedDriver}</span>
                  )}
                  {isAdmin && r.isPlayer && (
                    <div className="w-full flex items-center gap-2 text-xs text-zinc-400 mt-1">
                      <span>Assign to:</span>
                      <select
                        className="input text-xs py-1"
                        value={e.claimedBy?.id ?? ""}
                        disabled={savingId === id}
                        onChange={(ev) => assign(id, ev.target.value || null)}
                      >
                        <option value="">— unassigned —</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                      {e.claimedBy && (
                        <img src={e.claimedBy.avatarUrl} alt={e.claimedBy.name} className="w-5 h-5 rounded-full" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
