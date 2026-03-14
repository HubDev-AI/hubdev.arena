export const DEFAULT_ELO_RATING = 1200;
export const ELO_K_FACTOR = 24;

type ApplyEloResultInput = {
  winnerRating: number;
  loserRating: number;
  kFactor?: number;
};

type EloResult = {
  winnerRating: number;
  loserRating: number;
  winnerDelta: number;
  loserDelta: number;
};

function getExpectedScore(rating: number, opponentRating: number) {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

export function applyEloResult({
  winnerRating,
  loserRating,
  kFactor = ELO_K_FACTOR,
}: ApplyEloResultInput): EloResult {
  const winnerExpected = getExpectedScore(winnerRating, loserRating);
  const winnerDelta = Math.round(kFactor * (1 - winnerExpected));
  const loserDelta = -winnerDelta;

  return {
    winnerRating: winnerRating + winnerDelta,
    loserRating: Math.max(0, loserRating + loserDelta),
    winnerDelta,
    loserDelta,
  };
}
