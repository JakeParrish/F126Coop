import { Link, Outlet } from "react-router-dom";
import { useAuth } from "./auth";

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-f1-line sticky top-0 z-20 bg-f1-dark/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="inline-block w-2.5 h-6 bg-f1-red rounded-sm" />
            <span className="text-lg">
              F1<span className="text-f1-red">Coop</span>Sim
            </span>
            <span className="text-xs font-medium text-zinc-500 ml-1">2026</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/new" className="btn-primary text-xs">
              + New Career
            </Link>
            <AuthControls />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-f1-line text-center text-xs text-zinc-600 py-4">
        F1CoopSim · unofficial co-op career tracker · not affiliated with Formula 1 or EA
      </footer>
    </div>
  );
}

const DISCORD = "#5865F2";

function AuthControls() {
  const { user, enabled, loading, login, logout } = useAuth();
  if (loading || !enabled) return null;

  if (!user) {
    return (
      <button
        onClick={login}
        className="btn text-xs text-white"
        style={{ background: DISCORD }}
      >
        Log in with Discord
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full" />
      <span className="text-sm font-medium hidden sm:inline">
        {user.name}
        {user.isAdmin && <span className="text-[10px] text-f1-red font-bold ml-1">ADMIN</span>}
      </span>
      <button onClick={logout} className="text-xs text-zinc-500 hover:text-zinc-300">
        Log out
      </button>
    </div>
  );
}
