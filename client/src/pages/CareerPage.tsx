import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type CareerDetail, type Entrant, type Race } from "../api";
import TrackMap from "../components/TrackMap";
import Avatar from "../components/Avatar";
import TeamLogo from "../components/TeamLogo";
import DriverPortrait from "../components/DriverPortrait";
import RosterEditor from "../components/RosterEditor";
import Flag from "../components/Flag";
import { countryIso, driverKey, nationalityIso, raceDateRange } from "../lib/ui";
import type { DriverStanding } from "../api";

const TABS = ["calendar", "drivers", "constructors", "roster"] as const;
type Tab = (typeof TABS)[number];

export default function CareerPage() {
  const { slug, tab: tabParam } = useParams();
  const [data, setData] = useState<CareerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lower = (tabParam ?? "").toLowerCase();
  const tab: Tab = (TABS as readonly string[]).includes(lower) ? (lower as Tab) : "calendar";

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      setData(await api.getCareer(slug));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-f1-red">{error}</p>;
  if (!data) return <p className="text-zinc-500">Loading…</p>;

  const { career, standings } = data;
  const done = career.races.filter((r) => r.status === "COMPLETED").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← All careers
          </Link>
          <h1 className="text-2xl font-extrabold mt-1">{career.name}</h1>
          <p className="text-zinc-500 text-sm">
            {career.seasonYear} · {done}/{career.races.length} races complete
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-f1-panel border border-f1-line rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <Link
            key={t}
            to={`/career/${slug}/${t}`}
            className={`tab capitalize ${tab === t ? "bg-f1-red text-white" : "text-zinc-400 hover:text-white"}`}
          >
            {t}
          </Link>
        ))}
      </div>

      {tab === "calendar" && <Calendar career={career} />}
      {tab === "drivers" && (
        <DriverStandings standings={standings} slug={career.slug ?? career.id} />
      )}
      {tab === "constructors" && <ConstructorStandings standings={standings} />}
      {tab === "roster" && <RosterEditor career={career} onSaved={load} />}
    </div>
  );
}

