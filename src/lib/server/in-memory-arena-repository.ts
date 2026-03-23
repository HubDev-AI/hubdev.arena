import type {
  ArenaRepository,
  ArenaState,
  Entry,
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

/**
 * Simple async mutex for serializing in-memory read-compute-write sequences.
 * Prevents race conditions when concurrent requests mutate shared state
 * (e.g. ELO updates, exposure/appearance count increments).
 */
export class AsyncMutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise<void>((resolve) => this.queue.push(resolve));
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
}

export type InMemoryArenaRepository = ArenaRepository & {
  state: ArenaState;
  mutex: AsyncMutex;
};

export function createInMemoryArenaRepository(initialState: ArenaState): InMemoryArenaRepository {
  const state = clone(initialState);
  const mutex = new AsyncMutex();

  return {
    state,
    mutex,
    async listProfiles() {
      return clone(state.profiles);
    },
    async listProfilesByIds(profileIds) {
      const lookup = new Set(profileIds);
      return clone(state.profiles.filter((profile) => lookup.has(profile.id)));
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
    async getWeekById(weekId) {
      return clone(state.weeks.find((week) => week.id === weekId) ?? null);
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
    async listAllEntriesByBuilder(builderId) {
      return clone(state.entries.filter((entry) => entry.builderId === builderId));
    },
    async listEntriesByIds(entryIds) {
      const byId = new Map(state.entries.map((e) => [e.id, e]));
      return clone(entryIds.map((id) => byId.get(id)).filter((e): e is Entry => e != null));
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
    async saveVoterSession(voterSession) {
      upsertById(state.voterSessions, voterSession);
      return clone(voterSession);
    },
    async listVotesBySession(voterSessionId) {
      return clone(
        state.votes
          .filter((vote) => vote.voterSessionId === voterSessionId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
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
