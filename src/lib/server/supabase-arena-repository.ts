import { createClient } from "@supabase/supabase-js";

import type {
  ArenaRepository,
  Entry,
  Matchup,
  Profile,
  Vote,
  VoterSession,
  Week,
} from "@/lib/server/types";
import type { EntryStatus, AuthProvider } from "@/lib/server/types";
import type { WeekStatus } from "@/lib/domain/weeks";

// Row types matching the Postgres schema (snake_case)
type ProfileRow = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  auth_provider: string;
  founding_builder: boolean;
  created_at: string;
  email?: string;
};

type WeekRow = {
  id: string;
  slug: string;
  theme_title: string;
  theme_description: string;
  timezone: string;
  submission_open_at: string;
  submission_close_at: string;
  voting_open_at: string;
  voting_close_at: string;
  status: string;
};

type EntryRow = {
  id: string;
  week_id: string;
  builder_id: string;
  slug: string;
  title: string;
  one_liner: string;
  live_url: string;
  demo_asset_path: string;
  status: string;
  elo_rating: number;
  wins: number;
  losses: number;
  appearance_count: number;
  submitted_at: string;
  approved_at: string | null;
  rejection_note: string | null;
};

type MatchupRow = {
  id: string;
  week_id: string;
  entry_a_id: string;
  entry_b_id: string;
  exposure_count: number;
  vote_count: number;
  created_at: string;
};

type VoterSessionRow = {
  id: string;
  week_id: string;
  user_id: string | null;
  cookie_id: string;
  fingerprint_hash: string;
  votes_cast: number;
  last_seen_at: string;
  created_at: string;
};

type VoteRow = {
  id: string;
  week_id: string;
  matchup_id: string;
  winner_entry_id: string;
  loser_entry_id: string;
  voter_session_id: string;
  fingerprint_hash: string;
  idempotency_key: string;
  created_at: string;
};

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    username: row.username,
    avatarUrl: row.avatar_url,
    authProvider: row.auth_provider as AuthProvider,
    foundingBuilder: row.founding_builder,
    createdAt: row.created_at,
  };
}

function toWeek(row: WeekRow): Week {
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
    status: row.status as WeekStatus,
  };
}

function toEntry(row: EntryRow): Entry {
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
    rejectionNote: row.rejection_note,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
  };
}

function toMatchup(row: MatchupRow): Matchup {
  return {
    id: row.id,
    weekId: row.week_id,
    entryAId: row.entry_a_id,
    entryBId: row.entry_b_id,
    exposureCount: row.exposure_count,
    voteCount: row.vote_count,
    createdAt: row.created_at,
  };
}

function toVoterSession(row: VoterSessionRow): VoterSession {
  return {
    id: row.id,
    weekId: row.week_id,
    userId: row.user_id,
    cookieId: row.cookie_id,
    fingerprintHash: row.fingerprint_hash,
    votesCast: row.votes_cast,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  };
}

function toVote(row: VoteRow): Vote {
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
  };
}

