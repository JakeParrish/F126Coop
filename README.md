# F1CoopSim 🏁

A co-op **F1 26 (2026 regulations)** career-mode tracker. Start a shared career,
import the real 2026 calendar and grid, replace any real driver with a human
player, enter race results, and let points + standings update automatically —
including **Sprint weekends**.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind (`client/`)
- **Backend:** Node + Express + Prisma (`server/`)
- **Database:** PostgreSQL
- **Deploy:** Railway (single service serves the API + built frontend)

## Features

- Real F1 26 grid: **11 teams / 22 drivers** (Cadillac & Audi included), fully editable per career.
- Real **2026 calendar**: 24 rounds, 6 sprint weekends pre-flagged (China, Miami, Canada, Britain, Netherlands, Singapore).
- Create a career and **replace any seat with a custom player** — team and car number carry over.
- Enter finishing positions + DNFs; **points are auto-assigned** (2026 system, no fastest-lap point).
- Toggle any round as a **Sprint weekend**; sprint points (8-7-6-5-4-3-2-1) are added on top.
- Live **Drivers' and Constructors' championships**.

## Local development

Requires Node 20+ and a PostgreSQL database.

```bash
# 1. install everything (root + both workspaces)
npm install

# 2. point the server at your database
cp .env.example server/.env
#   edit server/.env -> set DATABASE_URL

# 3. create tables + seed the F1 26 roster
npm run db:push --workspace server   # or: npm --workspace server run db:push
npm run db:seed

# 4. run client + server together
npm run dev
```

- Client dev server: http://localhost:5173 (proxies `/api` to the server)
- API server: http://localhost:3000

## Deploy to Railway

1. Push this repo to GitHub (`F1CoopSim`).
2. In Railway: **New Project → Deploy from GitHub repo**, pick `F1CoopSim`.
3. Add a **PostgreSQL** plugin to the project. Railway injects `DATABASE_URL` automatically.
4. Railway reads `railway.json`:
   - **Build:** `npm run build` (builds client + server)
   - **Start:** `npm run start` (runs `prisma db push`, seeds the roster, then serves)
5. If the build skips dev dependencies, set a service variable
   **`NPM_CONFIG_PRODUCTION=false`** so Vite/Prisma/TypeScript are available at build time.

The single service serves the built React app and the `/api` routes from the same origin.

## Project layout

```
client/   React + Vite + Tailwind UI
server/   Express API + Prisma
  prisma/schema.prisma   data model
  src/data/f126.ts       F1 26 grid + 2026 calendar (edit here to update seed data)
  src/points.ts          2026 points tables
  src/standings.ts       championship computation
```

> Unofficial fan project. Not affiliated with Formula 1, the FIA, or EA Sports.
