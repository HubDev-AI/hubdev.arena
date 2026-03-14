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

  describe("all valid transitions produce the correct next status", () => {
    it("draft → open_submissions → submissions_open", () => {
      expect(transitionWeekStatus("draft", "open_submissions")).toBe("submissions_open");
    });

    it("submissions_open → open_voting → voting_open", () => {
      expect(transitionWeekStatus("submissions_open", "open_voting")).toBe("voting_open");
    });

    it("voting_open → lock_results → locked", () => {
      expect(transitionWeekStatus("voting_open", "lock_results")).toBe("locked");
    });

    it("locked → archive → archived", () => {
      expect(transitionWeekStatus("locked", "archive")).toBe("archived");
    });
  });

  describe("invalid transitions throw", () => {
    it("voting_open → open_submissions is invalid", () => {
      expect(() => transitionWeekStatus("voting_open", "open_submissions")).toThrow(
        /invalid week status transition/i,
      );
    });

    it("locked → open_submissions is invalid", () => {
      expect(() => transitionWeekStatus("locked", "open_submissions")).toThrow(
        /invalid week status transition/i,
      );
    });

    it("locked → open_voting is invalid", () => {
      expect(() => transitionWeekStatus("locked", "open_voting")).toThrow(
        /invalid week status transition/i,
      );
    });

    it("archived → any action is invalid", () => {
      expect(() => transitionWeekStatus("archived", "open_submissions")).toThrow(
        /invalid week status transition/i,
      );
      expect(() => transitionWeekStatus("archived", "archive")).toThrow(
        /invalid week status transition/i,
      );
    });

    it("submissions_open → lock_results is invalid (cannot skip voting_open)", () => {
      expect(() => transitionWeekStatus("submissions_open", "lock_results")).toThrow(
        /invalid week status transition/i,
      );
    });

    it("draft → open_voting is invalid (cannot skip submissions_open)", () => {
      expect(() => transitionWeekStatus("draft", "open_voting")).toThrow(
        /invalid week status transition/i,
      );
    });

    it("draft → archive is invalid (cannot skip to end)", () => {
      expect(() => transitionWeekStatus("draft", "archive")).toThrow(
        /invalid week status transition/i,
      );
    });
  });
});
