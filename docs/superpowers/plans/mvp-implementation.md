# HubDev Arena — MVP Implementation Plan

**Source spec:** `hubdev-arena-mvp.md`
**Current state:** POC with in-memory repository, mock auth, stub UI. All business logic and DB schema are in place.

---

## Current State Summary

### What exists and is correct
- `src/lib/server/arena-service.ts` — full domain service (submit, review, vote, ELO, leaderboard, week states)
- `src/lib/domain/` — elo.ts, matchups.ts, weeks.ts domain logic
- `src/lib/server/types.ts` — ArenaRepository interface + all domain types
- `src/lib/server/in-memory-arena-repository.ts` — reference implementation of ArenaRepository
- `supabase/migrations/20260310213200_init_vibecode_arena.sql` — full schema with RLS, `cast_vote()`, `generate_week_matchups()`
- All route files exist as stubs: `/`, `/vote`, `/leaderboard`, `/submit`, `/my-submissions`, `/entry/[slug]`, `/rules`, `/admin/weeks`, `/admin/weeks/[slug]`
- All API route stubs: `POST /api/submissions`, `GET /api/vote/next`, `POST /api/vote`, `GET /api/leaderboard`, `POST /api/assets`
- Components: vote-client, submit-form, leaderboard-table, live-leaderboard, site-header, countdown, entry-media

### What is explicitly unimplemented
- `src/lib/server/runtime.ts` throws if `HUBDEV_DATA_MODE !== 'mock'`
- No Supabase repository — `ArenaRepository` interface exists but has no Supabase implementation
- No real auth — mock-only via dev endpoints
- No auth gate modal in voting flow
- `voter_sessions.user_id` column missing from schema
- `entries.rejection_note` column missing from schema
- `VoterSession` and `Entry` types missing the two new fields
- No Realtime subscription wiring
- No week auto-transition cron
- Admin pages are stubs (no real data or actions)
- UI is unstyled / default Next.js — no Neo-Brutalism design pass

---

## Implementation Chunks

### Chunk 1 — Schema migrations + type updates

**Goal:** Add the two missing columns, extend TS types to match.

**Files to create/edit:**
- `supabase/migrations/20260313000001_add_rejection_note.sql`
- `supabase/migrations/20260313000002_add_voter_session_user_id.sql`
- `src/lib/server/types.ts` — add `rejectionNote: string | null` to `Entry`, add `userId: string | null` to `VoterSession`

**Migration 1:**
```sql
alter table public.entries add column if not exists rejection_note text;
```

**Migration 2:**
```sql
alter table public.voter_sessions
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

create index voter_sessions_user_id_week_idx
  on public.voter_sessions (user_id, week_id)
  where user_id is not null;
```

**Type changes in `types.ts`:**
- `Entry`: add `rejectionNote: string | null` after `approvedAt`
- `VoterSession`: add `userId: string | null` after `weekId`
- `ArenaRepository`: add `getVoterSessionByUserId(weekId: string, userId: string): Promise<VoterSession | null>`

**Also update `in-memory-arena-repository.ts`** to implement the new method (simple `find` by userId + weekId).

**Tests:** Unit test that `getVoterSessionByUserId` returns the correct session.

---

### Chunk 2 — Supabase repository

**Goal:** Implement `ArenaRepository` against Supabase. Wire `runtime.ts` to use it.

**Files to create:**
- `src/lib/server/supabase-arena-repository.ts`
- Update `src/lib/server/runtime.ts` to instantiate it when `HUBDEV_DATA_MODE !== 'mock'`

**Key implementation notes:**

All mutations go through `service_role` client (server-side only). Reads may use `anon` client where RLS permits.

Column name mapping (DB → TS camelCase):
- `display_name` → `displayName`, `avatar_url` → `avatarUrl`, etc.
- `theme_title` → `themeTitle`, `submission_open_at` → `submissionOpenAt`, etc.
- `elo_rating` → `eloRating`, `demo_asset_path` → `demoAssetPath`
- `founding_builder` → `foundingBuilder`, `one_liner` → `oneLiner`
- `builder_id` → `builderId`, `week_id` → `weekId`
- `voter_session_id` → `voterSessionId`, `fingerprint_hash` → `fingerprintHash`
- `idempotency_key` → `idempotencyKey`, `winner_entry_id` → `winnerEntryId`
- `loser_entry_id` → `loserEntryId`, `votes_cast` → `votesCast`
- `last_seen_at` → `lastSeenAt`, `cookie_id` → `cookieId`
- `submitted_at` → `submittedAt`, `approved_at` → `approvedAt`
- `rejection_note` → `rejectionNote`, `user_id` → `userId`
- `auth_provider` → `authProvider`, `created_at` → `createdAt`, `updated_at` → `updatedAt`