function Calendar({ career }: { career: CareerDetail["career"] }) {
  const entrantById = new Map<string, Entrant>(career.entrants.map((e) => [e.id, e]));
  const slug = career.slug ?? career.id;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {career.races.map((r) => {
        const done = r.status === "COMPLETED";
        const podium = podiumOf(r, entrantById);
        return (
          <Link
            key={r.id}
            to={`/career/${slug}/race/${r.round}`}
            className="panel flex flex-col hover:border-f1-red/60 transition-colors overflow-hidden"
          >
            <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
              <span className="font-mono text-[11px] text-zinc-500 tracking-widest">
                ROUND {r.round}
              </span>
              <span className="flex items-center gap-2">
                {r.isSprint && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                    SPRINT
                  </span>
                )}
                <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">
                  🏁 {raceDateRange(r.date)}
                </span>
              </span>
            </div>

            <div className="px-4">
              <div className="text-xl font-extrabold flex items-center gap-2 leading-tight">
                <Flag iso={countryIso(r.country)} className="h-5" />
                {r.country}
              </div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wide mt-0.5">
                {r.name}
              </div>
            </div>

            <div className="px-4 py-3 mt-auto">
              {done && podium[0] ? (
                <Podium podium={podium} race={r} />
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <TrackMap round={r.round} color="#6b7280" strokeWidth={22} className="h-full w-full" />
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const MEDALS = ["ST", "ND", "RD"];

// F1-style podium boxes: rank tab, headshot, code, and race points.
function Podium({ podium, race }: { podium: (Entrant | undefined)[]; race: Race }) {
  const ptsFor = (id: string) =>
    race.results.find((x) => x.session === "RACE" && x.entrantId === id)?.points ?? 0;

  return (
    <div className="flex gap-1.5">
      {podium.map((p, idx) => (
        <div
          key={idx}
          className="flex-1 min-w-0 border border-f1-line rounded-md flex items-stretch overflow-hidden bg-f1-dark/40"
          title={p ? `P${idx + 1} · ${p.name}` : undefined}
        >
          <div className="bg-f1-line/50 px-1.5 flex flex-col items-center justify-center leading-none">
            <span className="text-xs font-extrabold">{idx + 1}</span>
            <span className="text-[7px] font-bold text-zinc-400">{MEDALS[idx]}</span>
          </div>
          <div className="flex items-center gap-1.5 px-1.5 py-1.5 min-w-0">
            {p ? (
              <Avatar name={p.name} code={p.code} teamColor={p.team.color} imageUrl={p.imageUrl} size={30} />
            ) : (
              <span className="w-[30px] h-[30px] rounded-full bg-f1-line shrink-0" />
            )}
            <div className="min-w-0 leading-tight">
              <div className="text-[11px] font-bold truncate">{p?.code ?? "—"}</div>
              {p && <div className="text-[9px] text-zinc-500">{ptsFor(p.id)} pts</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// The Grand Prix podium (P1, P2, P3) — entries may be undefined if not entered.
function podiumOf(race: Race, byId: Map<string, Entrant>): (Entrant | undefined)[] {
  return [1, 2, 3].map((pos) => {
    const r = race.results.find((x) => x.session === "RACE" && x.position === pos && !x.dnf);
    return r ? byId.get(r.entrantId) : undefined;
  });
}

function DriverStandings({
  standings,
  slug,
}: {
  standings: CareerDetail["standings"];
  slug: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {standings.drivers.map((d, i) => (
        <DriverCard key={d.entrantId} d={d} rank={i + 1} slug={slug} />
      ))}
    </div>
  );
}

// F1.com-style driver card: team-colour gradient, name, number, flag, headshot.
function DriverCard({ d, rank, slug }: { d: DriverStanding; rank: number; slug: string }) {
  const color = d.teamColor;
  const [first, ...rest] = d.name.split(" ");
  const last = rest.join(" ");
  const nat = nationalityIso(d.code);

  return (
    <Link
      to={`/career/${slug}/driver/${driverKey(d.name)}`}
      className="relative rounded-xl overflow-hidden border border-f1-line hover:border-white/30 transition-colors"
      style={{ background: `linear-gradient(105deg, ${color} 0%, ${color}cc 42%, #0B0B0F 96%)` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/5 to-transparent" />

      <div className="absolute top-2 right-2 z-10 text-right text-white bg-black/40 rounded-md px-1.5 py-0.5 backdrop-blur-sm">
        <div className="text-[10px] font-bold opacity-90 leading-none">P{rank}</div>
        <div className="text-base font-extrabold leading-none mt-0.5">
          {d.points}
          <span className="text-[9px] font-semibold opacity-80 ml-0.5">PTS</span>
        </div>
      </div>

      <div className="relative flex items-end justify-between gap-1 px-3 pt-3 h-36">
        <div className="text-white drop-shadow pb-1">
          <div className="text-sm font-light leading-none">{first}</div>
          <div className="text-xl font-extrabold leading-tight">{last || first}</div>
          <div className="text-[11px] opacity-90 mt-0.5">{d.teamName}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-extrabold italic">{d.number}</span>
            {nat && <Flag iso={nat} className="h-4" />}
            {d.isPlayer && (
              <span className="text-[9px] font-bold px-1 rounded bg-white/20">YOU</span>
            )}
          </div>
        </div>
        <DriverPortrait
          name={d.name}
          code={d.code}
          teamColor={color}
          imageUrl={d.imageUrl}
          height={132}
          className="self-end max-w-[48%]"
        />
      </div>
    </Link>
  );
}

function ConstructorStandings({ standings }: { standings: CareerDetail["standings"] }) {
  const max = Math.max(1, ...standings.constructors.map((c) => c.points));
  return (
    <div className="space-y-2">
      {standings.constructors.map((c, i) => (
        <div key={c.teamId} className="panel px-4 py-3 flex items-center gap-3">
          <span className="font-mono text-zinc-500 w-6">{i + 1}</span>
          <span
            className="w-1.5 h-8 rounded-sm"
            style={{ background: c.teamColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-2">
                <TeamLogo name={c.teamName} color={c.teamColor} size={22} />
                {c.teamName}
              </span>
              <span className="font-bold">{c.points}</span>
            </div>
            <div className="h-1.5 bg-f1-line rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full"
                style={{ width: `${(c.points / max) * 100}%`, background: c.teamColor }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
