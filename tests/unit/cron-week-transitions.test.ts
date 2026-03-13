import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(authHeader?: string): NextRequest {
  const headers = new Headers()
  if (authHeader !== undefined) {
    headers.set('authorization', authHeader)
  }
  return {
    headers,
  } as unknown as NextRequest
}

// Minimal week factory
function makeWeek(overrides: Record<string, unknown>) {
  const past = new Date(Date.now() - 1_000).toISOString()
  const future = new Date(Date.now() + 3_600_000).toISOString()
  return {
    id: 'week-1',
    slug: 'week-1',
    themeTitle: 'Test',
    themeDescription: '',
    timezone: 'UTC',
    status: 'draft',
    submissionOpenAt: future,
    submissionCloseAt: future,
    votingOpenAt: future,
    votingCloseAt: future,
    ...overrides,
  }
}

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: `entry-${Math.random()}`,
    weekId: 'week-1',
    status: 'approved',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockSetWeekStatus = vi.fn().mockResolvedValue({})
const mockOpenVoting = vi.fn().mockResolvedValue({ matchupsCreated: 1 })
const mockListWeeks = vi.fn()
const mockGetWeekAdminDetail = vi.fn()

vi.mock('@/lib/server/runtime', () => ({
  getArenaService: () => ({
    listWeeks: mockListWeeks,
    setWeekStatus: mockSetWeekStatus,
    openVoting: mockOpenVoting,
    getWeekAdminDetail: mockGetWeekAdminDetail,
  }),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Import after mock setup
const { GET } = await import('@/app/api/cron/week-transitions/route')

describe('GET /api/cron/week-transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no CRON_SECRET set, first admin email is available
    process.env.ADMIN_ALLOWLIST = 'admin@example.com'
    delete process.env.CRON_SECRET
  })

  it('returns 401 when CRON_SECRET is set and Authorization header is missing', async () => {
    process.env.CRON_SECRET = 'secret-abc'
    mockListWeeks.mockResolvedValue([])

    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
  })

  it('returns 401 when CRON_SECRET is set and Authorization header is wrong', async () => {
    process.env.CRON_SECRET = 'secret-abc'
    mockListWeeks.mockResolvedValue([])

    const res = await GET(makeRequest('Bearer wrong-secret'))

    expect(res.status).toBe(401)
  })

  it('returns 200 with correct Bearer token', async () => {
    process.env.CRON_SECRET = 'secret-abc'
    mockListWeeks.mockResolvedValue([])

    const res = await GET(makeRequest('Bearer secret-abc'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ transitioned: [], skipped: [] })
  })

  it('returns 200 with no CRON_SECRET set (open endpoint)', async () => {
    mockListWeeks.mockResolvedValue([])

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
  })

  it('returns 500 when ADMIN_ALLOWLIST is not configured', async () => {
    delete process.env.ADMIN_ALLOWLIST
    mockListWeeks.mockResolvedValue([])

    const res = await GET(makeRequest())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/ADMIN_ALLOWLIST/i)
  })

  it('transitions draft → submissions_open when submissionOpenAt has passed', async () => {
    const past = new Date(Date.now() - 1_000).toISOString()
    mockListWeeks.mockResolvedValue([makeWeek({ status: 'draft', submissionOpenAt: past })])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(mockSetWeekStatus).toHaveBeenCalledWith({
      adminEmail: 'admin@example.com',
      weekSlug: 'week-1',
      action: 'open_submissions',
    })
    expect(body.transitioned).toHaveLength(1)
    expect(body.transitioned[0]).toMatchObject({ from: 'draft', to: 'submissions_open' })
    expect(body.skipped).toHaveLength(0)
  })

  it('does not transition draft → submissions_open when submissionOpenAt is in the future', async () => {
    const future = new Date(Date.now() + 3_600_000).toISOString()
    mockListWeeks.mockResolvedValue([makeWeek({ status: 'draft', submissionOpenAt: future })])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(mockSetWeekStatus).not.toHaveBeenCalled()
    expect(body.transitioned).toHaveLength(0)
  })

  it('transitions submissions_open → voting_open when votingOpenAt has passed and ≥2 approved entries', async () => {
    const past = new Date(Date.now() - 1_000).toISOString()
    mockListWeeks.mockResolvedValue([
      makeWeek({ status: 'submissions_open', votingOpenAt: past }),
    ])
    mockGetWeekAdminDetail.mockResolvedValue({
      entries: [makeEntry(), makeEntry()],
    })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(mockOpenVoting).toHaveBeenCalledWith({
      adminEmail: 'admin@example.com',
      weekSlug: 'week-1',
    })
    expect(body.transitioned).toHaveLength(1)
    expect(body.transitioned[0]).toMatchObject({
      from: 'submissions_open',
      to: 'voting_open',
    })
  })

  it('skips voting_open transition when <2 approved entries', async () => {
    const past = new Date(Date.now() - 1_000).toISOString()
    mockListWeeks.mockResolvedValue([
      makeWeek({ status: 'submissions_open', votingOpenAt: past }),
    ])
    mockGetWeekAdminDetail.mockResolvedValue({
      entries: [makeEntry()], // only 1 approved entry
    })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(mockOpenVoting).not.toHaveBeenCalled()
    expect(body.transitioned).toHaveLength(0)
    expect(body.skipped).toHaveLength(1)
    expect(body.skipped[0].reason).toMatch(/1 approved entries/i)
  })

  it('transitions voting_open → locked when votingCloseAt has passed', async () => {
    const past = new Date(Date.now() - 1_000).toISOString()
    mockListWeeks.mockResolvedValue([
      makeWeek({ status: 'voting_open', votingCloseAt: past }),
    ])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(mockSetWeekStatus).toHaveBeenCalledWith({
      adminEmail: 'admin@example.com',
      weekSlug: 'week-1',
      action: 'lock_results',
    })
    expect(body.transitioned).toHaveLength(1)
    expect(body.transitioned[0]).toMatchObject({ from: 'voting_open', to: 'locked' })
  })

  it('records a skipped entry when a transition throws an error', async () => {
    const past = new Date(Date.now() - 1_000).toISOString()
    mockListWeeks.mockResolvedValue([makeWeek({ status: 'draft', submissionOpenAt: past })])
    mockSetWeekStatus.mockRejectedValueOnce(new Error('Admin access denied.'))

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.transitioned).toHaveLength(0)
    expect(body.skipped).toHaveLength(1)
    expect(body.skipped[0].reason).toBe('Admin access denied.')
  })
})