`castVote` in the Supabase repository calls the `cast_vote()` Postgres function (not the in-memory ELO logic). The service layer's ELO code path is only used in mock mode.

**`runtime.ts` update:**
```typescript
export function getArenaService() {
  const dataMode = getDataMode();
  const repository = dataMode === 'mock'
    ? getMockArenaRepository()
    : createSupabaseArenaRepository(createServiceRoleClient());
  return createArenaService(repository, { adminAllowlist: getAdminAllowlist() });
}
```

**Env vars required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HUBDEV_DATA_MODE` — `'mock'` for local, `'supabase'` for production

**Tests:** Integration test against local Supabase (`supabase start`) for:
- `saveProfile` → `getProfileById` roundtrip
- `saveWeek` → `getWeekBySlug` roundtrip
- `saveEntry` roundtrip including `rejectionNote`
- `saveVoterSession` with `userId` → `getVoterSessionByUserId`
- `getVoteByIdempotencyKey` deduplication

---

### Chunk 3 — Real Auth (Supabase OAuth + magic link)

**Goal:** Replace mock auth with Supabase Auth. Twitter OAuth first, email magic link fallback.

**Files to create/edit:**
- `src/lib/server/auth.ts` — expose `getSession()`, `requireSession()`, `getAdminSession()`
- `src/app/login/page.tsx` — real login UI (Twitter button + email form)
- `src/app/auth/callback/route.ts` — Supabase OAuth callback handler
- `src/middleware.ts` — session cookie refresh on every request
- Remove `src/app/api/dev/login/route.ts`, `src/app/api/dev/logout/route.ts`, `src/app/api/dev/reset/route.ts` (or gate them behind `NODE_ENV === 'development'`)

**Auth flow:**
1. User clicks "Sign in with X" → `supabase.auth.signInWithOAuth({ provider: 'twitter', redirectTo: returnUrl })`
2. User clicks "Sign in with email" → `supabase.auth.signInWithOtp({ email })` → magic link email
3. Auth callback at `/auth/callback` → exchanges code, creates session, redirects to `returnUrl`
4. `handle_new_user()` trigger (already in migration) auto-creates `profiles` row on first sign-in

**`requireSession()` helper:** Reads session from Supabase server client. If no session, redirects to `/login?returnTo=<current-path>`.

**Admin guard:** `getAdminSession()` — calls `requireSession()` then checks `session.user.email` against `ADMIN_EMAILS` env var. Returns 404 (not redirect) for non-admins.

**Login page UI:**
- Matches Neo-Brutalism aesthetic (see Chunk 8)
- "SIGN IN WITH X →" — neon green button
- Divider: "or continue with email"
- Email input + "Send magic link →" — hyper blue button

**Env vars:**
- `ADMIN_EMAILS` — comma-separated admin email addresses
- Supabase dashboard: enable Twitter provider (requires X developer app), enable email OTP

**Tests:**
- `requireSession()` redirects unauthenticated users to `/login`
- `getAdminSession()` returns 404 for non-admin email

---

### Chunk 4 — Supabase repository: `castVote` via Postgres function

**Goal:** Wire `POST /api/vote` to call the `cast_vote()` Postgres function end-to-end, including voter session creation and `user_id` linkage.

This is a sub-chunk of Chunk 2 but split out because it has auth dependency.

**`POST /api/vote` route handler:**
1. `requireSession()` — auth required
2. Extract `userId` from session
3. Call `getVoterSessionByCookie(weekId, cookieId)` — if none exists or `userId` is null, create/update with `userId`
4. Call Supabase RPC: `cast_vote(weekId, matchupId, winnerEntryId, loserEntryId, voterSessionId, fingerprintHash, idempotencyKey)`
5. Return `{ voteId, winnerNewElo, loserNewElo, sessionVotesCast }`

**Voter session `userId` linkage:** On `POST /api/vote`, after auth, if the voter session exists but has `userId = null`, update it to set `user_id = session.user.id`. This handles the case where a voter browses, taps vote, gets the auth gate, signs in, and then submits — their cookie session gets the userId attached.

**Idempotency key:** Generated client-side as `matchupId + '-' + timestamp`. Sent with every vote. Retries are safe.

**Duplicate vote (idempotency key):** `cast_vote()` raises SQLSTATE `23505` for duplicate idempotency key. Route handler catches it and returns `{ duplicate: true }` — client advances to next matchup silently.

---

### Chunk 5 — Voting UI: pre-auth first matchup + auth gate modal

**Goal:** Implement the voter journey exactly per spec.

**Files to edit:**
- `src/components/vote-client.tsx` — main voting state machine
- Create `src/components/auth-gate-modal.tsx`
- Create `src/components/voter-progress.tsx`

**Vote client state machine:**
```
idle
→ (load) → matchup_loaded
→ (tap VOTE) → vote_intent_queued
  → if signed in: → submitting → submitted → load next
  → if not signed in: → auth_gate_shown
    → (sign in complete) → submitting → submitted → load next
    → (skip) → load next (intent discarded)
