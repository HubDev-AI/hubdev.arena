# UX Audit Report — HubDev Arena

**Date:** 2026-03-20
**Audited by:** 5 parallel UX research agents
**Total findings:** 161

## Summary by Severity

| Severity | Count |
|----------|-------|
| CRITICAL | 14 |
| HIGH | 41 |
| MEDIUM | 62 |
| LOW | 44 |

---

## CRITICAL Findings (14)

### Data Integrity & Voting System
| # | Area | Finding | File |
|---|------|---------|------|
| C1 | Vote Engine | **Race condition in `castVote`** — non-atomic read-modify-write on ELO ratings. Two concurrent votes on the same entry will lose one ELO update. | `arena-service.ts:535-657` |
| C2 | Vote Engine | **Race condition in `getVoteDeck`** — exposure count and appearance count increment without locking, skewing matchup fairness. | `arena-service.ts:430-533` |
| C3 | Vote Engine | **Partial failure leaves inconsistent state** — `castVote` writes ELO and matchup before saving the vote record. Crash between writes = corrupted leaderboard. | `arena-service.ts:628-650` |

### Vote Page
| # | Area | Finding | File |
|---|------|---------|------|
| C4 | Vote Client | **Vote count resets to 0 on page reload** — `votesCompleted` is `useState(0)`, ignoring server-side `votesCast`. Users bypass the 10-vote session limit by refreshing. | `vote-client.tsx:55,163` |
| C5 | Vote Client | **No feedback for rate-limiting errors** — HTTP 429 shown as generic error. No countdown, no distinction between rate limit tiers, no retry guidance. | `vote-client.tsx:145-148` |

### Submit Page
| # | Area | Finding | File |
|---|------|---------|------|
| C6 | Submit Form | **No preview of uploaded demo asset** — users upload up to 50MB files blind with no thumbnail or video preview before submission. | `submit-form.tsx:142-150` |
| C7 | Submit Form | **Silent overwrite of existing pending entry** — re-submitting replaces the previous entry with zero warning. Builders expect to create a second entry. | `arena-service.ts:238-246` |

### Homepage
| # | Area | Finding | File |
|---|------|---------|------|
| C8 | Homepage | **Featured entrants shows odd number (3)** — `leaderboard.slice(0, 3)` creates orphan card at `sm` breakpoint (2-col grid). No guard for <3 entries. | `page.tsx:114` |
| C9 | Homepage | **K-factor contradiction** — homepage says K=32, rules page says K=24. Direct factual conflict visible to any user who reads both pages. | `page.tsx:426` vs `rules/page.tsx:72` |

### My Submissions
| # | Area | Finding | File |
|---|------|---------|------|
| C10 | My Submissions | **No edit or delete capabilities** — purely read-only. Builders cannot correct typos, update URLs, or withdraw entries. | `my-submissions/page.tsx:61-98` |
| C11 | My Submissions | **No pagination or limit** — fetches ALL entries for all weeks with no pagination. Degrades with long-term use. | `arena-service.ts:707-725` |

### Auth
| # | Area | Finding | File |
|---|------|---------|------|
| C12 | Auth | **No middleware for Supabase session refresh** — no `middleware.ts` exists. Expired JWTs silently lose session on next server render. Users lose work mid-task. | No file exists |

### Leaderboard
| # | Area | Finding | File |
|---|------|---------|------|
| C13 | Leaderboard | **Not a semantic table** — built from `<div>` elements. Screen readers cannot navigate as tabular data. | `leaderboard-table.tsx` |
| C14 | Leaderboard | **No pagination or virtual scrolling** — ALL entries rendered in a flat list. No limit parameter in API. | `leaderboard-table.tsx`, `api/leaderboard/route.ts` |

---

## HIGH Findings (41)

