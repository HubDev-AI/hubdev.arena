export type WeekStatus =
  | "draft"
  | "submissions_open"
  | "voting_open"
  | "locked"
  | "archived";

export type WeekTransitionAction =
  | "open_submissions"
  | "open_voting"
  | "lock_results"
  | "archive";

const TRANSITIONS: Record<WeekStatus, Partial<Record<WeekTransitionAction, WeekStatus>>> = {
  draft: {
    open_submissions: "submissions_open",
  },
  submissions_open: {
    open_voting: "voting_open",
  },
  voting_open: {
    lock_results: "locked",
  },
  locked: {
    archive: "archived",
  },
  archived: {},
};

export function transitionWeekStatus(
  currentStatus: WeekStatus,
  action: WeekTransitionAction,
) {
  const nextStatus = TRANSITIONS[currentStatus][action];

  if (!nextStatus) {
    throw new Error(
      `Invalid week status transition: ${currentStatus} cannot perform ${action}`,
    );
  }

  return nextStatus;
}