→ (10 votes) → post_vote_overlay
→ (all seen) → all_seen_state
→ (voting closed) → closed_state
```

**Pre-auth first matchup:** `GET /api/vote/next` does NOT require auth. The first matchup renders with no progress bar. The `votesCast` field in the response is shown after sign-in.

**Auth gate modal (`auth-gate-modal.tsx`):**
- Appears after first VOTE tap if not signed in
- "Sign in to save your votes"
- "SIGN IN WITH X →" + "or email" input + "Send magic link →"
- "Skip for now" link — dismisses modal, discards vote intent, loads next matchup
- On sign-in complete: modal closes, queued vote is submitted

**Post-auth vote submit:** After sign-in callback returns, the vote client checks `sessionStorage` for a queued vote intent and submits it.

**Voter progress bar:** Shown only after sign-in. `X/10` format. After 10 votes, shows overlay with leaderboard snapshot + share CTA. "Keep voting →" dismisses overlay.

---

### Chunk 6 — Admin pages

**Goal:** Implement `/admin/weeks` and `/admin/weeks/[slug]` with real data and actions.

**Files to edit:**
- `src/app/admin/weeks/page.tsx`
- `src/app/admin/weeks/[slug]/page.tsx`
- `src/app/admin/actions.ts`
- Create `src/components/admin/` — `WeekTable`, `EntryReviewList`, `EntryDetailPanel`, `WeekSettingsForm`, `WeekOverrideControls`, `VoterStats`, `FoundingBuilderToggle`

**`/admin/weeks` page:**
- Server component. Calls `getAdminSession()` (returns 404 for non-admins).
- Loads all weeks via `arenaService.listWeeks()`.
- Renders `WeekTable` with columns: theme title, slug, status badge, entry counts (pending/approved/rejected), unique voter count.
- "New week" button → form modal to create week.
- Row links → `/admin/weeks/[slug]`.

**`/admin/weeks/[slug]` page:**
- Three tabs: Overview, Entries, Voters.

**Overview tab:**
- Week settings form (editable while `draft` or `submissions_open`): theme title, description, timestamps, timezone.
- Current status badge.
- Transition buttons — only valid next states shown: "Open Submissions", "Open Voting" (with ≥2 entry guard), "Lock Results", "Archive".
- Actions call `PATCH /api/admin/weeks/[slug]/status`.

**Entries tab:**
- Filter tabs: Pending / Approved / Rejected with counts.
- Entry list (left panel) — click to open detail panel.
- Detail panel (right panel): demo asset playback, title, one-liner, live URL, builder handle. "Approve" (green) and "Reject" (red) buttons. Reject reveals optional rejection note textarea.
- After action: entry moves to correct filter, next pending entry auto-loads.
- Founding builder toggle: calls `PATCH /api/admin/profiles/[id]/founding-builder`.

**Voters tab:**
- Unique voter count, total votes cast, average votes per voter.
- Rate-limit event log (voter session ID, count, timestamp).

**Server actions / API routes needed:**
- `POST /api/admin/weeks` — create week
- `PATCH /api/admin/weeks/[slug]/status` — force transition. Body: `{ targetStatus }`. Guards: must be valid transition; `voting_open` requires ≥2 approved entries.
- `PATCH /api/admin/entries/[id]/status` — approve/reject. Body: `{ status, rejectionNote? }`.
- `PATCH /api/admin/profiles/[id]/founding-builder` — toggle. Body: `{ foundingBuilder: boolean }`.

All admin API routes: check `ADMIN_EMAILS` allowlist, return 404 for non-admins.

---

### Chunk 7 — Landing page, leaderboard Realtime, `/my-submissions`, `/entry/[slug]`

**Goal:** Implement all public-facing pages per spec.

**`/` Landing page (`src/app/page.tsx`):**
- Server component. Loads `currentWeek` and `featuredEntries`.
- Renders different content based on week status:
  - `submissions_open`: `WeekHero` + `CountdownTimer` (to close) + "Submit your app →" CTA
  - `voting_open`: hero + "VOTING LIVE" badge + `CountdownTimer` (to vote close) + featured entry cards + "Start voting →" CTA
  - `locked`: winner card + `LeaderboardPreview` (top 5) + "Next round starts Thursday" notice
  - Gap (submissions closed, voting not open): theme title + "Submissions closed — voting opens [date]" notice
  - No active week: "BETWEEN ROUNDS" + "Next theme drops Thursday 12PM PT" + "Past winners →" link

**`/leaderboard` page:**
- Server component renders initial rows.
- Client component `LiveLeaderboard` subscribes to Supabase Realtime on `entries` filtered by `week_id = current`.
- On row update: re-sort list, animate rank changes (CSS transition on `translate-y`).
- Falls back to 30-second `setInterval` poll if Realtime subscription drops (track via `channel.subscribe()` callback status).
- Status badge: "LIVE" with pulsing dot (CSS `animate-pulse`) during `voting_open`, "FINAL RESULTS" after `locked`.

**`/my-submissions` page:**
- Requires auth. Calls `arenaService.getMySubmissions(userId)`.
- Current week entry card with status badge. Edit/Resubmit links.
- Rejection note shown prominently for rejected entries.
- Past weeks read-only.

**`/entry/[slug]` page:**
- Public. Loads entry by slug (RLS enforces approved-only).
- Returns 404 for non-existent or unapproved entries.
- Demo asset full-width, app title, one-liner, builder info, ELO/W-L if voting has opened.

**`/submit` page:**
- Requires auth.
- Week-state gate: shows form only during `submissions_open`.
- Pre-fills form if builder has existing pending/rejected entry.
- Resubmit path: PUT to `POST /api/submissions` with existing entry ID (upsert).

---

### Chunk 8 — Neo-Brutalism UI design pass

**Goal:** Apply the spec's visual design across all pages and components.

**Design tokens (globals.css):**
```css
/* Fonts */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

