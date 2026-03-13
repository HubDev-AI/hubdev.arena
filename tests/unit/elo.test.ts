import { applyEloResult, DEFAULT_ELO_RATING } from "@/lib/domain/elo";

describe("applyEloResult", () => {
  it("updates both entries symmetrically when ratings start even", () => {
    const result = applyEloResult({
      winnerRating: DEFAULT_ELO_RATING,
      loserRating: DEFAULT_ELO_RATING,
    });

    expect(result).toEqual({
      winnerRating: 1212,
      loserRating: 1188,
      winnerDelta: 12,
      loserDelta: -12,
    });
  });

  it("gives a larger gain to an upset winner", () => {
    const result = applyEloResult({
      winnerRating: 1200,
      loserRating: 1400,
    });

    expect(result.winnerRating).toBe(1218);
    expect(result.loserRating).toBe(1382);
    expect(result.winnerDelta).toBe(18);
    expect(result.loserDelta).toBe(-18);
  });
});
