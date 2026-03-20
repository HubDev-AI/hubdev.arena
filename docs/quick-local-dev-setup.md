---
status: ready
type: config
created: 2026-03-15
---
# Quick: local-dev-setup

## Change Description
Set up a complete local development environment using the Supabase CLI, bun (replacing npm), and a Makefile. Update README to reflect the new workflow. The project has a Supabase migration and seed file but no local stack configuration. This task:

1. Switches the package manager from npm to **bun** (remove `package-lock.json`, generate `bun.lock`)
2. Creates `supabase/config.toml` for `supabase start`
3. Creates `.env.local.example` with all required env vars pre-filled with Supabase local defaults
4. Creates a `Makefile` wrapping all common dev commands using bun
5. Updates `README.md` with bun-based setup instructions, Makefile usage, and Supabase local stack docs

No Docker Compose file needed — `supabase start` manages its own containers.

## Affected Files
- `supabase/config.toml`: Supabase local config (project name, ports, auth settings)
- `.env.local.example`: All env vars from `src/lib/env.ts`, pre-filled with Supabase local defaults
- `Makefile`: Developer workflow commands using bun (setup, start, stop, db-reset, dev, test, lint, build, typecheck)
- `README.md`: Rewrite local development and verification sections for bun + Makefile + Supabase local
- `.gitignore`: Add `!.env.local.example` exception so the template is tracked
- `package-lock.json`: Remove (replaced by bun.lock)

## Acceptance Criteria
### AC-1: Bun replaces npm
Given the project root / When developer runs `bun install` / Then dependencies install and `bun.lock` is generated

### AC-2: Supabase local stack starts
Given `supabase/config.toml` exists / When developer runs `make setup && make start` / Then Supabase local stack starts with Postgres, Auth, Storage, and Studio available

### AC-3: Migrations and seed apply
Given the local stack is running / When developer runs `make db-reset` / Then the migration is applied and seed data is loaded

### AC-4: Environment template works
Given `.env.local.example` exists / When developer copies it to `.env.local` / Then `bun run dev` connects to the local Supabase instance (auto-detected as supabase mode)

### AC-5: Makefile covers full workflow
Given the Makefile exists / When developer runs `make help` / Then all targets are listed: setup, start, stop, dev, db-reset, test, lint, build, typecheck

### AC-6: README is accurate
Given the README / When a new developer reads it / Then they can set up and run the project using only the README instructions

## must_haves
truths: ["All Makefile targets use bun, not npm", "README documents make targets and Supabase local setup", ".env.local.example contains all env vars from src/lib/env.ts with local defaults", ".env.local.example is git-tracked via .gitignore exception", "package-lock.json is removed"]
artifacts: ["supabase/config.toml", ".env.local.example", "Makefile", "bun.lock", "README.md"]
key_links: ["supabase start", "supabase db reset", "NEXT_PUBLIC_SUPABASE_URL", "bun run", "make help"]

## Detected Conventions
- Env validation via Zod in `src/lib/env.ts` with vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL, SEC4_INTERNAL_BASE_URL, SEC4_INTERNAL_TOKEN, ADMIN_ALLOWLIST, HUBDEV_DATA_MODE, HUBDEV_COOKIE_SECRET, HUBDEV_FINGERPRINT_SECRET
- Auto-detects `mock` vs `supabase` mode based on env var presence
- Existing migration at `supabase/migrations/20260310213200_init_vibecode_arena.sql`
- Seed at `supabase/seed.sql` (upsert-safe with ON CONFLICT)
- .gitignore has `.env*` glob which blocks `.env.local.example` — needs `!` exception
- Package scripts: dev, build, lint, test, typecheck, test:e2e
