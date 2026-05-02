# FundiVerify

**Nairobi's verified contractor marketplace.** FundiVerify separates the professionals from the chancers — a platform where a "Verified Pro" badge actually means something.

Built for the Nairobi home services market: plumbers, electricians, painters, tilers, roofers, carpenters, masons, fundis, HVAC technicians, and welders.

---

## What It Does

- **Homeowners** can browse verified contractors by trade and area, read job-linked reviews, post jobs, get competing quotes, and track everything from a dashboard
- **Contractors** apply to get verified, browse open jobs, submit quotes, and see their earnings + performance metrics
- **Admins** review pending verifications, manage disputes, and monitor platform health

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TanStack Query, Wouter, Tailwind CSS v4, shadcn/ui |
| Backend | Express 5, Drizzle ORM, PostgreSQL |
| Codegen | Orval (OpenAPI → React Query hooks + Zod validation schemas) |
| Charts | Recharts |
| Package management | pnpm workspaces (monorepo) |

---

## Project Structure

```
fundiversify/
├── artifacts/
│   ├── fundi-platform/          # React+Vite frontend (serves at /)
│   │   └── src/
│   │       ├── pages/           # All 11 routes
│   │       ├── components/      # Layout + shadcn/ui components
│   │       └── App.tsx          # Router
│   └── api-server/              # Express 5 API (serves at /api)
│       └── src/
│           ├── routes/          # All API route handlers
│           └── index.ts         # Server entry point
├── lib/
│   ├── api-spec/                # OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/        # Generated TanStack Query hooks
│   ├── api-zod/                 # Generated Zod validation schemas
│   └── db/                      # Drizzle ORM schema + drizzle-kit config
└── scripts/                     # Utility scripts (git push, etc.)
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero search, platform stats, featured trades |
| `/contractors` | Filterable contractor directory (trade, location, tier, verified) |
| `/contractors/:id` | Contractor profile — bio, rating, verified badge, reviews, save/book |
| `/jobs` | Job marketplace — open jobs for contractors to quote on |
| `/jobs/new` | Post a job form with live KES cost estimator |
| `/jobs/:id` | Job detail — compare quotes, accept quote, submit quote |
| `/estimate` | Standalone cost estimator — KES price range by trade, area, size |
| `/apply` | Multi-step contractor application (personal → trade → bio) |
| `/dashboard/homeowner` | Homeowner dashboard — my jobs by status, saved contractors |
| `/dashboard/contractor` | Pro dashboard — earnings chart, performance metrics |
| `/admin` | Admin panel — pending verifications, open disputes, activity feed |

---

## API Endpoints

All prefixed with `/api`:

### Contractors
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/contractors` | List with filters: trade, location, tier, minRating, verified, search |
| `POST` | `/contractors` | Create contractor application |
| `GET` | `/contractors/stats` | Platform-wide stats (verified count, top rated, by trade) |
| `GET` | `/contractors/:id` | Full profile with reviews |
| `PATCH` | `/contractors/:id` | Update contractor (verification status, subscription tier) |

### Jobs
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/jobs` | List with filters: trade, location, status, homeownerId |
| `POST` | `/jobs` | Post a new job |
| `GET` | `/jobs/summary` | Job counts by status (optionally filtered by homeownerId) |
| `GET` | `/jobs/:id` | Job detail with quotes, review, dispute |
| `PATCH` | `/jobs/:id` | Update job status |

### Quotes
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/quotes` | Submit a quote on a job |
| `GET` | `/quotes/job/:jobId` | All quotes for a job |
| `PATCH` | `/quotes/:id` | Accept or reject a quote |

### Reviews
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/reviews` | Create a review (recalculates contractor rating) |
| `GET` | `/reviews/contractor/:contractorId` | Reviews for a contractor |

### Disputes
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/disputes` | List disputes (filterable by status) |
| `POST` | `/disputes` | Raise a dispute on a job |
| `PATCH` | `/disputes/:id` | Update dispute status (under_review / resolved) |