### Vote Flow (10)
| # | Finding | File |
|---|---------|------|
| H1 | **Success toast is invisible** — animates above viewport with 600ms auto-dismiss. Most users never see vote confirmation. | `vote-client.tsx:209-215` |
| H2 | **No highlight of picked entry** — cards instantly swap to skeletons after voting. No confirmation of which entry was chosen. | `vote-client.tsx:156-169` |
| H3 | **Both "Pick this app" buttons identical** for screen readers — no `aria-label` distinguishing left/right entries. | `vote-client.tsx:308` |
| H4 | **No keyboard shortcuts for power voters** — every vote requires mouse click, no arrow keys or number keys. | `vote-client.tsx` |
| H5 | **Completion screen shows wrong count** after mid-session reload (due to C4). | `vote-client.tsx:182` |
| H6 | **"Vote 10 more" bypasses server rate limit check** — resets client counter without verifying server-side remaining quota. | `vote-client.tsx:193-198` |
| H7 | **Idempotency-key conflict shown as generic error** — no retry logic or new key generation. | `vote-client.tsx:141` |

### Submit Flow (4)
| # | Finding | File |
|---|---------|------|
| H8 | **No upload progress indicator** for files up to 50MB — only static "Uploading asset..." text. | `submit-form.tsx:34-51,160` |
| H9 | **Success message buried below the fold** — renders at form bottom after fields are cleared. | `submit-form.tsx:168-174` |
| H10 | **No confirmation dialog before submission** — one click consumes the weekly submission slot. | `submit-form.tsx:155-164` |
| H11 | **Zod validation errors not rendered field-by-field** — API returns structured field errors, client shows only generic message. | `submit-form.tsx:77` |

### Admin (7)
| # | Finding | File |
|---|---------|------|
| H12 | **"Open submissions" and "Generate matchups" have no confirmation** — unlike Lock/Archive which do. Generating matchups wipes existing votes. | `admin/weeks/[slug]/page.tsx:101-117` |
| H13 | **No admin ability to delete or edit a week** — no `deleteWeek` in repository. Typos in week title permanent. | `admin/actions.ts` |
| H14 | **No admin ability to delete or edit entries** — spam/test entries cannot be removed once approved. | `admin/weeks/[slug]/page.tsx` |
| H15 | **Server Action errors redacted in production** — raw `Error` thrown, Next.js strips message. Admin sees "An error occurred." | `admin/actions.ts:27-53` |
| H16 | **Server Action errors for review/open/lock/archive completely unhandled** on client — no error UI at all. | `admin/actions.ts:55-113` |
| H17 | **No loading/pending indicators on admin action buttons** — no `useFormStatus`, buttons remain clickable during processing. | `admin/weeks/[slug]/page.tsx` |
| H18 | **Cron job uses "cron@system" email** which must be in admin allowlist or all automated transitions silently fail. | `api/cron/week-transitions/route.ts:32-52` |

### Performance (2)
| # | Finding | File |
|---|---------|------|
| H19 | **FilmGrain runs rAF continuously** — 256x256 pixel noise every frame at 0.03 opacity. Significant CPU cost, barely visible. | `film-grain.tsx` |
| H20 | **Multiple concurrent canvas animations stacking** — ParticleField (O(n^2) connections), AuroraBg, FilmGrain, MatrixRain on same page. | Homepage |

### Accessibility (5)
| # | Finding | File |
|---|---------|------|
| H21 | **No `prefers-reduced-motion` support** across ANY animation component (8 components). WCAG 2.1 AA failure. | All animation components |
| H22 | **Mobile menu has no focus trap** — keyboard users tab out into page content. No `role="dialog"`, no body scroll lock. | `mobile-menu.tsx` |
| H23 | **Leaderboard rows have no keyboard focus** — plain `<div>` with hover only. Not tabbable, no focus indicator. | `leaderboard-table.tsx` |
| H24 | **ProgressRing SVG has no accessible text** — no `<title>`, no `aria-label`, no `role="img"`. | `progress-ring.tsx` |

### Leaderboard & Entry (4)
| # | Finding | File |
|---|---------|------|
| H25 | **No week selector** — hardcoded to current week. No way to view historical leaderboards. | `leaderboard/page.tsx` |
| H26 | **No `loading.tsx`** for leaderboard or entry detail — blank screen during server fetch. | Missing files |
| H27 | **No custom not-found page** for entry detail — generic "page not found" with no context. | `entry/[slug]/page.tsx:63-65` |
| H28 | **Entry detail page has no live data** — shows `LiveBadge` but data is static server snapshot. | `entry/[slug]/page.tsx:133` |

