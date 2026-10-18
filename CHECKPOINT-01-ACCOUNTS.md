# Checkpoint 1: account and session review

Updated 18 October 2026. Status: local implementation complete; live hosted verification pending. Do not advance to checkpoint 2 yet.

## Corrections

A stale tab could upload account A's state after the browser had changed to account B if the two account revisions happened to match. Writes now carry the account context loaded by the tab. The server compares that context with the platform-authenticated user and rejects a mismatch. The authenticated identity alone selects the database row; the client cannot choose another user's row.

The client locks editing and clears private in-memory records when the session is rejected or an account switch is detected. Failed account verification no longer leaves unverified legacy records available on screen. The browser rechecks the session when returning to a tab; private content is veiled during that check. Responses from requests overtaken by a sign-out cannot repopulate records or open a previous-save recovery dialog.

Sign-out reviews unsynced changes, offers an export, and requires a deliberate choice before discarding those changes. It removes the current account's device copy, informs sibling tabs, and navigates through the platform-owned logout route. This is not a claim that every legacy browser cache or other account copy has been purged; the broader device-privacy review remains checkpoint 2.

Auth return paths reject external destinations, backslashes, control characters and reserved auth-route loops. Identity-provider failures return a generic error without record content.

## Evidence completed

- Regression tests use independent trusted test actors, equal-revision account switches, missing identity/context, bound GET/PUT/DELETE, previous-save recovery, and identity-only session checks.
- Client tests cover 401/403/account-change locks, edit blocking, delayed-read/recovery races, same-account resume, failed verification, sign-out navigation, pending-change review and sibling-tab lock.
- Actual local framework routes reject anonymous and forged visitor headers. The documented local sign-in fixture returns only its trusted mock identity and rejects an inconsistent client account context.
- Existing revision, same-origin, request-size, rate-limit, import-validation and stale-write checks continue to pass.
- TypeScript checking passed. The production build is checked during packaging; a successful deployment is reported separately.

The local fixture is not proof that two actual hosted users can safely sign in and switch sessions. The hosted audience remains restricted to its existing owner. No test visitor was added and no public sharing was enabled.

## Concrete live verification still needed

With two explicitly authorized test accounts, using disposable test records:

1. Sign in as A; create a distinctive harmless test task; verify refresh persistence.
2. In an independent browser profile, sign in as B; verify that A's records are absent. Create a different test task.
3. With a tab still holding A's state, switch the browser session to B; return to the stale tab and attempt an edit. It must lock rather than save A's state to B, including when their revisions match.
4. Sign out while a second tab is open. Both tabs must hide private records and block saves. Reopen/back/refresh and check again.
5. Simulate an expired session and loss of connectivity. Verify that records are not sent to an unexpected account and that unsynced changes can be recovered by signing into the original account.
6. Recheck A and B independently to confirm record isolation and review dispatch-managed sign-in/out behavior.

A second hosted visitor currently needs explicit access authorization from the owner before this test. This checkpoint stays open until that validation is completed.

Guidance used: Sites identity integration is governed by the installed Sites integration instructions; general review references are the [OWASP session-management guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html). No certification or claim of exhaustive security is made.
