# FundiVerify — Nairobi Contractor Platform

## Architecture

**Monorepo (pnpm workspaces)**

| Package | Location | Purpose |
|---------|----------|---------|
| `@workspace/fundi-platform` | `artifacts/fundi-platform` | React+Vite frontend at `/` |
| `@workspace/api-server` | `artifacts/api-server` | Express 5 API at `/api` |
| `@workspace/api-spec` | `lib/api-spec` | OpenAPI spec + Orval codegen config |
| `@workspace/api-client-react` | `lib/api-client-react` | Generated TanStack Query hooks |
| `@workspace/api-zod` | `lib/api-zod` | Generated Zod validation schemas |
| `@workspace/db` | `lib/db` | Drizzle ORM schema + migrations |

## Stack

- **Frontend**: React 18, Vite, TanStack Query, Wouter (routing), Tailwind CSS v4, shadcn/ui
- **Backend**: Express 5, Drizzle ORM, PostgreSQL (Replit managed)
- **Codegen**: Orval (OpenAPI → React Query hooks + Zod schemas)
- **Charts**: Recharts (contractor dashboard earnings chart)

## Key Decisions

- `indexFiles: false` on Orval Zod output — prevents duplicate export conflicts
- `lib/api-zod/src/index.ts` exports only from `"./generated/api"` — never add other exports
- Demo uses hardcoded `HOMEOWNER_ID = 1`, `CONTRACTOR_ID = 1/2` (no auth yet)
- All API routes mounted under `/api` prefix (handled by reverse proxy)
- DB schema uses `drizzle-kit push` (no migration files)

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `home.tsx` | Landing page with search, stats, featured trades |
| `/contractors` | `contractors.tsx` | Filterable contractor directory |
| `/contractors/:id` | `contractor-profile.tsx` | Profile with reviews, save, book |
| `/jobs` | `jobs.tsx` | Job marketplace with filters |
| `/jobs/new` | `post-job.tsx` | Post a job form with live cost estimator |
| `/jobs/:id` | `job-detail.tsx` | Job detail, quotes list, submit quote |
| `/estimate` | `estimate.tsx` | Standalone cost estimator |
| `/apply` | `apply.tsx` | Multi-step contractor application form |
| `/dashboard/homeowner` | `homeowner-dashboard.tsx` | My jobs + saved contractors |
| `/dashboard/contractor` | `contractor-dashboard.tsx` | Earnings chart, performance metrics |
| `/admin` | `admin.tsx` | Verify contractors, resolve disputes |

## API Endpoints

All prefixed with `/api`:

- `GET /trades` — list all trades with contractor counts
- `GET/POST /contractors` — list (filtered) / create
- `GET /contractors/stats` — platform-wide contractor stats
- `GET/PATCH /contractors/:id` — get profile with reviews / update
- `GET/POST /jobs` — list (filtered) / create
- `GET /jobs/summary` — job counts by status
- `GET/PATCH /jobs/:id` — get with quotes, review, dispute / update
- `POST /quotes` — create quote (updates job quoteCount)
- `GET /quotes/job/:jobId` — quotes for a job
- `PATCH /quotes/:id` — accept/reject quote
- `POST /reviews` — create review (recalculates contractor rating)
- `GET /reviews/contractor/:contractorId` — contractor reviews
- `GET/POST /disputes` — list / create
- `PATCH /disputes/:id` — update dispute status
- `GET/POST /saved-contractors` — list / save
- `DELETE /saved-contractors/:contractorId` — unsave
- `GET /estimate` — KES price estimate by trade/location/size
- `GET /dashboard/stats` — platform admin stats
- `GET /dashboard/contractor/:contractorId` — contractor earnings dashboard

## Database Tables

- `contractors` — all 10 seeded (8 verified, 2 pending)
- `jobs` — 10 seeded across all trades and statuses
- `quotes` — 10 seeded with accepted/pending/rejected statuses
- `reviews` — 10 seeded (all approved, tied to contractors)
- `disputes` — empty (created on demand)
- `saved_contractors` — empty (created on demand)

## Running

Both workflows start automatically:
- `artifacts/api-server: API Server` → builds + starts on port from `$PORT`
- `artifacts/fundi-platform: web` → Vite dev server on port from `$PORT`

## Codegen

```bash
pnpm --filter @workspace/api-spec run codegen
```

Regenerates `lib/api-client-react/src/generated/api.ts` and `lib/api-zod/src/generated/api.ts`.

## Color Palette

- `--primary: 153 38% 30%` — deep forest green (trust, verified)
- `--secondary: 180 50% 30%` — teal (secondary actions)
- `--background: 40 20% 98%` — warm off-white (Nairobi warmth)
- `--accent: 28 80% 52%` — orange-amber (CTAs, highlights)

## GitHub Sync

Repo: https://github.com/JBlizzard-sketch/fundiversify

Push script at `scripts/src/github-push.ts` — uses GitHub Git Trees API with inline content (no git CLI, no blob pre-upload needed, works on empty repos).

```bash
pnpm --filter @workspace/scripts run push
```

How it works:
1. If the repo is completely empty, seeds it via the Contents API (the only endpoint that accepts writes on zero-commit repos)
2. Collects all workspace files (skips node_modules, dist, .git, lock files, binaries > 2MB)
3. Builds a full Git tree with inline file content in a single API call (no per-file blob uploads)
4. Creates a commit and force-pushes the `main` ref

Run this command any time you want to sync local changes to GitHub.

## Recent Improvements

- Home page: functional search → navigates to `/contractors?search=...&location=...`, location chips, "How it Works" section, trust signals grid, contractor CTA
- Contractors page: reads initial state from URL search params (compatible with home page search redirect)
- Layout: functional mobile navigation menu with hamburger toggle, active nav highlighting, improved footer
- Post-job page: pre-fills `trade` and `location` from URL params (supports "Book This Pro" deep-link flow)
- 404 page: improved UX with clear navigation back to home/contractors
- README.md: comprehensive documentation of all endpoints, schema, roadmap
