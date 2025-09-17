### Live Demo Execution Plan (Bun-first)

This document defines the Bun-first architecture and step-by-step plan to build and operate the public live demo of Clinic Run. We will strictly use Bun for package management and scripts, deploy each layer to a different free provider, and provision per-visitor isolated demo data.

---

## Goals

- Different providers per layer: Frontend (Vercel), Backend (Cloudflare Workers), Database (Turso)
- Per-visitor fresh demo data via ephemeral DB branches
- Zero-cost providers (free tiers); no credit card on backend provider
- Dedicated branch: `live-demo`

## Architecture

- Frontend: Vercel (static SPA build from `src/`).
- Backend: Cloudflare Workers (Hono + tRPC adapter for fetch/Workers).
- Database: Turso (libSQL over HTTP with database branching).

Request flow:

1. Frontend calls `POST /demo/init` on the Worker.
2. Worker creates a Turso branch `demo_{shortId}`, runs migrations + seed on that branch, and returns a short-lived `demoToken` (JWT) containing branch and expiry.
3. Frontend stores token in memory/sessionStorage and includes it in `Authorization` for subsequent API calls.
4. Worker middleware validates token and attaches a Drizzle client bound to the branch for the request lifecycle.
5. Nightly cleanup (GitHub Actions) prunes expired `demo_*` branches.

## Bun-first Rules

- Use Bun for package management and scripts: `bun add`, `bun run`, `bun x`.
- Replace any node-based CLIs with `bun x <cli>`.
- Keep existing `bun run` scripts in root and `lib/` packages.

## Changes to Implement

1. Backend Worker entry (`lib/server.worker.ts`)
    - Hono app, CORS, Better Auth handler, tRPC fetch adapter, static-free (no assets).
    - `POST /demo/init` route.
2. Per-request DB selection
    - Extract DB factory to create Drizzle from `@libsql/client/web` per Turso branch URL.
    - Inject `ctx.db` in tRPC context based on `demoToken`.
3. Seed and migrations
    - Refactor `lib/db/seed.ts` to export `seedDatabase(db)` using an injected db client.
    - Add Bun scripts to run Drizzle migrations against a provided database URL.
4. Demo token security
    - Sign with `DEMO_JWT_SECRET`, default TTL 30 minutes.
    - Rate-limit `/demo/init` by IP.
5. Cleanup automation
    - GitHub Actions workflow (nightly) uses Turso CLI via `bun x` to prune branches.
6. Documentation & DX
    - This plan file; environment variables; deployment commands; rollback notes.

## Environment Variables

- Frontend (Vercel)
    - `VITE_API_URL` → `https://<your-worker-subdomain>.workers.dev`
- Backend (Cloudflare Workers secrets)
    - `TURSO_ORG`, `TURSO_DB`, `TURSO_AUTH_TOKEN`
    - `DEMO_JWT_SECRET`
    - `DEMO_SESSION_TTL_MINUTES` (optional, default 30)
- GitHub Actions
    - `TURSO_AUTH_TOKEN`, `TURSO_ORG`, `TURSO_DB`

### Cloudflare Wrangler configuration (JSONC)

- We use a single JSON config file at the repo root: `wrangler.jsonc` (replaces TOML).
- Points `main` to `lib/server.worker.ts` and enables observability.
- Secrets are set via CLI and are not stored in the JSON config.

`wrangler.jsonc` key fields:

- `name`: Cloudflare Worker name (clinic-run-live-demo)
- `main`: entry (lib/server.worker.ts)
- `compatibility_date`: recent date
- `vars`: optional non-secret vars

## Implementation Steps (Bun commands)

Step 0 — Create branch

```bash
bun run -e "git checkout -b live-demo && git push -u origin live-demo"
```

Step 1 — Add Worker runtime deps

```bash
bun add hono @trpc/server superjson jose @libsql/client drizzle-orm
```

Step 1.1 — Wrangler setup (JSONC) and backend scripts

- Confirm `wrangler.jsonc` exists at repo root.
- Backend package scripts (in `lib/package.json`):

