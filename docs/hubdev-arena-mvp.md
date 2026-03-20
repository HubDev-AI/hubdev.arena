# HubDev Arena MVP

## Summary

Build a greenfield, mobile-first web app that combines a weekly themed AI-app challenge with fast head-to-head voting. Builders sign in to submit one entry per week; voters also sign in and can complete 10 matchups in about 2 minutes; the weekly leaderboard updates live with ELO scoring.

The MVP is validation-first. It should prove builder supply and voter engagement before adding seasons, public profiles, trophies, taste cards, payments, or native apps.

---

## Locked Product Decisions

- This is a hybrid product, not two separate products.
- Scope is `validation MVP` only.
- Builders and voters both authenticate.
- Auth is `X/Twitter OAuth` first, with `email magic-link` fallback enabled from day one so launch is not blocked.
- Submissions require a live URL plus one demo asset (`GIF` or short `MP4`).
- All submissions are manually approved before they enter voting.
- One active weekly round exists at a time.
- Week timing is admin-configurable, with default timezone `America/Los_Angeles`.
- Voters see their first matchup immediately without signing in; the auth gate appears after casting their first vote.
- Mobile voting is stacked cards (both entries visible), each with a full-width VOTE button — no swipe gesture.
- The leaderboard updates via Supabase Realtime subscription, not polling.
- Week state transitions are hybrid: timestamps trigger automatic transitions; admin can force any valid transition at any time.

---

## In Scope

- Landing page with current theme, countdown, featured entrants, and "Start voting" CTA.
- Builder sign-in, submission form, and "my submissions" page.
- Public voting flow with authenticated voter sessions (optimistic start — auth gate after first vote).
- Live weekly leaderboard with Supabase Realtime.
- Admin tools for creating weeks, approving entries via a detail-panel review queue, opening voting, locking results, and seeding founding builders.
- Basic anti-abuse controls for authenticated voting.
- Storage for demo assets.
- Minimal analytics needed to judge validation.

## Out of Scope

- Seasons and cumulative standings.
- Public builder profile pages.
- Trophy history and next-week featured winner placement.
- Boosted placements or payments.
- Native mobile apps.
- Community comments, chat, or social feeds.
- Multi-week browsing / discovery archive beyond a simple past winners list.

---

## Stack and App Shape

- `Next.js` App Router + TypeScript + Tailwind CSS.
- `Supabase` for Auth, Postgres, Storage, Realtime, and SQL functions.
- `Vercel` for hosting.
- Public routes: `/`, `/vote`, `/leaderboard`, `/rules`, `/entry/[slug]`.
- Builder routes: `/submit`, `/my-submissions`.
- Admin routes: `/admin/weeks`, `/admin/weeks/[slug]`.
- Mutations go through Next route handlers or server actions; clients do not write directly to vote tables.

### Design Aesthetic

Neo-Brutalism / Editorial Tech. High contrast, raw, bold. Sharp corners (0px border radius), thick solid black borders (2–4px), hard drop shadows (no blur). Fonts: Syne (headings, oversized heavy), Space Mono (metadata, labels, code). Colors: stark white or pale grey background, `#00FF41` (neon green) for primary positive actions, `#0033FF` (hyper blue) for secondary vote actions, `#000` borders and shadows throughout.

---

## User Journeys

### Builder Journey

1. Lands on `/` → sees current week theme, deadline, and "Submit your app" CTA.
2. Clicks CTA → redirected to sign-in (X/Twitter OAuth or email magic link) → returned to `/submit`.
3. Fills form: title (60 chars), one-liner (120 chars), live URL, GIF/MP4 upload → submits → entry created as `pending`.
4. Confirmation shown → link to `/my-submissions` where the pending badge is visible.
5. Admin reviews entry and either approves or rejects it (with an optional note).
   - **Approved:** entry enters voting. Builder can watch ELO on `/leaderboard`.
   - **Rejected:** rejection note shown on `/my-submissions`. Builder can edit and resubmit while `submissions_open`.

### Voter Journey

1. Lands on `/` → sees theme, top-3 featured entries (during `voting_open`), and "Start voting" CTA.
2. Navigates to `/vote` → first matchup loads immediately — no sign-in required.
3. Taps VOTE on one card → the vote intent is captured client-side (matchupId + winnerId held in component state). Auth gate modal appears immediately: "Sign in to save your votes."
4. Signs in → voter session created with `user_id` set → the queued vote is submitted via `POST /api/vote` → progress indicator shows `1/10`. `POST /api/vote` always requires auth; no pre-auth vote endpoint exists.
5. Continues voting. After 10 votes → leaderboard snapshot + share prompt overlay. Voter can dismiss and keep voting past 10.
6. "Skip for now" on the auth gate: vote intent discarded, next matchup shown, auth gate re-triggers after next vote tap.