:root {
  --color-bg: #F5F5F5;
  --color-black: #000000;
  --color-green: #00FF41;
  --color-blue: #0033FF;
  --color-white: #FFFFFF;
  --border: 2px solid #000;
  --border-thick: 4px solid #000;
  --shadow: 4px 4px 0px #000;
  --shadow-lg: 6px 6px 0px #000;
  --radius: 0px;
  --font-heading: 'Syne', sans-serif;
  --font-mono: 'Space Mono', monospace;
}
```

**Rules:**
- 0px border-radius everywhere
- All interactive elements: `border: var(--border)` or `var(--border-thick)`, `box-shadow: var(--shadow)`
- Hover state: shadow shifts to `2px 2px 0px #000` and element translates `(2px, 2px)` to simulate press
- Primary CTA (submit, vote for left entry): `background: var(--color-green)`, black text
- Secondary CTA (vote for right entry): `background: var(--color-blue)`, white text
- Headings: Syne, `font-weight: 900`, oversized
- Labels/metadata/code: Space Mono
- Status badges: inline-block with solid border, all-caps, Space Mono

**Component-level rules:**
- `VoteButton`: full-width, 56px height mobile, thick border, hard shadow, hover press effect
- `MatchupCard`: `border: var(--border-thick)`, `box-shadow: var(--shadow-lg)`, no rounded corners
- `EntryCardMini`: border + shadow, title in Syne, one-liner in Space Mono
- `LeaderboardTable`: full-width table, `border-collapse: collapse`, each row has bottom border
- `#1 row` leaderboard: `border: 2px solid var(--color-green)`, left accent bar in green
- `CTAButton`: variants — primary (green), secondary (blue), outline (black border, white fill)
- Forms: all inputs `border: var(--border)`, `border-radius: 0`, no inset shadow
- Modals: `border: var(--border-thick)`, `box-shadow: var(--shadow-lg)`, no backdrop blur (use solid dark overlay)

---

### Chunk 9 — Week auto-transition cron

**Goal:** Automatic week state transitions on a 1-minute schedule.

**Files to create:**
- `src/app/api/cron/week-transitions/route.ts`
- `vercel.json` — cron config

