import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type CareerSummary } from "../api";

export default function HomePage() {
  const [careers, setCareers] = useState<CareerSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const { careers } = await api.listCareers();
      setCareers(careers);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string, name: string) {
    if (!confirm(`Delete career "${name}"? This cannot be undone.`)) return;
    await api.deleteCareer(id);
    load();
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Careers</h1>
          <p className="text-zinc-500 text-sm">Pick up a co-op season or start a new one.</p>
        </div>
        <Link to="/new" className="btn-primary">
          + New Career
        </Link>
      </div>

      {error && <p className="text-f1-red text-sm mb-4">{error}</p>}

      {careers === null ? (
        <p className="text-zinc-500">Loading…</p>
      ) : careers.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-zinc-400 mb-4">No careers yet.</p>
          <Link to="/new" className="btn-primary">
            Start your first career
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {careers.map((c) => (
            <div key={c.id} className="panel p-4 flex flex-col gap-3">
              <Link to={`/career/${c.id}`} className="block">
                <h2 className="font-bold text-lg leading-tight hover:text-f1-red transition-colors">
                  {c.name}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {c.seasonYear} season · {c.driverCount} drivers
                </p>
              </Link>
              <div className="mt-auto">
                <div className="h-1.5 bg-f1-line rounded-full overflow-hidden">
                  <div
                    className="h-full bg-f1-red"
                    style={{ width: `${(c.completedRaces / Math.max(c.totalRaces, 1)) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-zinc-500">
                    {c.completedRaces}/{c.totalRaces} races done
                  </span>
                  <button
                    onClick={() => remove(c.id, c.name)}
                    className="text-xs text-zinc-500 hover:text-f1-red"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
