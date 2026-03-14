import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ArenaRepository,
  Entry,
  EntryStatus,
  Matchup,
  Profile,
  Vote,
  VoterSession,
  Week,
} from './types'

// ---------------------------------------------------------------------------
// DB row types (snake_case, as returned by Supabase)
// ---------------------------------------------------------------------------

type DbProfile = {
  id: string
  display_name: string
  username: string | null
  avatar_url: string | null
  auth_provider: string
  founding_builder: boolean
  created_at: string
  updated_at: string
  email?: string
}

type DbWeek = {
  id: string
  slug: string
  theme_title: string
  theme_description: string
  timezone: string
  submission_open_at: string
  submission_close_at: string
  voting_open_at: string
  voting_close_at: string
  status: string
  created_at: string
  updated_at: string
}

type DbEntry = {
  id: string
  week_id: string
  builder_id: string
  slug: string
  title: string
  one_liner: string
  live_url: string
  demo_asset_path: string
  status: string
  elo_rating: number
  wins: number
  losses: number
  appearance_count: number
  submitted_at: string
  approved_at: string | null
  rejected_at: string | null
  rejection_note: string | null
  created_at: string
  updated_at: string
}

type DbMatchup = {
  id: string
  week_id: string
  entry_a_id: string
  entry_b_id: string
  exposure_count: number
  vote_count: number
  created_at: string
  updated_at: string
}

type DbVoterSession = {
  id: string
  week_id: string
  user_id: string | null
  cookie_id: string
  fingerprint_hash: string
  votes_cast: number
  last_seen_at: string
  created_at: string
  updated_at: string
}

type DbVote = {
  id: string
  week_id: string
  matchup_id: string
  winner_entry_id: string
  loser_entry_id: string
  voter_session_id: string
  fingerprint_hash: string
  idempotency_key: string
  created_at: string
}

// ---------------------------------------------------------------------------
// DB → TS mappers
// ---------------------------------------------------------------------------

function mapProfile(row: DbProfile): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    username: row.username ?? '',
    avatarUrl: row.avatar_url,
    authProvider: row.auth_provider as Profile['authProvider'],
    foundingBuilder: row.founding_builder,
    createdAt: row.created_at,
  }
}

function mapWeek(row: DbWeek): Week {
  return {
    id: row.id,
    slug: row.slug,
    themeTitle: row.theme_title,
    themeDescription: row.theme_description,
    timezone: row.timezone,
    submissionOpenAt: row.submission_open_at,
    submissionCloseAt: row.submission_close_at,
    votingOpenAt: row.voting_open_at,
    votingCloseAt: row.voting_close_at,
    status: row.status as Week['status'],
  }
}

function mapEntry(row: DbEntry): Entry {
  return {
    id: row.id,
    weekId: row.week_id,
    builderId: row.builder_id,
    slug: row.slug,
    title: row.title,
    oneLiner: row.one_liner,
    liveUrl: row.live_url,
    demoAssetPath: row.demo_asset_path,
    status: row.status as EntryStatus,
    eloRating: row.elo_rating,
    wins: row.wins,
    losses: row.losses,
    appearanceCount: row.appearance_count,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    rejectionNote: row.rejection_note,
  }
}

function mapMatchup(row: DbMatchup): Matchup {
  return {
    id: row.id,
    weekId: row.week_id,
    entryAId: row.entry_a_id,
    entryBId: row.entry_b_id,
    exposureCount: row.exposure_count,
    voteCount: row.vote_count,
    createdAt: row.created_at,
  }
}

function mapVoterSession(row: DbVoterSession): VoterSession {
  return {
    id: row.id,
    weekId: row.week_id,
    userId: row.user_id,
    cookieId: row.cookie_id,
    fingerprintHash: row.fingerprint_hash,
    votesCast: row.votes_cast,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  }
}