### Admin Journey

1. Navigates to `/admin/weeks` → table of all weeks with status badges, entry counts, voter counts.
2. Creates a new week → sets theme title, description, timestamps, timezone → saved as `draft`.
3. At `submission_open_at` (or via manual override) → week transitions to `submissions_open`. Becomes visible on landing page.
4. Reviews incoming entries on `/admin/weeks/[slug]` → "Entries" tab with pending/approved/rejected filters. Clicks an entry → detail panel slides in from right showing: demo asset playback, title, one-liner, live URL → Approve or Reject (with optional rejection note).
5. At `voting_open_at` (or via manual override) → week transitions to `voting_open`. `generate_week_matchups()` runs automatically — all unique approved-entry pairs inserted into `matchups`.
6. Monitors progress: vote counts, unique voter count, ELO movement visible on the admin week detail page.
7. At `voting_close_at` (or via manual override) → week transitions to `locked`. Votes rejected, leaderboard frozen, results published on landing page.
8. Manually archives the week when ready → transitions to `archived`, removed from active display.

---

## Week State Machine

States: `draft → submissions_open → voting_open → locked → archived`

The gap between `submission_close_at` and `voting_open_at` is not a separate state — the week remains in `submissions_open` status during this period. The landing page detects the gap by comparing the current time to both timestamps and renders the gap UI described above. No additional enum value is needed.

| From | To | Auto trigger | Side effect | Admin override |
|---|---|---|---|---|
| `draft` | `submissions_open` | `submission_open_at` reached | Week becomes visible on `/` | "Open Submissions" button |
| `submissions_open` | `voting_open` | `voting_open_at` reached | `generate_week_matchups()` runs | "Open Voting" button |
| `voting_open` | `locked` | `voting_close_at` reached | Votes rejected, leaderboard frozen | "Lock Results" button |
| `locked` | `archived` | Manual only | Removed from active display | "Archive" button |

**Implementation:** A background job (Vercel Cron or Supabase Edge Function on a 1-minute schedule) queries for weeks whose transition timestamp has passed and applies the transition. Admin overrides call the same transition logic directly via a server action. Invalid transitions (e.g., `voting_open → submissions_open`) are rejected with an error toast.

**Guard:** Transitioning to `voting_open` requires at least 2 approved entries. If fewer exist, the auto-transition is skipped and admin is alerted.

---

## Screens

### `/` — Landing Page

**Purpose:** First impression. Drive builders to submit, voters to vote. Content changes based on week status.

**State: `submissions_open`**
- Week theme title (oversized headline) + short description.
- Countdown timer to submission deadline.
- Primary CTA: "Submit your app →" (neon green button, full width on mobile).
- Secondary links: Rules · Past winners.
- No entry cards — entries not shown until voting opens.

