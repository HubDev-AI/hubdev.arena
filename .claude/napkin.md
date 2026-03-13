# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-03-10 | self | Tried to run `create-next-app` in a non-empty repo after creating `.claude/napkin.md` first | Scaffold in a temporary directory, then sync files into the repo when a memory file already exists |
| 2026-03-10 | self | Used `mktemp` default output for a `create-next-app` temp dir and hit package-name validation on uppercase characters | Use an explicit lowercase temp directory name when scaffolding Next.js apps |
| 2026-03-10 | self | Started a long `npm install` in TTY mode and it stalled without producing useful output | Prefer non-TTY installs for package setup unless an interactive prompt is expected |

## User Preferences
- Implement directly from the provided plan rather than pausing for more design work.
- Keep the MVP scoped to validation-first requirements; avoid speculative extras.
- Treat voting as an authenticated action too; builders and voters should use the same sign-in system in the MVP.

## Patterns That Work
- Treat the user-supplied MVP spec as the approved design baseline when the requirements are explicit and locked down.

## Patterns That Don't Work
- Assuming empty-repo scaffolds can skip project memory; this repo still needs a napkin from the first turn.

## Domain Notes
- Repo started empty on 2026-03-10.
- Target stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Vercel.
- Core product shape: weekly themed builder submission + authenticated head-to-head voting with live ELO leaderboard.
- Local AILang tutorial reference on the hybrid sec4 architecture shifts the preferred backend boundary to a hybrid model: Next/Supabase shell plus sec4-owned vote engine endpoints for matchup serving, vote transactions, and leaderboard queries.