function mapVote(row: DbVote): Vote {
  return {
    id: row.id,
    weekId: row.week_id,
    matchupId: row.matchup_id,
    winnerEntryId: row.winner_entry_id,
    loserEntryId: row.loser_entry_id,
    voterSessionId: row.voter_session_id,
    fingerprintHash: row.fingerprint_hash,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------------------
// TS → DB converters (for inserts/updates)
// ---------------------------------------------------------------------------

function toDbProfile(p: Profile): Omit<DbProfile, 'updated_at'> {
  return {
    id: p.id,
    display_name: p.displayName,
    username: p.username || null,
    avatar_url: p.avatarUrl,
    auth_provider: p.authProvider,
    founding_builder: p.foundingBuilder,
    created_at: p.createdAt,
    ...(p.email !== undefined ? { email: p.email } : {}),
  }
}

function toDbWeek(w: Week): Omit<DbWeek, 'updated_at'> {
  return {
    id: w.id,
    slug: w.slug,
    theme_title: w.themeTitle,
    theme_description: w.themeDescription,
    timezone: w.timezone,
    submission_open_at: w.submissionOpenAt,
    submission_close_at: w.submissionCloseAt,
    voting_open_at: w.votingOpenAt,
    voting_close_at: w.votingCloseAt,
    status: w.status,
    created_at: new Date().toISOString(),
  }
}

function toDbEntry(e: Entry): Omit<DbEntry, 'updated_at'> {
  return {
    id: e.id,
    week_id: e.weekId,
    builder_id: e.builderId,
    slug: e.slug,
    title: e.title,
    one_liner: e.oneLiner,
    live_url: e.liveUrl,
    demo_asset_path: e.demoAssetPath,
    status: e.status,
    elo_rating: e.eloRating,
    wins: e.wins,
    losses: e.losses,
    appearance_count: e.appearanceCount,
    submitted_at: e.submittedAt,
    approved_at: e.approvedAt,
    rejected_at: e.rejectedAt,
    rejection_note: e.rejectionNote,
    created_at: new Date().toISOString(),
  }
}

function toDbMatchup(m: Matchup): Omit<DbMatchup, 'updated_at'> {
  return {
    id: m.id,
    week_id: m.weekId,
    entry_a_id: m.entryAId,
    entry_b_id: m.entryBId,
    exposure_count: m.exposureCount,
    vote_count: m.voteCount,
    created_at: m.createdAt,
  }
}

function toDbVoterSession(s: VoterSession): Omit<DbVoterSession, 'updated_at'> {
  return {
    id: s.id,
    week_id: s.weekId,
    user_id: s.userId,
    cookie_id: s.cookieId,
    fingerprint_hash: s.fingerprintHash,
    votes_cast: s.votesCast,
    last_seen_at: s.lastSeenAt,
    created_at: s.createdAt,
  }
}

function toDbVote(v: Vote): DbVote {
  return {
    id: v.id,
    week_id: v.weekId,
    matchup_id: v.matchupId,
    winner_entry_id: v.winnerEntryId,
    loser_entry_id: v.loserEntryId,
    voter_session_id: v.voterSessionId,
    fingerprint_hash: v.fingerprintHash,
    idempotency_key: v.idempotencyKey,
    created_at: v.createdAt,
  }
}

// ---------------------------------------------------------------------------
// Helper: treat PGRST116 (no rows) as null rather than an error
// ---------------------------------------------------------------------------

function isNotFound(error: { code: string }): boolean {
  return error.code === 'PGRST116'
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSupabaseArenaRepository(client: SupabaseClient): ArenaRepository {
  return {
    // -----------------------------------------------------------------------
    // Profiles
    // -----------------------------------------------------------------------
    async listProfiles() {
      const { data, error } = await client.from('profiles').select('*')
      if (error) throw error
      return (data as DbProfile[]).map(mapProfile)
    },

    async getProfileById(profileId) {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()
      if (error) {
        if (isNotFound(error)) return null
        throw error
      }
      return mapProfile(data as DbProfile)
    },

    async saveProfile(profile) {
      const { data, error } = await client
        .from('profiles')
        .upsert(toDbProfile(profile))
        .select()
        .single()
      if (error) throw error
      return mapProfile(data as DbProfile)
    },

    // -----------------------------------------------------------------------
    // Weeks
    // -----------------------------------------------------------------------
    async listWeeks() {
      const { data, error } = await client.from('weeks').select('*')
      if (error) throw error
      return (data as DbWeek[]).map(mapWeek)
    },

    async getWeekBySlug(slug) {
      const { data, error } = await client
        .from('weeks')
        .select('*')
        .eq('slug', slug)
        .single()
      if (error) {
        if (isNotFound(error)) return null
        throw error
      }
      return mapWeek(data as DbWeek)
    },

    async saveWeek(week) {
      const { data, error } = await client
        .from('weeks')
        .upsert(toDbWeek(week))
        .select()
        .single()
      if (error) throw error
      return mapWeek(data as DbWeek)
    },

    // -----------------------------------------------------------------------
    // Entries
    // -----------------------------------------------------------------------
    async listEntriesByWeek(weekId) {
      const { data, error } = await client
        .from('entries')
        .select('*')
        .eq('week_id', weekId)
      if (error) throw error
      return (data as DbEntry[]).map(mapEntry)
    },

    async listEntriesByBuilder(weekId, builderId) {
      const { data, error } = await client
        .from('entries')
        .select('*')
        .eq('week_id', weekId)
        .eq('builder_id', builderId)
      if (error) throw error
      return (data as DbEntry[]).map(mapEntry)
    },

    async listEntriesByIds(entryIds) {
      if (entryIds.length === 0) return []
      const { data, error } = await client
        .from('entries')
        .select('*')
        .in('id', entryIds)
      if (error) throw error
      return (data as DbEntry[]).map(mapEntry)
    },

    async getEntryById(entryId) {
      const { data, error } = await client
        .from('entries')
        .select('*')
        .eq('id', entryId)
        .single()
      if (error) {
        if (isNotFound(error)) return null
        throw error
      }
      return mapEntry(data as DbEntry)
    },

    async getEntryBySlug(entrySlug) {
      const { data, error } = await client
        .from('entries')
        .select('*')
        .eq('slug', entrySlug)
        .single()
      if (error) {
        if (isNotFound(error)) return null
        throw error
      }
      return mapEntry(data as DbEntry)
    },

    async saveEntry(entry) {
      const { data, error } = await client
        .from('entries')
        .upsert(toDbEntry(entry))
        .select()
        .single()
      if (error) throw error
      return mapEntry(data as DbEntry)
    },

    // -----------------------------------------------------------------------
    // Matchups
    // -----------------------------------------------------------------------
    async listMatchupsByWeek(weekId) {
      const { data, error } = await client
        .from('matchups')
        .select('*')
        .eq('week_id', weekId)
      if (error) throw error
      return (data as DbMatchup[]).map(mapMatchup)
    },

    async getMatchupById(matchupId) {
      const { data, error } = await client
        .from('matchups')
        .select('*')
        .eq('id', matchupId)
        .single()
      if (error) {
        if (isNotFound(error)) return null
        throw error
      }
      return mapMatchup(data as DbMatchup)
    },

    async saveMatchup(matchup) {
      const { data, error } = await client
        .from('matchups')
        .upsert(toDbMatchup(matchup))
        .select()
        .single()
      if (error) throw error
      return mapMatchup(data as DbMatchup)
    },

    async replaceMatchups(weekId, matchups) {
      const { error: delError } = await client
        .from('matchups')
        .delete()
        .eq('week_id', weekId)
      if (delError) throw delError

      if (matchups.length === 0) return

      const { error: insError } = await client
        .from('matchups')
        .insert(matchups.map(toDbMatchup))
      if (insError) throw insError
    },

    // -----------------------------------------------------------------------
    // Voter sessions
    // -----------------------------------------------------------------------
    async getVoterSessionByCookie(weekId, cookieId) {
      const { data, error } = await client
        .from('voter_sessions')
        .select('*')
        .eq('week_id', weekId)
        .eq('cookie_id', cookieId)
        .single()
      if (error) {
        if (isNotFound(error)) return null
        throw error
      }
      return mapVoterSession(data as DbVoterSession)
    },

    async getVoterSessionByUserId(weekId, userId) {
      const { data, error } = await client
        .from('voter_sessions')
        .select('*')
        .eq('week_id', weekId)
        .eq('user_id', userId)
        .single()
      if (error) {
        if (isNotFound(error)) return null
        throw error
      }
      return mapVoterSession(data as DbVoterSession)
    },

    async listVoterSessionsByWeek(weekId) {
      const { data, error } = await client
        .from('voter_sessions')
        .select('*')
        .eq('week_id', weekId)
      if (error) throw error
      return (data as DbVoterSession[]).map(mapVoterSession)
    },

    async listVotesByWeek(weekId) {
      const { data, error } = await client
        .from('votes')
        .select('*')
        .eq('week_id', weekId)
      if (error) throw error
      return (data as DbVote[]).map(mapVote)
    },

    async saveVoterSession(voterSession) {
      const { data, error } = await client
        .from('voter_sessions')
        .upsert(toDbVoterSession(voterSession))
        .select()
        .single()
      if (error) throw error
      return mapVoterSession(data as DbVoterSession)
    },

    // -----------------------------------------------------------------------
    // Votes
    // -----------------------------------------------------------------------
    async listVotesBySession(voterSessionId) {
      const { data, error } = await client
        .from('votes')
        .select('*')
        .eq('voter_session_id', voterSessionId)
      if (error) throw error
      return (data as DbVote[]).map(mapVote)
    },

    async listVotesByFingerprint(weekId, fingerprintHash) {
      const { data, error } = await client
        .from('votes')
        .select('*')
        .eq('week_id', weekId)
        .eq('fingerprint_hash', fingerprintHash)
      if (error) throw error
      return (data as DbVote[]).map(mapVote)
    },

    async getVoteByIdempotencyKey(weekId, idempotencyKey) {
      const { data, error } = await client
        .from('votes')
        .select('*')
        .eq('week_id', weekId)
        .eq('idempotency_key', idempotencyKey)
        .single()
      if (error) {
        if (isNotFound(error)) return null
        throw error
      }
      return mapVote(data as DbVote)
    },

    async saveVote(vote) {
      const { data, error } = await client
        .from('votes')
        .insert(toDbVote(vote))
        .select()
        .single()
      if (error) throw error
      return mapVote(data as DbVote)
    },
  }
}
