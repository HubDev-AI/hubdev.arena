---
status: ready
type: enhancement
created: 2026-03-15
---
# Quick: remove-mock-data

## Change Description
Create a `SupabaseArenaRepository` that implements the existing `ArenaRepository` interface using real Supabase queries via the service role client. Update `runtime.ts` to use it when `HUBDEV_DATA_MODE=supabase`. The in-memory repository, mock-seed, and dev API routes remain untouched for `mock` mode and tests. The vote casting path delegates to the existing `cast_vote()` Postgres function for transactional ELO + rate limiting. Other operations use direct Supabase client queries.

## Affected Files
- `src/lib/server/supabase-arena-repository.ts`: NEW — implements `ArenaRepository` with Supabase queries
- `src/lib/server/runtime.ts`: UPDATE — create `SupabaseArenaRepository` when `dataMode === "supabase"`

## Acceptance Criteria
### AC-1: Supabase repository implements full interface
Given `SupabaseArenaRepository` / When any `ArenaRepository` method is called / Then it executes the corresponding Supabase query and returns typed results

### AC-2: Runtime routes to correct repository
Given `HUBDEV_DATA_MODE=supabase` / When `getArenaService()` is called / Then it returns an ArenaService backed by SupabaseArenaRepository

### AC-3: Mock mode unchanged
Given `HUBDEV_DATA_MODE=mock` / When `getArenaService()` is called / Then it returns the existing mock-backed service (no regression)

### AC-4: Build and tests pass
Given the changes / When running typecheck + test + build / Then all pass without regression

## must_haves
truths: ["SupabaseArenaRepository uses service_role client for all queries", "runtime.ts no longer throws when dataMode is supabase", "cast_vote() Postgres function is used for vote casting in supabase mode", "Mock mode path is completely preserved", "All existing tests continue to pass"]
artifacts: ["src/lib/server/supabase-arena-repository.ts"]
key_links: ["createServiceRoleClient", "ArenaRepository", "getArenaService", "cast_vote"]

## Detected Conventions
- Repository pattern: `ArenaRepository` interface in `types.ts` with 17 methods
- Service layer: `createArenaService(repository, options)` — pure business logic, repo-agnostic
- Factory: `runtime.ts` → `getArenaService()` resolves the right repository
- DB schema maps cleanly to types: snake_case columns → camelCase properties
- `cast_vote()` PG function handles ELO + rate limits + vote insertion transactionally
- Service role needed for voter_sessions and votes tables (RLS: service_role only)