### Saved Contractors
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/saved-contractors` | Get saved contractors for a homeowner |
| `POST` | `/saved-contractors` | Save a contractor |
| `DELETE` | `/saved-contractors/:contractorId` | Unsave a contractor |

### Utility
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/trades` | List all trades with contractor counts |
| `GET` | `/estimate` | KES cost estimate by trade, location, size |
| `GET` | `/dashboard/stats` | Admin platform stats |
| `GET` | `/dashboard/contractor/:contractorId` | Contractor earnings dashboard |

---

## Database Schema

Six tables managed by Drizzle ORM:

```
contractors       — profile, trade, location, verification, rating, portfolio
jobs              — homeowner jobs with status lifecycle (open→quoted→in_progress→completed)
quotes            — contractor quotes on jobs (pending→accepted/rejected)
reviews           — verified reviews linked to completed jobs
disputes          — job disputes (open→under_review→resolved)
saved_contractors — homeowner bookmarks (unique homeownerId+contractorId)
```

### Contractor Status Lifecycle
```
pending → verified | rejected   (admin action)
free    → pro                   (subscription upgrade)
```

### Job Status Lifecycle
```
open → quoted → in_progress → completed
              ↘ disputed
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database (DATABASE_URL env var)

### Install
```bash
pnpm install
```

### Environment Variables
```
DATABASE_URL=         # PostgreSQL connection string
SESSION_SECRET=       # Session signing secret
GITHUB_PERSONAL_ACCESS_TOKEN=  # For automated GitHub pushes
```

### Run codegen (after changing OpenAPI spec)
```bash
pnpm --filter @workspace/api-spec run codegen
```

### Push DB schema
```bash
pnpm --filter @workspace/db run push
```

### Development

Both services start via their respective workflows:
- **API Server**: builds with esbuild, starts on `$PORT`
- **Frontend**: Vite dev server on `$PORT`

A reverse proxy routes `/api` → API server and `/` → frontend automatically.

### Seed data
The database is pre-seeded with:
- 10 contractors (8 verified, 2 pending) across all trades
- 10 jobs in various statuses across Nairobi neighbourhoods
- 10 quotes (accepted, pending, rejected)
- 10 verified reviews with authentic Nairobi context

---

## Codegen Flow

The API contract is defined once in `lib/api-spec/openapi.yaml` (OpenAPI 3.1). Orval generates:

1. **`lib/api-client-react/src/generated/api.ts`** — TanStack Query hooks for every endpoint
2. **`lib/api-zod/src/generated/api.ts`** — Zod validation schemas for request/response validation

After editing `openapi.yaml`, run:
```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Automated GitHub Sync

A push script at `scripts/src/github-push.ts` can be run to sync local changes to GitHub:

```bash
pnpm --filter @workspace/scripts run push
```

---

## Roadmap

### Phase 2 — Trust & Auth
- [ ] Replit Auth / Clerk integration for real user accounts
- [ ] Role-based access (homeowner vs contractor vs admin)
- [ ] Phone number verification via Africa's Talking SMS
- [ ] M-Pesa payment integration (escrow model)

### Phase 3 — Marketplace Depth
- [ ] Portfolio photo uploads (object storage)
- [ ] In-app messaging between homeowner and contractor
- [ ] Job completion confirmation flow (both parties confirm)
- [ ] Contractor Pro subscription with Stripe/M-Pesa
- [ ] Push notifications (web push)

### Phase 4 — Trust Infrastructure
- [ ] ID verification API integration (NIIMS/Huduma Namba lookup)
- [ ] Background check integration
- [ ] Contractor insurance tracking
- [ ] Dispute resolution workflow with evidence uploads
- [ ] Automated rating recalculation on dispute resolution

### Phase 5 — Growth
- [ ] SEO-optimised contractor profile pages
- [ ] Neighbourhood-level search (lat/lng + radius)
- [ ] WhatsApp bot for job notifications
- [ ] Contractor mobile app (Expo)
- [ ] Analytics dashboard for platform operators

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes following conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
4. Open a pull request

---

## License

MIT © FundiVerify 2026
