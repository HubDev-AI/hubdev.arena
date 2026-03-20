export type MatchupCandidate = {
  id: string;
  entryAId: string;
  entryBId: string;
  exposureCount: number;
};

export type MatchupResult =
  | { status: "found"; matchup: MatchupCandidate }
  | { status: "all_voted" }
  | { status: "no_matchups" };

type SelectNextMatchupInput = {
  matchups: MatchupCandidate[];
  seenMatchupIds: string[];
  previousEntryIds: string[];
  random?: () => number;
};

export function generateUniqueMatchups(entryIds: string[]) {
  const uniqueEntryIds = [...new Set(entryIds)];
  const pairs: Array<[string, string]> = [];

  for (let index = 0; index < uniqueEntryIds.length; index += 1) {
    for (
      let opponentIndex = index + 1;
      opponentIndex < uniqueEntryIds.length;
      opponentIndex += 1
    ) {
      pairs.push([uniqueEntryIds[index]!, uniqueEntryIds[opponentIndex]!]);
    }
  }

  return pairs;
}

export function selectNextMatchup({
  matchups,
  seenMatchupIds,
  previousEntryIds,
  random = Math.random,
}: SelectNextMatchupInput): MatchupResult {
  if (matchups.length === 0) {
    return { status: "no_matchups" };
  }

  const seen = new Set(seenMatchupIds);
  const previousEntries = new Set(previousEntryIds);

  const eligibleMatchups = matchups.filter((matchup) => !seen.has(matchup.id));

  if (eligibleMatchups.length === 0) {
    return { status: "all_voted" };
  }

  const minimumExposure = Math.min(
    ...eligibleMatchups.map((matchup) => matchup.exposureCount),
  );

  let topBucket = eligibleMatchups.filter(
    (matchup) => matchup.exposureCount === minimumExposure,
  );

  if (previousEntries.size > 0) {
    const withoutImmediateRepeats = topBucket.filter(
      (matchup) =>
        !previousEntries.has(matchup.entryAId) &&
        !previousEntries.has(matchup.entryBId),
    );

    if (withoutImmediateRepeats.length > 0) {
      topBucket = withoutImmediateRepeats;
    }
  }

  const randomIndex = Math.min(
    topBucket.length - 1,
    Math.floor(random() * topBucket.length),
  );

  const selected = topBucket[randomIndex];
  if (!selected) {
    return { status: "no_matchups" };
  }

  return { status: "found", matchup: selected };
}