**Cron route (`GET /api/cron/week-transitions`):**
1. Verify `Authorization: Bearer $CRON_SECRET` header (Vercel Cron sends this automatically when configured).
2. Load all weeks with status in `['draft', 'submissions_open', 'voting_open']`.
3. For each week, check if its next transition timestamp has passed:
   - `draft` + `submission_open_at <= now()` → transition to `submissions_open`
   - `submissions_open` + `voting_open_at <= now()` → check ≥2 approved entries → transition to `voting_open` + run `generate_week_matchups()`; if <2 entries, log warning and skip
   - `voting_open` + `voting_close_at <= now()` → transition to `locked`
4. Return `{ transitioned: [{ weekSlug, from, to }] }`.

**`vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/week-transitions",
      "schedule": "* * * * *"
    }
  ]
}
```

**Env var:** `CRON_SECRET` — set in Vercel dashboard and locally for testing.

**Tests:**
- Cron route rejects requests without correct `Authorization` header.
- Correctly transitions weeks when timestamp is past.
- Skips `voting_open` transition when <2 approved entries.

---

### Chunk 10 — Tests

**Goal:** Unit + integration coverage per spec's Testing section.

**Unit tests (Vitest):**
- `src/lib/domain/elo.test.ts` — ELO delta math (winner/loser update, floor at 0, K=24)
- `src/lib/domain/matchups.test.ts` — `generateUniqueMatchups` (n entries → n*(n-1)/2 pairs), `selectNextMatchup` fairness
- `src/lib/domain/weeks.test.ts` — valid transitions, invalid transition throws
- `src/lib/server/arena-service.test.ts` (expand existing) — rate limit enforcement, `rejectionNote` persisted on reject, `userId` linkage

**Integration tests (Vitest + local Supabase):**
- Submission create → edit → resubmit cycle
- Admin approve + reject with `rejectionNote`
- Vote transaction idempotency (duplicate key returns without error)
- Rate limit enforcement via `cast_vote()` Postgres function
- Leaderboard recalculation after votes
- Week state transition guards (< 2 entries blocks voting open)

**E2E tests (Playwright):**
- Builder signs in → submits → admin approves → voter casts 10 votes → leaderboard reflects results → week locked → results read-only
- Auth gate flow: tap vote → auth modal → sign in → queued vote submitted
- Admin rejects entry with note → builder sees rejection note on `/my-submissions` → resubmits

---

## Execution Order

```
Chunk 1  → Chunk 2  → Chunk 3  → Chunk 4
                               ↓
                          Chunk 5 (voting UI)
                          Chunk 6 (admin)
                          Chunk 7 (public pages)
                               ↓
                    Chunk 8 (design pass — can run in parallel)
                    Chunk 9 (cron — can run in parallel)
                               ↓
                          Chunk 10 (tests)
```

Chunks 1–4 are sequential (each depends on the previous). Chunks 5, 6, 7 can run in parallel after Chunk 4. Chunks 8 and 9 are independent and can overlap. Chunk 10 runs last.

---

## Environment Variables Checklist

| Var | Used by | Notes |
|-----|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side repository | Secret, never expose to client |
| `HUBDEV_DATA_MODE` | runtime.ts | `'mock'` (local dev) or `'supabase'` (prod) |
| `ADMIN_EMAILS` | auth.ts, admin routes | Comma-separated admin email list |
| `CRON_SECRET` | /api/cron/week-transitions | Set in Vercel dashboard |
| `NEXT_PUBLIC_APP_URL` | Auth callback redirect | Full app URL incl. protocol |

---

## Migration Checklist Before First Deploy

- [ ] Run migration 1: `ALTER TABLE entries ADD COLUMN rejection_note text`
- [ ] Run migration 2: `ALTER TABLE voter_sessions ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE SET NULL`
- [ ] Enable Twitter provider in Supabase dashboard (requires X developer app credentials)
- [ ] Enable email OTP in Supabase dashboard
- [ ] Set `NEXT_PUBLIC_APP_URL/auth/callback` as allowed redirect URL in Supabase Auth settings
- [ ] Create `demo-assets` storage bucket (already in migration, verify via Supabase Studio)
- [ ] Set `CRON_SECRET` in Vercel dashboard

---

## Open Questions (none blocking implementation)

- X developer app: need OAuth 2.0 app credentials from the X developer portal. Supabase docs confirm Twitter is a supported provider.
- Vercel Cron: 1-minute interval requires a Vercel Pro plan (free tier minimum is 1 hour). For MVP testing, admin manual overrides cover this gap.
