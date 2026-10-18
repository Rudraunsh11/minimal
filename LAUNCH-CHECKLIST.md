# Minimal launch checklist — 18 October 2026

The owner authorized proceeding through all remaining checks without pausing between checkpoints, then asked to prioritize a Vercel release today with no further feature expansion. Implementation completion is distinct from public-launch acceptance. Existing Sites access remains owner-private.

| Checkpoint | Completed work | Open release evidence |
| --- | --- | --- |
| 1. Accounts/session isolation | Server account binding, origin checks, revisions, client epoch locks and regression tests | Two authorized hosted accounts; Vercel identity/database migration |
| 2. Device privacy | Temporary default, remember opt-in, scoped clearing, cross-tab locks, hidden-editor cleanup including Escape | Real shared-device/session-restore verification |
| 3. Storage growth | 900 KB active cap, 10 online food/water archives, warnings, three-year exact-preservation replay | Hosted maximum-capacity/load tests; larger non-food histories remain bounded |
| 4. Backups/recovery | Encrypted full-account backup/transactional restore including archives; synthetic database-loss drill | Automatic independent production backup and operator restore drill |
| 5. Operations/quotas | Daily request budget, preview account cap, rate limits, Retry-After/backoff, minimal health endpoint, tests | Provider billing/quotas, logs/alerts and external monitoring verification |
| 6. Privacy/user information | Current data notice, help, release status and security contact | Final operator/jurisdiction/provider-retention approval |
| 7. Quality/accessibility | Script/asset/HTTP tests, CSP hash check, dialog labels, Escape cleanup, local browser review | Actual iPhone/Android/Safari/screen-reader, weak network and full feature acceptance matrix |
| 8. Security/licensing | Injection/auth/CSRF/size/race tests, source notices, production-manifest audit, full dependency scan | Open braces build-dependency advisory (no upstream patched release); final public redistribution review |
| 9. Release operations | Pinned-action CI workflow, explicit release gate, packaging and operator runbook | Vercel connection + saving choice, compatible backend, production domain/audience, load and rollback acceptance |
| Native store release | Responsive frontend and install manifest; submission requirements documented | Native binaries, signing, entitlements, privacy declarations, beta tests and store review |

See RELEASE-REVIEW.md and release/gates.json. `pnpm check:release` intentionally fails while required evidence is pending. A zero-bug guarantee is not claimed. No public launch, Vercel production deployment or app-store release has been represented as completed.
