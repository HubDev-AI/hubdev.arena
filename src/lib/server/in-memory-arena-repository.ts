import type {
  ArenaRepository,
  ArenaState,
} from "@/lib/server/types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function upsertById<T extends { id: string }>(collection: T[], record: T) {
  const existingIndex = collection.findIndex((item) => item.id === record.id);

  if (existingIndex >= 0) {
    collection[existingIndex] = clone(record);
    return;
  }

  collection.push(clone(record));
}

export type InMemoryArenaRepository = ArenaRepository & { state: ArenaState };

export function createInMemoryArenaRepository(initialState: ArenaState): InMemoryArenaRepository {
  const state = clone(initialState);

  return {
    state,
    async listProfiles() {
      return clone(state.profiles);
    },
    async getProfileById(profileId) {
      return clone(state.profiles.find((profile) => profile.id === profileId) ?? null);
    },
    async saveProfile(profile) {
      upsertById(state.profiles, profile);
      return clone(profile);
    },
    async listWeeks() {
      return clone(state.weeks);
    },
    async getWeekBySlug(slug) {
      return clone(state.weeks.find((week) => week.slug === slug) ?? null);
    },
    async saveWeek(week) {
      upsertById(state.weeks, week);
      return clone(week);
    },
    async listEntriesByWeek(weekId) {
      return clone(state.entries.filter((entry) => entry.weekId === weekId));
    },
    async listEntriesByBuilder(weekId, builderId) {
      return clone(
        state.entries.filter(
          (entry) => entry.weekId === weekId && entry.builderId === builderId,
        ),
      );
    },
    async listEntriesByIds(entryIds) {
      const lookup = new Set(entryIds);
      return clone(state.entries.filter((entry) => lookup.has(entry.id)));
    },
    async getEntryById(entryId) {
      return clone(state.entries.find((entry) => entry.id === entryId) ?? null);
    },
    async getEntryBySlug(entrySlug) {
      return clone(state.entries.find((entry) => entry.slug === entrySlug) ?? null);
    },
    async saveEntry(entry) {
      upsertById(state.entries, entry);
      return clone(entry);
    },
    async listMatchupsByWeek(weekId) {
      return clone(state.matchups.filter((matchup) => matchup.weekId === weekId));
    },
    async getMatchupById(matchupId) {
      return clone(state.matchups.find((matchup) => matchup.id === matchupId) ?? null);
    },
    async saveMatchup(matchup) {
      upsertById(state.matchups, matchup);
      return clone(matchup);
    },
    async replaceMatchups(weekId, matchups) {
      state.matchups = state.matchups.filter((matchup) => matchup.weekId !== weekId);
      state.matchups.push(...clone(matchups));
    },
    async getVoterSessionByCookie(weekId, cookieId) {
      return clone(
        state.voterSessions.find(
          (session) => session.weekId === weekId && session.cookieId === cookieId,
        ) ?? null,
      );
    },
    async getVoterSessionByUserId(weekId, userId) {
      return clone(
        state.voterSessions.find(
          (s) => s.weekId === weekId && s.userId === userId,
        ) ?? null,
      );
    },
    async saveVoterSession(voterSession) {
      upsertById(state.voterSessions, voterSession);
      return clone(voterSession);
    },
    async listVoterSessionsByWeek(weekId) {
      return clone(state.voterSessions.filter((s) => s.weekId === weekId));
    },
    async listVotesByWeek(weekId) {
      return clone(state.votes.filter((vote) => vote.weekId === weekId));
    },
    async listVotesBySession(voterSessionId) {
      return clone(
        state.votes.filter((vote) => vote.voterSessionId === voterSessionId),
      );
    },
    async listVotesByFingerprint(weekId, fingerprintHash) {
      return clone(
        state.votes.filter(
          (vote) =>
            vote.weekId === weekId && vote.fingerprintHash === fingerprintHash,
        ),
      );
    },
    async getVoteByIdempotencyKey(weekId, idempotencyKey) {
      return clone(
        state.votes.find(
          (vote) =>
            vote.weekId === weekId && vote.idempotencyKey === idempotencyKey,
        ) ?? null,
      );
    },
    async saveVote(vote) {
      upsertById(state.votes, vote);
      return clone(vote);
    },
  };
}