### Auth & My Submissions (5)
| # | Finding | File |
|---|---------|------|
| H29 | **Login error message is vague** — single "Authentication failed" covers 4+ distinct failure scenarios. | `login/page.tsx:60-64` |
| H30 | **No loading indicator on OAuth button** — no spinner or disabled state during redirect. | `login-form.tsx:34-52` |
| H31 | **No `loading.tsx` for my-submissions** — blank page during async server calls. | Missing file |
| H32 | **No error boundary for my-submissions** — unhandled throw shows default Next.js error. | Missing file |
| H33 | **No links from submission entries to detail pages** — builders can't preview how their entry looks to voters. | `my-submissions/page.tsx:73-95` |

### Other (2)
| # | Finding | File |
|---|---------|------|
| H34 | **Live activity feed mixes fake/mock events with real data** — "Live" label with green dot is deceptive. | `live-pulse.tsx:136-148` |
| H35 | **Homepage CTAs confusing** — logged-out user sees "Start Voting" (needs auth) and "Sign in" (unclear what for). | `page.tsx:168` |

### Voting API (1)
| # | Finding | File |
|---|---------|------|
| H36 | **`getVoteDeck` null returns 404** — semantically wrong. "All voted" is not a missing resource. | `api/vote/next/route.ts:27` |

### My Submissions UX (3)
| # | Finding | File |
|---|---------|------|
| H37 | **No sorting or ordering** for submission groups — no date sort, no status filter. | `arena-service.ts:715-724` |
| H38 | **Dev login has no CSRF protection** — any cross-origin page can POST to impersonate demo users. | `api/dev/login/route.ts:8-37` |
| H39 | **EloChange component defined but never used** — live ELO movement never shown to users despite component existing. | `elo-change.tsx` |

### Magic Link (2)
| # | Finding | File |
|---|---------|------|
| H40 | **Magic link confirmation lacks expiry info, spam guidance, and resend button.** | `login-form.tsx:54-81` |
| H41 | **Error message positioning disconnected from trigger** — error appears below email form when OAuth button fails. | `login-form.tsx:126-128` |

---

## MEDIUM Findings (62)

### Vote & Submit UX
| # | Finding |
|---|---------|
| M1 | `votingClosesAt` timestamp fetched but never displayed to users |
| M2 | No "Skip this matchup" option — forced to pick when both entries are poor |
| M3 | Error state has no retry button |
| M4 | Success toast has no ARIA live region (errors do) |
| M5 | "Open app" link opens new tab with no visual indicator |
| M6 | Two videos could autoplay simultaneously on vote page |
| M7 | VS badge overlaps card content on desktop depending on card height |
| M8 | TiltCard/SpotlightCard effects are mouse-only — no keyboard/touch equivalent |
| M9 | No focus management after state transitions on vote page |
| M10 | No loading state distinction between first matchup and subsequent fetches |
| M11 | Client-side validation inconsistent with server-side Zod rules |
| M12 | No file type/size info shown before upload attempt |
| M13 | Form state lost if user navigates away |
| M14 | Character counters use color alone to indicate warning threshold |
| M15 | No link to submissions list from submit success state |
| M16 | Orphaned file in storage if submission API call fails after upload |

### Admin
| # | Finding |
|---|---------|
| M17 | Stats row jumps from 1-col to 4-col with no intermediate breakpoint |
| M18 | Mock seed matchup `voteCount` totals don't reconcile with entry-level stats |
| M19 | No pagination on admin weeks list page |
| M20 | No pagination on entries list in admin week detail |
| M21 | "Open voting" button shown without checking minimum entry count |
| M22 | No admin dashboard — `/admin` gives 404 |
| M23 | Week date validation doesn't enforce chronological ordering |
| M24 | Dev reset doesn't invalidate cached service instance |
| M25 | `castVote` voter session has potential double-increment bug on conflict |
| M26 | `ConfirmForm` uses `window.confirm()` — not styleable, accessibility issues |
| M27 | Admin week detail shows no leaderboard or matchup details |
| M28 | No "back to admin" breadcrumb navigation beyond single "All weeks" link |