**State: `voting_open`**
- Week theme title + "VOTING LIVE" badge.
- Countdown timer to voting close.
- Primary CTA: "Start voting →" (hyper blue button).
- Three featured entry cards (#1, #2, #3 by current ELO): demo thumbnail, title, builder handle. Tap opens `/entry/[slug]`.
- Secondary CTA: "Submit your app" (text link, smaller).

**State: `locked` (results published)**
- Winner card: full-width highlight with `#00FF41` border, ELO, W/L record.
- Leaderboard preview: top 5 entries ranked.
- "Next round starts Thursday" notice.

**State: gap (submissions closed, voting not yet open)**
- Week theme title + "Submissions closed — voting opens Monday 9AM PT" notice.
- No entry cards, no CTA. Read-only informational state.

**State: no active week**
- "BETWEEN ROUNDS" headline + "Next theme drops Thursday 12PM PT" subtext.
- "Past winners →" link. No email capture in MVP.

**Components:** `WeekHero`, `CountdownTimer`, `EntryCardMini`, `CTAButton`, `LeaderboardPreview`, `BetweenRoundsState`.

---

### `/vote` — Voting Page

**Purpose:** Core engagement loop. Target: 10 matchups in ~2 minutes.

**Layout — Desktop**
Two large cards side-by-side. Each card contains:
- Demo asset: GIF autoplays, MP4 autoplays muted and loops.
- App title: oversized bold (Syne), 2–3 lines max.
- One-liner: Space Mono, secondary color.
- Builder handle: `@username` in monospace.
- "Open app ↗" secondary link (small, below the fold).
- VOTE button: full-width, thick border, hard shadow. Left card = `#00FF41`, right card = `#0033FF`.

**Layout — Mobile**
Same content, cards stacked vertically. VOTE button full-width on each card. Both cards visible without scrolling for typical phone sizes; minor scroll acceptable on very small screens.

**Voter progress:** Horizontal progress bar or `X/10` counter in the header. Visible after sign-in.

**States:**

| State | What the user sees |
|---|---|
| Pre-auth (before first vote) | Matchup loads, no progress indicator, no vote history |
| After first vote | Auth gate modal: "Sign in to save your votes" with X/Twitter and email options, plus "Skip for now" |
| Post-auth (signed in) | Progress indicator active, next matchup queues immediately after each vote |
| After 10 votes | Overlay: current leaderboard snapshot + "Share the leaderboard →" CTA + "Keep voting →" link |
| Voting closed | Static message: "Voting has closed — view final results →" linking to `/leaderboard` |
| All matchups seen | "You've seen every matchup this round — check the leaderboard!" |

**Pair selection flow:** Client calls `GET /api/vote/next?week=<slug>`. Server returns the lowest-exposure unseen pair for this voter session, avoiding repeating the same entry twice in a row when alternatives exist. After a VOTE tap, the UI optimistically dims the voted pair and immediately requests the next matchup.

**Components:** `MatchupCard`, `DemoAsset`, `VoteButton`, `VoterProgress`, `AuthGateModal`, `PostVoteOverlay`, `SharePrompt`.

---

### `/leaderboard` — Live Leaderboard

**Purpose:** Show live rankings during voting; frozen results after locking.

**Content:**
- Week title + status badge (`LIVE` with pulsing dot during `voting_open`, `FINAL RESULTS` after `locked`).
- Ranked rows: rank number, demo thumbnail, entry title, builder name + handle, ELO, W/L record, "Open app ↗" link.
- `#1` row gets `#00FF41` border treatment to stand out.

**Real-time:** Supabase Realtime channel subscribed to `entries` filtered by `week_id = current`. On any row update, re-sort the list client-side and animate rank changes. Show a "Live" indicator while the subscription is active. Fall back to a 30-second poll if the Realtime connection drops.

**States:** `voting_open` (live, updating), `locked` (frozen, share CTA shown), `archived` (historical, read-only).

**Components:** `LeaderboardTable`, `EntryRow`, `RealtimeBadge`, `WeekStatusBadge`.

---

### `/submit` — Submission Form

**Purpose:** Builder submits their app for the current week.

**Auth gate:** Must be signed in. Unauthenticated users are redirected to sign-in and returned to `/submit` after.

**Week-state gate:**
- `submissions_open`: normal form experience (described below).
- `voting_open` or `locked`: show "Submissions for this round are closed" with a link to `/leaderboard`. No form rendered.
- No active week / `draft`: show "No active round — check back Thursday 12PM PT." No form rendered.

**Form fields:**
- Title: text input, 60-char max with live character count.
- One-liner: text input, 120-char max with live character count.
- Live URL: text input, client-side format validation (`https://` required).
- Demo asset: file upload drag-and-drop zone. Accepts `image/gif` and `video/mp4`, max 50 MB. Shows upload progress. Previews the asset after upload.

**Submission rules:**
- If the builder has no entry this week: shows blank form.
- If the builder has a `pending` or `approved` entry: shows that entry's data with an edit form (same fields, pre-filled). "You already have a submission for this round."
- If the builder has a `rejected` entry: shows rejection note prominently + edit form to resubmit.

**After submit:** "Your submission is pending review" confirmation message with a link to `/my-submissions`.

**Components:** `SubmissionForm`, `DemoAssetUploader`, `CharacterCount`, `SubmissionStatus`, `UploadProgress`.

---

### `/my-submissions` — Builder Submission History

**Purpose:** Builder tracks their current and past submission statuses.

**Auth gate:** Must be signed in.

**Content:**
- Current week entry card (if any): status badge (`PENDING` in amber, `APPROVED` in green, `REJECTED` in red), title, one-liner, submission timestamp.
  - `PENDING`: "Edit submission →" link.
  - `REJECTED`: rejection note shown in red. "Resubmit →" CTA (available while `submissions_open`).
  - `APPROVED`: ELO + W/L stats if voting has opened. Link to `/entry/[slug]`.
- Past weeks: read-only entry cards with final ELO and placement.

**Components:** `SubmissionCard`, `StatusBadge`, `RejectionNote`.

---

### `/entry/[slug]` — Entry Detail

**Purpose:** Shareable page for a single approved entry. Used for sharing on social media.

**Content:**
- Demo asset full-width (GIF loops, MP4 autoplays muted).
- App title (large), one-liner (monospace), builder name + avatar, "Open app →" CTA.
- If voting has opened: ELO rating, W/L record, current rank.
- "View leaderboard →" link.

**Access:** Only visible for `approved` entries (enforced by RLS). Returns 404 for pending/rejected entries.

**Components:** `EntryHero`, `BuilderInfo`, `AppStats`, `DemoAsset`.

---

### `/rules` — Rules

**Purpose:** Static explanatory page. No dynamic data.

**Content:** Challenge format (weekly theme, submission window, voting window), scoring explanation (ELO with K=24, starting at 1200), submission requirements (live URL + demo asset), voting rules (one vote per matchup per account, rate limits), and founding builder explanation.

---

### `/admin/weeks` — Admin Week List

**Purpose:** Admin dashboard overview.

**Auth:** Middleware checks that the authenticated user's email is in `ADMIN_EMAILS` env var. Returns 404 (not 403) for non-admins.

**Content:** Table of all weeks sorted by `submission_open_at` desc. Columns: theme title, slug, status badge, submission count (pending / approved / rejected), unique voter count, quick-action links (View, Force transition).

**Components:** `WeekTable`, `StatusBadge`, `QuickActions`.

---

### `/admin/weeks/[slug]` — Admin Week Detail

**Purpose:** Manage a specific week end-to-end.

**Auth:** Same email allowlist check as above.

**Tabs:**

**Overview tab**
- Week settings form (editable while `draft` or `submissions_open`): theme title, description, timestamps, timezone.
- Current status badge + allowed transitions shown as action buttons ("Open Submissions", "Open Voting", "Lock Results", "Archive"). Only valid next-state buttons are shown.
- Warning if transitioning to `voting_open` with fewer than 2 approved entries.

**Entries tab**
- Filter tabs: Pending · Approved · Rejected (with counts).
- Entry list (left panel): entry title, builder handle, submission time. Click to open detail panel.
- Detail panel (right panel, slides in): demo asset with playback controls, title, one-liner, live URL (opens in new tab), builder handle + avatar. Approve button (green, hard shadow) and Reject button (red outline). Rejection note textarea (shown when Reject is clicked, optional before confirming). After approve/reject: entry moves to the appropriate filter tab, next pending entry auto-loads if available.
- Founding builder toggle: checkbox on each entry that sets `profiles.founding_builder = true` on the entry's `builder_id`. Toggling via an entry is just a convenience; the flag lives on the profile, not the entry.

**Voters tab**
- Unique authenticated voter count, total votes cast, average votes per voter.
- Rate-limit event log (voter session ID, count, timestamp) for abuse monitoring.

**Override controls (bottom of every tab):** "Open Voting" force button (if `submissions_open`), "Lock Results" force button (if `voting_open`).

**Components:** `WeekSettingsForm`, `WeekOverrideControls`, `EntryReviewList`, `EntryDetailPanel`, `VoterStats`, `FoundingBuilderToggle`.

---

## Data Model

- `profiles`: `id`, `display_name`, `username`, `avatar_url`, `auth_provider`, `founding_builder`, `created_at`, `updated_at`.
- `weeks`: `id`, `slug`, `theme_title`, `theme_description`, `timezone`, `submission_open_at`, `submission_close_at`, `voting_open_at`, `voting_close_at`, `status`, `created_at`, `updated_at`.
- `entries`: `id`, `week_id`, `builder_id`, `slug`, `title`, `one_liner`, `live_url`, `demo_asset_path`, `status`, `elo_rating`, `wins`, `losses`, `appearance_count`, `rejection_note`, `submitted_at`, `approved_at`, `rejected_at`, `created_at`, `updated_at`.
- `matchups`: `id`, `week_id`, `entry_a_id`, `entry_b_id`, `exposure_count`, `vote_count`, `created_at`, `updated_at`.
- `voter_sessions`: `id`, `week_id`, `user_id` (FK to `profiles.id`, nullable), `cookie_id`, `fingerprint_hash`, `votes_cast`, `last_seen_at`, `created_at`, `updated_at`.
- `votes`: `id`, `week_id`, `matchup_id`, `winner_entry_id`, `loser_entry_id`, `voter_session_id`, `fingerprint_hash`, `idempotency_key`, `created_at`.

---

## Public Interfaces and Types

```typescript
type WeekStatus = 'draft' | 'submissions_open' | 'voting_open' | 'locked' | 'archived'
type EntryStatus = 'pending' | 'approved' | 'rejected'
```

**`POST /api/submissions`**
Body: `{ weekSlug, title, oneLiner, liveUrl, demoAssetPath }`
Auth: required. One entry per builder per week enforced server-side.

**`GET /api/vote/next?week=<slug>`**
Response: `{ matchupId, leftEntry, rightEntry, votesCast, votingClosesAt }`
Auth: optional (returns next unseen pair; seen-pair tracking uses voter session).

**`POST /api/vote`**
Body: `{ matchupId, winnerEntryId, loserEntryId, idempotencyKey }`
Auth: required (called after sign-in gate; vote intent queued client-side until auth completes).
Delegates to `cast_vote()` Postgres function.
Response: `{ voteId, winnerNewElo, loserNewElo, sessionVotesCast }`

**`GET /api/leaderboard?week=<slug>`**
Response rows: `{ rank, entrySlug, title, builderName, liveUrl, demoAssetUrl, elo, wins, losses }`
Auth: none.

**`POST /api/admin/weeks`** — create week (admin only)
**`PATCH /api/admin/weeks/[slug]/status`** — force state transition (admin only). Body: `{ targetStatus }`.
**`PATCH /api/admin/entries/[id]/status`** — approve or reject entry (admin only). Body: `{ status, rejectionNote? }`.

---

## Core Logic

**Submission rule:** One approved entry per builder per week. A builder can edit a `pending` or `rejected` entry — resubmission updates the existing row in place (upsert, same `id`). Once `approved`, the entry is locked and cannot be edited by the builder. Admin can still update status fields.

**Matchup generation:** On transition to `voting_open`, `generate_week_matchups(week_id)` inserts every unique unordered pair of approved entries. Duplicate pairs are silently skipped via `ON CONFLICT DO NOTHING`.

**Pair serving:** Choose from matchups with the lowest `exposure_count` for this week. Exclude matchups the voter has already voted on (derived from the `votes` table — "seen" means voted, not just served). Randomize within the lowest-exposure bucket. Avoid returning the same entry twice in a row when alternatives exist. Increment `exposure_count` on the served matchup when the next-matchup response is sent.

**ELO:** Every entry starts at `1200`. K-factor = `24`. Expected score: `1 / (1 + 10^((loser_elo - winner_elo) / 400))`. Delta: `round(24 * (1 - expected))`. Both entries updated transactionally inside `cast_vote()`. ELO floor: `0` (constraint in schema).

**Leaderboard order:** `elo_rating DESC`, then `wins DESC`, then `losses ASC`, then `approved_at ASC`.

**Abuse controls:** Authenticated voter session keyed by the signed-in user. Hashed `IP + User-Agent` fingerprint as secondary signal. One vote per matchup per signed-in voter (unique constraint). Duplicate idempotency keys rejected. Rate limits enforced inside `cast_vote()` using Postgres count queries on the `votes` table: 30 votes per 10 minutes and 100 votes per day — both the session counter and the fingerprint counter are checked independently; if either exceeds the limit, the vote is blocked. No external rate-limit store (Redis, Upstash) needed in MVP.

**Admin access:** Allowlisted emails via `ADMIN_EMAILS` env var (comma-separated). Middleware returns 404 for non-admins. No separate RBAC in MVP.

---

## Error States

### Submission errors
| Situation | User-facing message |
|---|---|
| Week not in `submissions_open` | "Submissions are closed for this round." |
| Builder already has approved entry | "You already have an approved submission for this round." |
| File too large (>50 MB) | Client-side: "File must be under 50 MB." |
| Invalid file type | Client-side: "Only GIF and MP4 files are accepted." |
| Invalid URL format | Inline field error: "Please enter a valid https:// URL." |

### Voting errors
| Situation | Handling |
|---|---|
| Voting not open (week locked or not started) | "Voting has closed for this round." Full-page state, links to leaderboard. |
| Rate limit hit | Toast: "You're voting too fast — please slow down." Block until rate limit resets. |
| Duplicate vote (idempotency key) | Silent dedup — advance to next matchup, no error shown. |
| All matchups seen | "You've seen every matchup this round!" State with leaderboard link. |
| Network error on vote submit | Toast: "Something went wrong — please try again." Idempotency key ensures retry is safe. |

### Admin errors
| Situation | Handling |
|---|---|
| Invalid state transition | Error toast: "Cannot transition from X to Y." |
| Voting opened with <2 approved entries | Blocking warning: "Need at least 2 approved entries to open voting." |
| Duplicate week slug | Inline form error on week creation. |

---

## UX and Content Rules

- Landing page focuses on the current week only.
- Voting view is two large cards side-by-side on desktop and stacked on mobile.
- Each card shows demo asset, one-line pitch, builder name, and "Open app" secondary link.
- After 10 votes, show the current leaderboard snapshot and a prompt to share the round.
- Submission form requires title, one-liner, live link, and demo asset; optional long description is omitted in MVP.
- Founding-builder status is a boolean badge on approved entries for the first manually recruited cohort.
- Demo assets: GIF autoplays inline, MP4 autoplays muted and loops. No audio controls needed in MVP.
- Auth gate after first vote is a modal (not a page redirect) so the voting context is preserved.
- "Skip for now" on the auth gate: the voter dismisses the modal and the queued vote intent is discarded (not submitted). The voter sees the next matchup and can vote again — triggering the auth gate again after that vote. There is no anonymous vote path; votes always require auth. This simplifies session management and avoids pre-auth vote attribution complexity.
- `exposure_count` increments when a matchup is served (not when voted). A voter who closes the tab before voting still increments the counter. This is intentional — it prevents the same unvoted matchup from perpetually appearing at the top.

---

## Testing and Acceptance

**Unit tests:** ELO update math, matchup generation, pair-selection fairness, week state transitions (valid and invalid), fingerprint hashing.

**Integration tests:** Submission create/edit/resubmit, moderation approve/reject, vote transaction idempotency, rate-limit enforcement, leaderboard recalculation, Realtime subscription behavior, admin state-transition guards.

**E2E tests:** Builder signs in and submits → admin approves → voter casts 10 votes → leaderboard reflects results → locked week becomes read-only.

**Acceptance thresholds for validation:**
- Week 1 gets ≥15 approved submissions.
- Week 1 gets ≥100 unique authenticated voters.
- Average authenticated voter reaches ≥8 votes.
- By week 3, ≥60% of week-1 builders submit again.

---

## Rollout Plan

**Week 0:** Create admin-only tooling. Invite 20–30 builders to sign up. Admin marks each as `founding_builder` via the toggle on the Entries tab in `/admin/weeks/[slug]` (or directly via the profiles table in Supabase Studio). No bulk-seed script needed for MVP — the cohort is small enough to toggle manually.

**Week 1 schedule (all times America/Los_Angeles):**
- Thursday 12:00 PM: publish theme, open submissions.
- Sunday 11:59 PM: close submissions.
- Monday 9:00 AM: generate matchups, open voting.
- Wednesday 11:59 PM: close voting.
- Thursday 12:00 PM: lock leaderboard, publish results, start week 2.

**Analytics:** Track traffic with Vercel Analytics. Derive core product metrics from `entries`, `voter_sessions`, and `votes` tables. No third-party event tracking in MVP.

---

## Assumptions and Defaults

- The `src/` directory is empty — this is implemented as a fresh app scaffold.
- **Slug generation:** Week slugs are admin-provided (required field, validated as URL-safe kebab-case). Entry slugs are auto-generated from the entry title: kebab-case + 6-char random suffix (e.g., `my-ai-app-a3f9k2`). Both must be unique.
- **Schema migrations:** Two additional migrations are required before MVP implementation: (1) `ALTER TABLE entries ADD COLUMN rejection_note text`; (2) `ALTER TABLE voter_sessions ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE SET NULL`. These extend the initial migration without replacing it.
- Supabase Storage is preferred over Cloudflare R2 to keep the MVP single-vendor.
- Email magic links are the fallback auth path because they add less scope than maintaining a second social provider.
- The plan intentionally avoids seasons and profiles until the validation thresholds are hit.
- `ADMIN_EMAILS` env var holds a comma-separated list of admin email addresses. No database-level role system.
- Supabase Realtime is used for leaderboard live updates with a 30-second poll fallback if the subscription drops.
- The cron job for automatic week transitions runs on a 1-minute interval (Vercel Cron or Supabase Edge Function scheduler).
- External dependency note: Supabase lists Twitter as a supported social auth provider; X documents OAuth 2.0 user auth with a developer account requirement.
