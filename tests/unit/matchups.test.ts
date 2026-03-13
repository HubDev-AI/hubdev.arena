import { generateUniqueMatchups } from "@/lib/domain/matchups";

describe("generateUniqueMatchups", () => {
  it("creates every unordered pair exactly once", () => {
    const pairs = generateUniqueMatchups(["entry-a", "entry-b", "entry-c", "entry-d"]);

    expect(pairs).toEqual([
      ["entry-a", "entry-b"],
      ["entry-a", "entry-c"],
      ["entry-a", "entry-d"],
      ["entry-b", "entry-c"],
      ["entry-b", "entry-d"],
      ["entry-c", "entry-d"],
    ]);
  });
});