### Homepage & Rules
| # | Finding |
|---|---------|
| M29 | Duplicate audio synthesis components (MusicVisualizer + AmbientMusic) |
| M30 | Countdown "Time's up" has no actionable guidance |
| M31 | Rules page CTA uses `<a>` instead of Next.js `<Link>` — full page reload |
| M32 | FAQ section not collapsible, unusual 2-col reading order |
| M33 | Countdown digits lack screen reader context — no `aria-live` |
| M34 | Extremely small text (8-10px) used for badges, labels, nav |
| M35 | ParticleField has `pointer-events-none` but registers mousemove — dead code |
| M36 | Past winners section has no builder name, no link to entry |
| M37 | LivePulse timestamps don't update after initial render |
| M38 | Mobile menu close button uses literal "X" text instead of icon |
| M39 | Header nav breakpoint mismatch — hybrid state between 640-768px |
| M40 | MagneticButton wrapping Link creates nested interactive elements |

### Leaderboard & Entry
| # | Finding |
|---|---------|
| M41 | Redundant display of ELO in three places on entry detail |
| M42 | Leaderboard error state has no retry button |
| M43 | LiveLeaderboard silently swallows fetch errors — stale data with green "Live" badge |
| M44 | Inline `<style>` tag per EloChange instance — duplicate keyframes |
| M45 | No ELO explanation for first-time users |
| M46 | Demo media area too short (192-256px) for app screenshots — no lightbox |
| M47 | Video autoplay may be disruptive and bandwidth-heavy |
| M48 | LiveLeaderboard creates new Supabase client on every mount |
| M49 | Color-only differentiation for win/loss (green/red) |
| M50 | "Open" button uses `safeHref` but broken URLs still render as clickable |
| M51 | Entry detail has no link back preserving leaderboard scroll position |
| M52 | AnimatedCounter shows 0 briefly before animating — "ELO 0" flash |
| M53 | ProgressRing gradient ID collision if multiple rendered |

### Auth & My Submissions
| # | Finding |
|---|---------|
| M54 | No client-side email validation beyond HTML5 `type="email"` |
| M55 | Login form lacks `aria-live` for state changes (sent, loading) |
| M56 | Mock login buttons have no accessible indication of which user is loading |
| M57 | Login page hero text may overflow on very narrow screens (320px) |
| M58 | Week status labels show raw database enum values |
| M59 | Empty state for no submissions is minimal — no theme info, no motivation |
| M60 | No performance stats (ELO, votes, rank) on submissions page |
| M61 | Entry status colors rely solely on color to convey meaning |
| M62 | Logout button has no confirmation dialog |

---

## LOW Findings (44)

<details>
<summary>Click to expand all 44 LOW findings</summary>

### Vote & Submit
- L1: No undo for accidental vote
- L2: "Signed-in voting streak" label confusing — means session progress, not daily streak
- L3: Completion screen CTA hierarchy pushes users to leaderboard over voting more
- L4: `loadNextMatchup` duplicates logic from `hydrateMatchup` in useEffect
- L5: "10 matchups" marketing copy misleading — users can vote unlimited sets of 10
- L6: "Open week" theme card may have poor contrast (`--ink` on dark background)
- L7: Submit form lacks `aria-describedby` linking errors to fields

### Homepage & Rules
- L8: AnimatedCounter used for static value 1200 — implies it's dynamic
- L9: TiltCard/SpotlightCard effects invisible on touch devices — wasted GPU layers
- L10: GlitchText effect could cause discomfort — no disable mechanism
- L11: Rules page has no link to vote page or leaderboard from page content
- L12: MatrixRain uses non-clearing canvas — potential memory pressure, blurry on Retina
- L13: LivePulse shows "Connecting to arena..." briefly before mock events seed
- L14: Rules "10 head-to-head picks" undefined behavior — what if fewer? daily limit?

