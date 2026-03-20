import { selectNextMatchup } from "@/lib/domain/matchups";

describe("selectNextMatchup", () => {
  it("serves from the lowest-exposure bucket first", () => {
    const result = selectNextMatchup({
      matchups: [
        { id: "m-1", entryAId: "a", entryBId: "b", exposureCount: 3 },
        { id: "m-2", entryAId: "c", entryBId: "d", exposureCount: 1 },
        { id: "m-3", entryAId: "e", entryBId: "f", exposureCount: 1 },
      ],
      seenMatchupIds: [],
      previousEntryIds: [],
      random: () => 0,
    });

    expect(result).toMatchObject({ status: "found", matchup: { id: "m-2" } });
  });

  it("avoids repeating the same entry twice in a row when alternatives exist", () => {
    const result = selectNextMatchup({
      matchups: [
        { id: "m-1", entryAId: "a", entryBId: "b", exposureCount: 0 },
        { id: "m-2", entryAId: "a", entryBId: "c", exposureCount: 0 },
        { id: "m-3", entryAId: "d", entryBId: "e", exposureCount: 0 },
      ],
      seenMatchupIds: [],
      previousEntryIds: ["a", "b"],
      random: () => 0,
    });

    expect(result).toMatchObject({ status: "found", matchup: { id: "m-3" } });
  });

  it("excludes matchups already seen by the current voter session", () => {
    const result = selectNextMatchup({
      matchups: [
        { id: "m-1", entryAId: "a", entryBId: "b", exposureCount: 0 },
        { id: "m-2", entryAId: "c", entryBId: "d", exposureCount: 0 },
      ],
      seenMatchupIds: ["m-1"],
      previousEntryIds: [],
      random: () => 0,
    });

    expect(result).toMatchObject({ status: "found", matchup: { id: "m-2" } });
  });
});