```json
{
	"scripts": {
		"worker:dev": "bun x wrangler dev --local --persist .",
		"worker:deploy": "bun x wrangler deploy",
		"worker:secrets": "bun x wrangler secret list | cat"
	}
}
```

Step 2 — Worker entry + routing

- Create `lib/server.worker.ts` using Hono on Workers runtime.
- Add `POST /demo/init`.
- Mount tRPC under `/api/trpc/*` using `fetchRequestHandler`.

Step 3 — DB factory (Workers)

- Create `lib/db/factory.ts` exporting `createDbForUrl(url: string)` using `@libsql/client/web` and `drizzle`.
- Update `lib/trpc.ts` to detect `demoToken` and build `ctx.db` per request.

Step 4 — Refactor seed

- Change `seedDatabase` to `seedDatabase(db)`; remove singleton db import.
- Ensure auth adapter can accept injected db when seeding (or use direct inserts for seed).

Step 5 — `/demo/init`

- Generate `demo_{id}`.
- Create branch via Turso HTTP API.
- Run migrations with Drizzle against branch URL (Bun-executed).
- Seed with `seedDatabase(db)`.
- Return signed `demoToken` with TTL.

Step 6 — Rate limit

- Implement simple IP bucket in Durable Object-like KV alternative:
    - For MVP, use in-memory Map with eviction; acceptable for demo.

Step 7 — Cleanup job

- Add `.github/workflows/cleanup-demo-branches.yml` running nightly:
    - List `demo_*` branches.
    - Drop branches older than N hours.
    - Needs repo secrets: `TURSO_ORG`, `TURSO_DB`, `TURSO_AUTH_TOKEN`.

Step 8 — Frontend wiring

- Configure `VITE_API_URL` to Workers URL on Vercel project for `live-demo` branch.
- On first unauthenticated load, call `/demo/init` and store token; attach on tRPC client calls.

## Deployment

- Backend: Cloudflare Workers via `bun x wrangler deploy`.
- Frontend: Vercel auto-deploys branch; set env var.
- Database: Turso free tier; no deploy; just branches.

Cloudflare Workers secrets to set (Bun):

```bash
bun x wrangler secret put TURSO_ORG
bun x wrangler secret put TURSO_DB
bun x wrangler secret put TURSO_AUTH_TOKEN
bun x wrangler secret put DEMO_JWT_SECRET
# optional
bun x wrangler secret put DEMO_SESSION_TTL_MINUTES
```

Local development for Workers:
Create a `.dev.vars` file at the repo root (used by `wrangler dev`):

```
TURSO_ORG=your-org
TURSO_DB=clinic-demo
TURSO_AUTH_TOKEN=xxxx
DEMO_JWT_SECRET=some-random-string
DEMO_SESSION_TTL_MINUTES=30
```

Turso provisioning (Bun exec of Turso CLI):

```bash
# Install/login
bun x @turso/db auth signup
bun x @turso/db auth login

# Create base DB (if not exists)
bun x @turso/db db create clinic-demo

# Admin token used by Workers + cleanup job
bun x @turso/db db tokens create clinic-demo --write
```

Vercel environment (frontend):

```bash
# After `vercel link`, set the API URL (Workers public URL)
bun x vercel env add VITE_API_URL
# Paste: https://<your-worker>.workers.dev
```

GitHub Actions repository secrets (for cleanup workflow):

- `TURSO_ORG`
- `TURSO_DB`
- `TURSO_AUTH_TOKEN`

## Rollback

- Revert to previous deployment on Vercel and Workers.
- Delete any `demo_*` branches created after rollback point.

## Acceptance Criteria

- Each new visitor receives unique demo data.
- Providers are distinct and on free tiers.
- App functions end-to-end with token-bound DBs.
- Nightly cleanup reduces stale branches.

## Risks & Mitigations

- Turso branch sprawl → nightly cleanup + TTL.
- Worker cold starts → minimal; keep bundle small.
- Seed time too long → reduce dataset volume for demo.

## Tracking

We will track progress via TODOs in this repo and check off upon completion. Adhere to this plan during implementation.
