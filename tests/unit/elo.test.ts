import { applyEloResult, DEFAULT_ELO_RATING, ELO_K_FACTOR } from "@/lib/domain/elo";

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

  it("uses K=24 as the default factor (equal ratings → delta of 12)", () => {
    // When ratings are equal, expected score = 0.5, so delta = round(K * (1 - 0.5)) = round(K * 0.5)
    expect(ELO_K_FACTOR).toBe(24);

    const result = applyEloResult({ winnerRating: 1200, loserRating: 1200 });
    const expectedDelta = Math.round(24 * (1 - 0.5));
    expect(expectedDelta).toBe(12);
    expect(result.winnerDelta).toBe(12);
    expect(result.loserDelta).toBe(-12);
  });

  it("never drops the loser below a rating of 0", () => {
    // Equal low ratings: delta = -12, so without a floor loserRating = 10 - 12 = -2.
    // The floor ensures the result is clamped at 0.
    const result = applyEloResult({ winnerRating: 10, loserRating: 10 });
    expect(result.loserDelta).toBe(-12);
    expect(result.loserRating).toBe(0); // floored from -2 to 0
  });

  it("computes delta as round(24 * (1 - expected)) for a known asymmetric case", () => {
    // winner=1200, loser=1400: expected = 1 / (1 + 10^((1400-1200)/400)) = 1 / (1 + 10^0.5)
    const expected = 1 / (1 + 10 ** ((1400 - 1200) / 400));
    const expectedDelta = Math.round(24 * (1 - expected));
    const result = applyEloResult({ winnerRating: 1200, loserRating: 1400 });
    expect(result.winnerDelta).toBe(expectedDelta);
    expect(result.loserDelta).toBe(-expectedDelta);
  });
});
