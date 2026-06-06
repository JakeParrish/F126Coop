import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type EntrantInput, type Team } from "../api";
import Avatar from "../components/Avatar";
import { useAuth } from "../auth";

// One editable seat on the grid. Starts as the real driver; can become a player.
interface Seat extends EntrantInput {
  baseName: string; // the real driver originally in this seat
  baseCode: string;
  baseNumber: number;
  baseImage: string | null;
}

export default function NewCareerPage() {
  const nav = useNavigate();
  const { user, enabled, login } = useAuth();
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [name, setName] = useState("");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRoster()
      .then(({ teams }) => {
        setTeams(teams);
        const initial: Seat[] = [];
        for (const t of teams) {
          for (const d of t.drivers) {
            initial.push({
              teamId: t.id,
              name: d.name,
              code: d.code,
              number: d.number,
              isPlayer: false,
              replacedDriver: null,
              imageUrl: d.imageUrl,
              baseName: d.name,
              baseCode: d.code,
              baseNumber: d.number,
              baseImage: d.imageUrl,
            });
          }
        }
        setSeats(initial);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const playerCount = seats.filter((s) => s.isPlayer).length;

  // Car numbers must stay unique across the grid. A player keeps the number of
  // the driver they replaced (that seat no longer exists), but can't take a
  // number that another active driver is still using.
  const numberCounts = new Map<number, number>();
  for (const s of seats) numberCounts.set(s.number, (numberCounts.get(s.number) ?? 0) + 1);
  const dupNumbers = new Set(
    [...numberCounts.entries()].filter(([, n]) => n > 1).map(([num]) => num)
  );
  const nameForNumber = (num: number, exceptIdx: number) =>
    seats.find((s, i) => i !== exceptIdx && s.number === num)?.name ?? `#${num}`;

  function update(i: number, patch: Partial<Seat>) {
    setSeats((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  // Toggle a seat between the real driver and a custom player.
  function togglePlayer(i: number) {
    setSeats((prev) =>
      prev.map((s, idx) => {
        if (idx !== i) return s;
        if (s.isPlayer) {
          // revert to the real driver
          return {
            ...s,
            isPlayer: false,
            replacedDriver: null,
            name: s.baseName,
            code: s.baseCode,
            number: s.baseNumber,
            imageUrl: s.baseImage,
          };
        }
        return {
          ...s,
          isPlayer: true,
          replacedDriver: s.baseName,
          name: "",
          code: "",
          imageUrl: null,
        };
      })
    );
  }

  async function create() {
    setError(null);
    if (!name.trim()) return setError("Give your career a name.");
    for (const s of seats) {
      if (!s.name.trim() || !s.code.trim()) {
        return setError("Every seat needs a name and a 3-letter code.");
      }
    }
    if (dupNumbers.size > 0) {
      return setError("Two drivers share a car number — give each a unique number.");
    }
    setSaving(true);
    try {
      const entrants: EntrantInput[] = seats.map((s) => ({
        teamId: s.teamId,
        name: s.name.trim(),
        code: s.code.trim().toUpperCase(),
        number: s.number,
        isPlayer: s.isPlayer,
        replacedDriver: s.isPlayer ? s.replacedDriver : null,
        imageUrl: s.imageUrl && s.imageUrl.trim() ? s.imageUrl.trim() : null,
      }));
      const { id, slug } = await api.createCareer({ name: name.trim(), entrants });
      nav(`/career/${slug ?? id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  if (enabled && !user) {
    return (
      <div className="max-w-md mx-auto panel p-8 text-center mt-10">
        <h1 className="text-xl font-extrabold mb-2">Log in to create a career</h1>
        <p className="text-zinc-500 text-sm mb-4">
          You need to be logged in with Discord to create or edit careers.
        </p>
        <button onClick={login} className="btn text-white" style={{ background: "#5865F2" }}>
          Log in with Discord
        </button>
      </div>
    );
  }
  if (error && !teams) return <p className="text-f1-red">{error}</p>;
  if (!teams) return <p className="text-zinc-500">Loading roster…</p>;

  // Group seat indices by team for display.
  const rows: { team: Team; seatIdx: number[] }[] = [];
  teams.forEach((t) => {
    const idxs = seats.map((s, i) => (s.teamId === t.id ? i : -1)).filter((i) => i >= 0);
    rows.push({ team: t, seatIdx: idxs });
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">New Career</h1>
      <p className="text-zinc-500 text-sm mb-6">
        The full F1 26 grid is pre-loaded. Turn any seat into a player to take that driver's place —
        their team and car number stay the same.
      </p>

      <label className="block mb-1 text-sm font-semibold">Career name</label>
      <input
        className="input w-full mb-6"
        placeholder="e.g. Sunday League S1"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">Grid · {seats.length} seats</h2>
        <span className="text-xs text-zinc-500">{playerCount} player(s)</span>
      </div>

      <div className="space-y-4">
        {rows.map(({ team, seatIdx }) => (
          <div key={team.id} className="panel overflow-hidden">
            <div
              className="px-4 py-2 flex items-center gap-2 border-b border-f1-line"
              style={{ borderLeft: `4px solid ${team.color}` }}
            >
              <span className="font-bold">{team.name}</span>
              <span className="text-xs text-zinc-500">{team.fullName}</span>
            </div>
            <div className="divide-y divide-f1-line">
              {seatIdx.map((i) => {
                const s = seats[i];
                return (
                  <div key={i} className="px-4 py-3 flex flex-wrap items-center gap-2">
                    <Avatar
                      name={s.name || s.code || "?"}
                      code={s.code || "?"}
                      teamColor={team.color}
                      imageUrl={s.imageUrl}
                      size={40}
                    />
                    {s.isPlayer ? (
                      <>
                        <input
                          className="input flex-1 min-w-[8rem]"
                          placeholder="Player name"
                          value={s.name}
                          onChange={(e) => update(i, { name: e.target.value })}
                        />
                        <input
                          className="input w-20 uppercase"
                          placeholder="ABB"
                          maxLength={4}
                          value={s.code}
                          onChange={(e) => update(i, { code: e.target.value.toUpperCase() })}
                        />
                        <input
                          className={`input w-20 ${
                            dupNumbers.has(s.number) ? "border-f1-red text-f1-red" : ""
                          }`}
                          type="number"
                          value={s.number}
                          onChange={(e) => update(i, { number: Number(e.target.value) })}
                        />
                        <input
                          className="input w-full"
                          placeholder="Photo URL (optional)"
                          value={s.imageUrl ?? ""}
                          onChange={(e) => update(i, { imageUrl: e.target.value || null })}
                        />
                        <span className="text-xs w-full sm:w-auto">
                          {dupNumbers.has(s.number) ? (
                            <span className="text-f1-red">
                              #{s.number} is taken by {nameForNumber(s.number, i)}
                            </span>
                          ) : (
                            <span className="text-zinc-500">replaces {s.replacedDriver}</span>
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="flex-1 font-medium flex items-center gap-2">
                        <span className="w-8 text-sm font-mono text-zinc-500">#{s.number}</span>
                        {s.name}
                        <span className="text-zinc-500 font-mono text-xs">{s.code}</span>
                      </span>
                    )}
                    <button
                      onClick={() => togglePlayer(i)}
                      className={
                        s.isPlayer
                          ? "btn-ghost text-xs"
                          : "btn text-xs bg-f1-red/20 text-f1-red border border-f1-red/40 hover:bg-f1-red/30"
                      }
                    >
                      {s.isPlayer ? "Revert" : "Make player"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-f1-red text-sm mt-4">{error}</p>}

      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-f1-dark/90 backdrop-blur border-t border-f1-line flex justify-end gap-3">
        <button className="btn-ghost" onClick={() => nav("/")} disabled={saving}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={create}
          disabled={saving || dupNumbers.size > 0}
        >
          {saving ? "Creating…" : "Create career"}
        </button>
      </div>
    </div>
  );
}
