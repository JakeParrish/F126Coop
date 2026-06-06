import { useEffect, useState } from "react";
import { api, type AwardKey, type Entrant, type Race } from "../api";
import Avatar from "./Avatar";
import { driverPhoto } from "../lib/ui";

const AWARDS: { key: AwardKey; label: string; icon: string }[] = [
  { key: "driverOfDayId", label: "Driver of the Day", icon: "★" },
  { key: "fastestLapId", label: "Fastest Lap", icon: "⏱" },
  { key: "mostOvertakesId", label: "Most Overtakes", icon: "⇄" },
  { key: "cleanestId", label: "Cleanest Driver", icon: "✦" },
];

// Non-scoring race awards. Each is a single driver pick, saved immediately.
export default function RaceAwards({
  careerId,
  race,
  entrants,
  onSaved,
}: {
  careerId: string;
  race: Race;
  entrants: Entrant[];
  onSaved: () => Promise<void>;
}) {
  const [vals, setVals] = useState<Record<AwardKey, string | null>>({
    driverOfDayId: race.driverOfDayId,
    fastestLapId: race.fastestLapId,
    mostOvertakesId: race.mostOvertakesId,
    cleanestId: race.cleanestId,
  });
  const [saving, setSaving] = useState<AwardKey | null>(null);

  useEffect(() => {
    setVals({
      driverOfDayId: race.driverOfDayId,
      fastestLapId: race.fastestLapId,
      mostOvertakesId: race.mostOvertakesId,
      cleanestId: race.cleanestId,
    });
  }, [race.id, race.driverOfDayId, race.fastestLapId, race.mostOvertakesId, race.cleanestId]);

  const byId = new Map(entrants.map((e) => [e.id, e]));

  async function setAward(key: AwardKey, value: string) {
    const v = value || null;
    setVals((prev) => ({ ...prev, [key]: v }));
    setSaving(key);
    try {
      await api.editRace(careerId, race.id, { [key]: v });
      await onSaved();
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {AWARDS.map(({ key, label, icon }) => {
        const sel = vals[key] ? byId.get(vals[key]!) : undefined;
        return (
          <div key={key} className="panel p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
              <span className="text-yellow-400 mr-1">{icon}</span>
              {label}
            </div>
            <div className="flex items-center gap-2 mb-2 h-9">
              {sel ? (
                <>
                  <Avatar
                    name={sel.name}
                    code={sel.code}
                    teamColor={sel.team.color}
                    imageUrl={driverPhoto(sel)}
                    useConvention={!sel.isPlayer}
                    size={34}
                  />
                  <span className="font-semibold text-sm">{sel.name}</span>
                  <span className="font-mono text-xs text-zinc-500">{sel.code}</span>
                </>
              ) : (
                <span className="text-zinc-600 text-sm">— not awarded —</span>
              )}
            </div>
            <select
              className="input w-full"
              value={vals[key] ?? ""}
              disabled={saving === key}
              onChange={(e) => setAward(key, e.target.value)}
            >
              <option value="">— none —</option>
              {entrants.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.team.name})
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
