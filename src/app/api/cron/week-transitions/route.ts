import { NextResponse, type NextRequest } from 'next/server'
import { getArenaService } from '@/lib/server/runtime'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Use the first entry of ADMIN_ALLOWLIST as the service caller identity
  const adminEmail = (process.env.ADMIN_ALLOWLIST ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)[0]

  if (!adminEmail) {
    return NextResponse.json({ error: 'ADMIN_ALLOWLIST not configured' }, { status: 500 })
  }

  const now = new Date()
  const arenaService = getArenaService()
  const weeks = await arenaService.listWeeks()

  const activeWeeks = weeks.filter((w) =>
    ['draft', 'submissions_open', 'voting_open'].includes(w.status),
  )

  const transitioned: Array<{ weekSlug: string; from: string; to: string }> = []
  const skipped: Array<{ weekSlug: string; reason: string }> = []

  for (const week of activeWeeks) {
    try {
      if (week.status === 'draft' && new Date(week.submissionOpenAt) <= now) {
        await arenaService.setWeekStatus({
          adminEmail,
          weekSlug: week.slug,
          action: 'open_submissions',
        })
        transitioned.push({ weekSlug: week.slug, from: 'draft', to: 'submissions_open' })
      } else if (week.status === 'submissions_open' && new Date(week.votingOpenAt) <= now) {
        // Check ≥2 approved entries before opening voting
        const detail = await arenaService.getWeekAdminDetail(week.slug)
        const approvedCount = detail.entries.filter((e) => e.status === 'approved').length

        if (approvedCount < 2) {
          skipped.push({
            weekSlug: week.slug,
            reason: `Only ${approvedCount} approved entries (need ≥2 to open voting)`,
          })
          continue
        }

        await arenaService.openVoting({ adminEmail, weekSlug: week.slug })
        transitioned.push({ weekSlug: week.slug, from: 'submissions_open', to: 'voting_open' })
      } else if (week.status === 'voting_open' && new Date(week.votingCloseAt) <= now) {
        await arenaService.setWeekStatus({
          adminEmail,
          weekSlug: week.slug,
          action: 'lock_results',
        })
        transitioned.push({ weekSlug: week.slug, from: 'voting_open', to: 'locked' })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[cron] Failed to transition week ${week.slug}: ${message}`)
      skipped.push({ weekSlug: week.slug, reason: message })
    }
  }

  return NextResponse.json({ transitioned, skipped })
}
