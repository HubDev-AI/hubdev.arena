# HubDev Arena

HubDev Arena is a weekly challenge platform for AI-built apps. Builders submit one app per week, voters sign in to vote, and the weekly leaderboard updates live with head-to-head ELO scoring.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase for auth, Postgres, storage, and SQL functions
- Vercel for hosting and analytics
- Optional sec4 internal vote engine boundary for vote serving, vote writes, and leaderboard reads

## Local development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

To use the local mock runtime:

```bash
HUBDEV_DATA_MODE=mock npm run dev
```

Open `http://localhost:3000`.

## Environment variables

- `HUBDEV_DATA_MODE`
- `HUBDEV_COOKIE_SECRET`
- `HUBDEV_FINGERPRINT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SEC4_INTERNAL_BASE_URL`
- `SEC4_INTERNAL_TOKEN`
- `ADMIN_ALLOWLIST`

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Domain

Primary brand domain: `hubdev.ai`
