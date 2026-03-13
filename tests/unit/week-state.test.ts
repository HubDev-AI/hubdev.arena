import { transitionWeekStatus } from "@/lib/domain/weeks";

describe("transitionWeekStatus", () => {
  it("allows the normal lifecycle transitions", () => {
    expect(transitionWeekStatus("draft", "open_submissions")).toBe("submissions_open");
    expect(transitionWeekStatus("submissions_open", "open_voting")).toBe("voting_open");
    expect(transitionWeekStatus("voting_open", "lock_results")).toBe("locked");
    expect(transitionWeekStatus("locked", "archive")).toBe("archived");
  });

  it("rejects invalid jumps", () => {
    expect(() => transitionWeekStatus("draft", "lock_results")).toThrow(
      /invalid week status transition/i,
    );
  });
});
