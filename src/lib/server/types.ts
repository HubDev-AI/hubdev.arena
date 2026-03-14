import type { WeekStatus } from "@/lib/domain/weeks";

export type AuthProvider = "twitter" | "email" | "mock";
export type EntryStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  email?: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  foundingBuilder: boolean;
  createdAt: string;
};

export type Week = {
  id: string;
  slug: string;
  themeTitle: string;
  themeDescription: string;
  timezone: string;
  submissionOpenAt: string;
  submissionCloseAt: string;
  votingOpenAt: string;
  votingCloseAt: string;
  status: WeekStatus;
};

export type Entry = {
  id: string;
  weekId: string;
  builderId: string;
  slug: string;
  title: string;
  oneLiner: string;
  liveUrl: string;
  demoAssetPath: string;
  status: EntryStatus;
  eloRating: number;
  wins: number;
  losses: number;
  appearanceCount: number;
  submittedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionNote: string | null;
};

export type Matchup = {
  id: string;
  weekId: string;
  entryAId: string;
  entryBId: string;
  exposureCount: number;
  voteCount: number;
  createdAt: string;
};

export type VoterSession = {
  id: string;
  weekId: string;
  userId: string | null;
  cookieId: string;
  fingerprintHash: string;
  votesCast: number;
  lastSeenAt: string;
  createdAt: string;
};

export type Vote = {
  id: string;
  weekId: string;
  matchupId: string;
  winnerEntryId: string;
  loserEntryId: string;
  voterSessionId: string;
  fingerprintHash: string;
  idempotencyKey: string;
  createdAt: string;
};

export type LeaderboardRow = {
  rank: number;
  entrySlug: string;
  title: string;
  builderName: string;
  liveUrl: string;
  demoAssetUrl: string;
  elo: number;
  wins: number;
  losses: number;
};

export type VoteDeckEntry = {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  liveUrl: string;
  demoAssetPath: string;
  builderName: string;
  foundingBuilder: boolean;
};

export type VoteDeck = {
  matchupId: string;
  leftEntry: VoteDeckEntry;
  rightEntry: VoteDeckEntry;
  votesCast: number;
  votingClosesAt: string;
};

export type ArenaState = {
  profiles: Profile[];
  weeks: Week[];
  entries: Entry[];
  matchups: Matchup[];
  voterSessions: VoterSession[];
  votes: Vote[];
};

export interface ArenaRepository {
  listProfiles(): Promise<Profile[]>;
  getProfileById(profileId: string): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<Profile>;
  listWeeks(): Promise<Week[]>;
  getWeekBySlug(slug: string): Promise<Week | null>;
  saveWeek(week: Week): Promise<Week>;
  listEntriesByWeek(weekId: string): Promise<Entry[]>;
  listEntriesByBuilder(weekId: string, builderId: string): Promise<Entry[]>;
  listEntriesByIds(entryIds: string[]): Promise<Entry[]>;
  getEntryById(entryId: string): Promise<Entry | null>;
  getEntryBySlug(entrySlug: string): Promise<Entry | null>;
  saveEntry(entry: Entry): Promise<Entry>;
  listMatchupsByWeek(weekId: string): Promise<Matchup[]>;
  getMatchupById(matchupId: string): Promise<Matchup | null>;
  saveMatchup(matchup: Matchup): Promise<Matchup>;
  replaceMatchups(weekId: string, matchups: Matchup[]): Promise<void>;
  getVoterSessionByCookie(
    weekId: string,
    cookieId: string,
  ): Promise<VoterSession | null>;
  getVoterSessionByUserId(weekId: string, userId: string): Promise<VoterSession | null>;
  saveVoterSession(voterSession: VoterSession): Promise<VoterSession>;
  listVoterSessionsByWeek(weekId: string): Promise<VoterSession[]>;
  listVotesByWeek(weekId: string): Promise<Vote[]>;
  listVotesBySession(voterSessionId: string): Promise<Vote[]>;
  listVotesByFingerprint(weekId: string, fingerprintHash: string): Promise<Vote[]>;
  getVoteByIdempotencyKey(
    weekId: string,
    idempotencyKey: string,
  ): Promise<Vote | null>;
  saveVote(vote: Vote): Promise<Vote>;
}