function throwOnError<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export function createSupabaseArenaRepository(
  supabaseUrl: string,
  serviceRoleKey: string,
): ArenaRepository {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    async listProfiles() {
      const data = throwOnError(
        await supabase.from("profiles").select("*").order("created_at"),
      );
      return (data as ProfileRow[]).map(toProfile);
    },

    async listProfilesByIds(profileIds) {
      if (profileIds.length === 0) return [];
      const data = throwOnError(
        await supabase.from("profiles").select("*").in("id", profileIds),
      );
      return (data as ProfileRow[]).map(toProfile);
    },

    async getProfileById(profileId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toProfile(data as ProfileRow) : null;
    },

    async saveProfile(profile) {
      const data = throwOnError(
        await supabase
          .from("profiles")
          .upsert({
            id: profile.id,
            display_name: profile.displayName,
            username: profile.username,
            avatar_url: profile.avatarUrl,
            auth_provider: profile.authProvider,
            founding_builder: profile.foundingBuilder,
          })
          .select()
          .single(),
      );
      return toProfile(data as ProfileRow);
    },

    async getWeekById(weekId) {
      const { data, error } = await supabase
        .from("weeks")
        .select("*")
        .eq("id", weekId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toWeek(data as WeekRow) : null;
    },

    async listWeeks() {
      const data = throwOnError(
        await supabase.from("weeks").select("*").order("submission_open_at", { ascending: false }),
      );
      return (data as WeekRow[]).map(toWeek);
    },

    async getWeekBySlug(slug) {
      const { data, error } = await supabase
        .from("weeks")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toWeek(data as WeekRow) : null;
    },

    async saveWeek(week) {
      const data = throwOnError(
        await supabase
          .from("weeks")
          .upsert({
            id: week.id,
            slug: week.slug,
            theme_title: week.themeTitle,
            theme_description: week.themeDescription,
            timezone: week.timezone,
            submission_open_at: week.submissionOpenAt,
            submission_close_at: week.submissionCloseAt,
            voting_open_at: week.votingOpenAt,
            voting_close_at: week.votingCloseAt,
            status: week.status,
          })
          .select()
          .single(),
      );
      return toWeek(data as WeekRow);
    },

    async listEntriesByWeek(weekId) {
      const data = throwOnError(
        await supabase.from("entries").select("*").eq("week_id", weekId),
      );
      return (data as EntryRow[]).map(toEntry);
    },

    async listEntriesByBuilder(weekId, builderId) {
      const data = throwOnError(
        await supabase
          .from("entries")
          .select("*")
          .eq("week_id", weekId)
          .eq("builder_id", builderId),
      );
      return (data as EntryRow[]).map(toEntry);
    },

    async listAllEntriesByBuilder(builderId) {
      const data = throwOnError(
        await supabase.from("entries").select("*").eq("builder_id", builderId),
      );
      return (data as EntryRow[]).map(toEntry);
    },

    async listEntriesByIds(entryIds) {
      if (entryIds.length === 0) return [];
      const data = throwOnError(
        await supabase.from("entries").select("*").in("id", entryIds),
      );
      const entries = (data as EntryRow[]).map(toEntry);
      // Preserve input order — Supabase .in() returns rows in arbitrary order
      const byId = new Map(entries.map((e) => [e.id, e]));
      return entryIds.map((id) => byId.get(id)).filter((e): e is Entry => e != null);
    },

    async getEntryById(entryId) {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", entryId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toEntry(data as EntryRow) : null;
    },

    async getEntryBySlug(entrySlug) {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("slug", entrySlug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toEntry(data as EntryRow) : null;
    },

    async saveEntry(entry) {
      const data = throwOnError(
        await supabase
          .from("entries")
          .upsert({
            id: entry.id,
            week_id: entry.weekId,
            builder_id: entry.builderId,
            slug: entry.slug,
            title: entry.title,
            one_liner: entry.oneLiner,
            live_url: entry.liveUrl,
            demo_asset_path: entry.demoAssetPath,
            status: entry.status,
            elo_rating: entry.eloRating,
            wins: entry.wins,
            losses: entry.losses,
            appearance_count: entry.appearanceCount,
            rejection_note: entry.rejectionNote,
            submitted_at: entry.submittedAt,
            approved_at: entry.approvedAt,
          })
          .select()
          .single(),
      );
      return toEntry(data as EntryRow);
    },

    async listMatchupsByWeek(weekId) {
      const data = throwOnError(
        await supabase.from("matchups").select("*").eq("week_id", weekId),
      );
      return (data as MatchupRow[]).map(toMatchup);
    },

    async getMatchupById(matchupId) {
      const { data, error } = await supabase
        .from("matchups")
        .select("*")
        .eq("id", matchupId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toMatchup(data as MatchupRow) : null;
    },

    async saveMatchup(matchup) {
      const data = throwOnError(
        await supabase
          .from("matchups")
          .upsert({
            id: matchup.id,
            week_id: matchup.weekId,
            entry_a_id: matchup.entryAId,
            entry_b_id: matchup.entryBId,
            exposure_count: matchup.exposureCount,
            vote_count: matchup.voteCount,
          })
          .select()
          .single(),
      );
      return toMatchup(data as MatchupRow);
    },

    async replaceMatchups(weekId, matchups) {
      throwOnError(
        await supabase.from("matchups").delete().eq("week_id", weekId),
      );
      if (matchups.length === 0) return;
      throwOnError(
        await supabase.from("matchups").insert(
          matchups.map((m) => ({
            id: m.id,
            week_id: m.weekId,
            entry_a_id: m.entryAId,
            entry_b_id: m.entryBId,
            exposure_count: m.exposureCount,
            vote_count: m.voteCount,
          })),
        ),
      );
    },

    async getVoterSessionByCookie(weekId, cookieId) {
      const { data, error } = await supabase
        .from("voter_sessions")
        .select("*")
        .eq("week_id", weekId)
        .eq("cookie_id", cookieId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toVoterSession(data as VoterSessionRow) : null;
    },

    async saveVoterSession(voterSession) {
      const data = throwOnError(
        await supabase
          .from("voter_sessions")
          .upsert({
            id: voterSession.id,
            week_id: voterSession.weekId,
            user_id: voterSession.userId,
            cookie_id: voterSession.cookieId,
            fingerprint_hash: voterSession.fingerprintHash,
            votes_cast: voterSession.votesCast,
            last_seen_at: voterSession.lastSeenAt,
          })
          .select()
          .single(),
      );
      return toVoterSession(data as VoterSessionRow);
    },

    async listVotesBySession(voterSessionId) {
      const data = throwOnError(
        await supabase
          .from("votes")
          .select("*")
          .eq("voter_session_id", voterSessionId)
          .order("created_at", { ascending: true }),
      );
      return (data as VoteRow[]).map(toVote);
    },

    async listVotesByFingerprint(weekId, fingerprintHash) {
      const data = throwOnError(
        await supabase
          .from("votes")
          .select("*")
          .eq("week_id", weekId)
          .eq("fingerprint_hash", fingerprintHash)
          .order("created_at", { ascending: true }),
      );
      return (data as VoteRow[]).map(toVote);
    },

    async getVoteByIdempotencyKey(weekId, idempotencyKey) {
      const { data, error } = await supabase
        .from("votes")
        .select("*")
        .eq("week_id", weekId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toVote(data as VoteRow) : null;
    },

    async saveVote(vote) {
      const data = throwOnError(
        await supabase
          .from("votes")
          .insert({
            id: vote.id,
            week_id: vote.weekId,
            matchup_id: vote.matchupId,
            winner_entry_id: vote.winnerEntryId,
            loser_entry_id: vote.loserEntryId,
            voter_session_id: vote.voterSessionId,
            fingerprint_hash: vote.fingerprintHash,
            idempotency_key: vote.idempotencyKey,
          })
          .select()
          .single(),
      );
      return toVote(data as VoteRow);
    },
  };
}