### Leaderboard & Entry
- L15: Leaderboard CTA assumes voting is always open — no status awareness
- L16: No entry thumbnail in leaderboard rows
- L17: "Vote in matchups" sidebar button is generic, not entry-specific
- L18: "10 head-to-head picks per session" hardcoded in CTA text
- L19: Stat boxes show raw numbers with no trend or comparison
- L20: Breadcrumb on entry detail lacks `<ol>` list semantics
- L21: Leaderboard page calls `getArenaService()` twice
- L22: Total votes calculation assumes each vote involves exactly 2 entries

### Auth & My Submissions
- L23: Login redirect doesn't preserve query params or hash fragments
- L24: Mock mode explanatory text uses developer jargon
- L25: Logout redirects to homepage instead of login with success message
- L26: Mobile menu has no focus trap (duplicate of H22 but from auth audit)
- L27: No skip-to-content link in header
- L28: Inconsistent labels: "Entries" (desktop) vs "My Entries" (mobile) vs "My Submissions" (page title)
- L29: Logout error displayed in 10px font — extremely difficult to read

### Admin
- L30: Create week form: description at bottom after date pickers
- L31: `ConfirmForm` action prop typed as sync `void` instead of `Promise<void>`
- L32: Week slug on list page is tiny (10px) and positioned far right
- L33: No visual indicator of which week is currently active
- L34: `stripHtml` is a naive regex — false sense of security
- L35: `getVoteDeck` makes sequential calls that could be parallelized
- L36: Admin entry moderation shows no builder name or rejection reason
- L37: "Open app" falls back to `#` for invalid URLs with no indication
- L38: `CRON_SECRET` optional but silently rejects all cron if unset
- L39: No admin role indicator in UI
- L40: Date/time pickers have no timezone helper text
- L41: Cron skips voting when <2 entries but only logs to response body — no admin notification
- L42: MusicVisualizer aria-label inconsistent with AmbientMusic
- L43: Audio volume closure stale in startAudio callback
- L44: No homepage pagination/link directly below leaderboard preview table

</details>

---

## Top 10 Recommendations (Priority Order)

### Immediate (Data Integrity)
1. **Wrap `castVote` in a transaction** — atomic ELO update + vote record save. Use Supabase RPC for production, add locking for in-memory repo.
2. **Fix vote count persistence** — initialize `votesCompleted` from server-side `votesCast` to prevent session bypass on reload.

### High Impact (Core UX Flows)
3. **Make the vote success toast visible** — position below the card, increase display time to 1.5s, add `aria-live`.
4. **Add demo asset preview** on submit form before submission.
5. **Warn about entry overwrite** — check for existing pending entry and display clear notice.
6. **Fix K-factor inconsistency** — decide K=24 or K=32, update both pages.
7. **Add Supabase auth middleware** — create `middleware.ts` for session refresh on every request.

### High Impact (Admin & Polish)
8. **Add error handling to all admin Server Actions** — use `useFormState` to capture and display errors.
9. **Add `loading.tsx` skeletons** for leaderboard, entry detail, and my-submissions pages.
10. **Add `prefers-reduced-motion` support** to all 8 animation components.

---

## Findings by Area

| Area | CRIT | HIGH | MED | LOW | Total |
|------|------|------|-----|-----|-------|
| Vote Flow | 2 | 7 | 10 | 5 | 24 |
| Submit Flow | 2 | 4 | 6 | 2 | 14 |
| Homepage & Rules | 2 | 3 | 12 | 7 | 24 |
| Leaderboard & Entry | 2 | 4 | 13 | 8 | 27 |
| Admin | 0 | 7 | 12 | 12 | 31 |
| Auth & My Submissions | 3 | 7 | 9 | 7 | 26 |
| Data/Service Layer | 3 | 2 | 0 | 3 | 8 |
| Accessibility (cross-cutting) | 0 | 4 | 0 | 3 | 7 |
