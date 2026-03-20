---
status: ready
type: enhancement
created: 2026-03-15
---
# Quick: real-auth

## Change Description
Replace the mock cookie-based auth with real Supabase Auth using `@supabase/ssr`. Add email magic link sign-in and Twitter/X OAuth. Create Supabase client utilities (server + browser), Next.js middleware for session refresh, an OAuth callback route, and a real login page. The existing `BuilderSession` type and `requireBuilderSession()`/`requireAdminSession()` patterns are preserved — only the session source changes from mock cookies to Supabase `auth.getUser()`. Mock login remains available when `HUBDEV_DATA_MODE=mock`.

## Affected Files
- `src/lib/supabase/server.ts`: NEW — `createClient()` server utility using `@supabase/ssr` + `cookies()`
- `src/lib/supabase/browser.ts`: NEW — `createClient()` browser utility using `createBrowserClient`
- `src/middleware.ts`: NEW — session refresh proxy, no redirect logic (auth enforcement stays in pages)
- `src/app/auth/callback/route.ts`: NEW — OAuth code exchange + email confirm OTP handler
- `src/lib/server/auth.ts`: REWRITE — dual-mode: Supabase `getUser()` when supabase mode, mock cookies when mock mode
- `src/app/login/page.tsx`: REWRITE — real login UI with email magic link form + Twitter OAuth button + mock panel fallback
- `src/components/logout-button.tsx`: UPDATE — call `supabase.auth.signOut()` in supabase mode
- `src/lib/server/vote-request-context.ts`: UPDATE — use Supabase session for userId in supabase mode
- `.env.local.example`: UPDATE — add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` note (same as anon key)

## Acceptance Criteria
### AC-1: Supabase server client works
Given `HUBDEV_DATA_MODE=supabase` / When server code calls `createClient()` from `supabase/server.ts` / Then it returns a Supabase client with cookie-based session handling

### AC-2: Middleware refreshes sessions
Given a user with an active session / When they make any request / Then middleware refreshes the session token transparently without redirecting

### AC-3: Email magic link sign-in
Given the login page / When user enters email and submits / Then Supabase sends a magic link, and clicking it exchanges the token via `/auth/callback` and creates a session

### AC-4: Twitter OAuth sign-in
Given the login page / When user clicks "Sign in with X" / Then they are redirected to Twitter OAuth, and on return the code is exchanged via `/auth/callback`

### AC-5: Protected routes still work
Given `requireBuilderSession()` / When called in supabase mode / Then it reads the Supabase session via `getUser()`, maps to `BuilderSession`, and redirects if not authenticated

### AC-6: Admin access enforced
Given `requireAdminSession()` / When the authenticated user's email is NOT in `ADMIN_ALLOWLIST` / Then they are redirected away from admin routes

### AC-7: Mock mode preserved
Given `HUBDEV_DATA_MODE=mock` / When user visits `/login` / Then the mock login panel with demo profiles is shown (existing behavior unchanged)

### AC-8: Logout works in both modes
Given a signed-in user / When they click sign out / Then the session is destroyed (Supabase `signOut()` or mock cookie clear) and they are redirected to `/`

## must_haves
truths: ["createClient() server uses @supabase/ssr createServerClient with cookies()", "middleware.ts only refreshes sessions — no redirect logic", "auth/callback handles both OAuth code exchange and email OTP verification", "BuilderSession type is unchanged", "requireBuilderSession and requireAdminSession work in both mock and supabase modes", "Mock login remains functional when HUBDEV_DATA_MODE=mock"]
artifacts: ["src/lib/supabase/server.ts", "src/lib/supabase/browser.ts", "src/middleware.ts", "src/app/auth/callback/route.ts"]
key_links: ["createServerClient", "createBrowserClient", "auth.getUser()", "auth.signInWithOtp", "auth.signInWithOAuth", "exchangeCodeForSession", "verifyOtp"]

## Detected Conventions
- `BuilderSession` type: `{ userId, email, displayName, isAdmin }` — used across all protected routes
- `requireBuilderSession(nextPath?)` redirects to `/login?next={nextPath}` if not authenticated
- `requireAdminSession(nextPath?)` checks admin email allowlist after session check
- `getBuilderSession()` returns `BuilderSession | null` — used for optional auth (layout, home, vote)
- `resolveLoginRedirectPath()` validates `next` param to prevent open redirects
- Mock mode uses signed cookies (`va-builder`) via `HUBDEV_COOKIE_SECRET`
- Vote context derives `userId` + `fingerprintHash` from builder session
- Server actions in `admin/actions.ts` use `requireAdminSession()` for all admin mutations
- `@supabase/ssr` v0.9.0 and `@supabase/supabase-js` v2.99.0 already installed
