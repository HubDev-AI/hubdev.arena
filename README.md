# HubDev Arena

HubDev Arena is a weekly challenge platform for AI-built apps. Builders submit one app per week, voters sign in to vote, and the weekly leaderboard updates live with head-to-head ELO scoring.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase for auth, Postgres, storage, and SQL functions
- Vercel for hosting and analytics

## Prerequisites

- [Bun](https://bun.sh) (v1.2+)
- [Docker](https://docs.docker.com/get-docker/) (for Supabase local stack)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (v2.70+)

## Getting started

```bash
make setup     # install deps + create .env.local from example
make start     # start Supabase local stack (Postgres, Auth, Storage, Studio)
make db-reset  # apply migrations + seed data
make dev       # start Next.js dev server at http://localhost:3000
```

Supabase Studio is available at `http://localhost:54323` after `make start`.

## Environment variables

Copy `.env.local.example` to `.env.local` (done automatically by `make setup`):

| Variable | Description | Local default |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Local demo key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Local demo key |
| `NEXT_PUBLIC_SITE_URL` | App URL | `http://localhost:3000` |
| `HUBDEV_DATA_MODE` | `mock` or `supabase` | `supabase` |
| `HUBDEV_COOKIE_SECRET` | Cookie signing secret | Local placeholder |
| `HUBDEV_FINGERPRINT_SECRET` | Fingerprint hashing secret | Local placeholder |
| `ADMIN_ALLOWLIST` | Comma-separated admin emails | `admin@example.com` |
| `SEC4_INTERNAL_BASE_URL` | Optional sec4 vote engine URL | — |
| `SEC4_INTERNAL_TOKEN` | Optional sec4 auth token | — |

## Make targets

```
make help        Show available targets
make setup       Install deps + create .env.local from example
make start       Start Supabase local stack
make stop        Stop Supabase local stack
make dev         Start Next.js dev server
make db-reset    Reset DB: apply migrations + seed data
make test        Run unit + integration tests
make test-watch  Run tests in watch mode
make test-e2e    Run Playwright E2E tests
make lint        Run ESLint
make typecheck   Run TypeScript type checking
make build       Production build
make clean       Stop Supabase and remove build artifacts
```

## Verification

```bash
make test        # unit + integration tests
make typecheck   # TypeScript
make lint        # ESLint
make build       # production build
```

## Domain

Primary brand domain: `hubdev.ai`
