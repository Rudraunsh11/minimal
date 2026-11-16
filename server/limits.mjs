// Conservative private-preview bounds, independent of provider billing settings.
export const MAX_INITIAL_ACCOUNTS=20;
export const DAILY_REQUEST_BUDGET=5000;
// Share of the daily budget one account may spend, so a single noisy or
// malicious account cannot exhaust the budget every other account depends on.
export const DAILY_ACCOUNT_BUDGET=1500;
