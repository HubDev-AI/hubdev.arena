export type MatchupCandidate = {
  id: string;
  entryAId: string;
  entryBId: string;
  exposureCount: number;
};

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
}: SelectNextMatchupInput) {
  const seen = new Set(seenMatchupIds);
  const previousEntries = new Set(previousEntryIds);

  const eligibleMatchups = matchups.filter((matchup) => !seen.has(matchup.id));

  if (eligibleMatchups.length === 0) {
    return null;
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

  return topBucket[randomIndex] ?? null;
}
