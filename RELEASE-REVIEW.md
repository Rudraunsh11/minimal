# Minimal release review

18 October 2026 — private preview; public release blocked pending the evidence below.

## Completed implementation and verification

- Account/session isolation, same-origin writes, trusted identity binding, conditional revisions, bounded/time-limited JSON bodies and generic error responses.
- Temporary device copies by default, optional remembered copies, cross-tab invalidation and hidden DOM cleanup. Browser review found that Escape bypassed cleanup; cancel/close events now clear the editor too.
- Active storage warnings and atomic online food/water archival. Three-year replay preserved 6,570 food and 8,760 water logs exactly.
- AES-256-GCM full-account backup with PBKDF2-SHA256 (210,000 iterations), random salt/IV, bounded versioned files and passphrases never sent to the service. Wrong key/tamper tests pass. Full restore replaces active records and archives atomically, guarded by revisions and a unique restore marker. Previous-active-save recovery cannot recover overwritten archives. Downloaded encrypted files remain the user's responsibility.
- A disaster-recovery drill destroyed a synthetic in-memory source database and restored active records plus archives into a fresh schema. This demonstrates the recovery implementation, not production backup operations.
- Conservative application bounds: 20 registered preview account rows, 5,000 accepted API requests per UTC day, existing minute limits, stricter full-backup limits and bounded archives. Tombstoned account rows consume slots. Atomic admission checks cover ordinary saving and full restore. These are not a provider cost guarantee or DDoS shield.
- Client retry honours Retry-After and uses bounded backoff. A private health endpoint exposes healthy true/false only and shares account-request limits. No external monitoring subscription/scheduler was added.
- Privacy/help/release pages describe actual data handling and limits. Security contact and no-index preview policy added. Install manifest does not claim offline health-record access or native app-store approval. No service worker caches private records.
- All regression suites, frontend parse/asset/link checks, TypeScript and local HTTP header checks run before packaging. Local browser verified modal name, empty-passphrase rejection, keyboard dismissal, and empty hidden dialog after Escape. Broader real-device/assistive testing is not claimed.

## Dependency audit

Production-manifest audit returned zero advisories at this check. The full audit reports one high advisory in braces 3.0.3 through build tooling (micromatch/fast-glob via ESLint/Vinext). GitHub reports no patched release: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm . No fake version override or audit suppression was added. Application record data is not passed to these build glob parsers; this reduces the observed runtime exposure but is not an upstream fix or a clean full audit. The all-dependency CI audit intentionally reports the finding. Inspect the final Worker bundle and accept/resolve supply-chain risk before public release.

## Remaining gates

1. Vercel: connect the user's project. Keep account saving only after replacing Sites-dispatch identity and Cloudflare bindings with a supported, server-verified identity/database service. Never forward browser-chosen identity headers or use a service bypass token to impersonate users. No credentials/project are configured for that migration. A separately labelled device-only beta requires the owner's explicit choice.
2. Production recovery: configure an encrypted independent off-site backup destination, retention and key custody; restore into an isolated production-equivalent environment. Suggested initial targets: daily snapshots, recovery point within 24 hours and restore within four hours. These are proposed targets, not achieved SLAs. Confirm provider Time Travel access/retention.
3. Provider operations: verify actual account plan, quotas, spending controls and storage metrics; establish non-sensitive error logs, an on-call contact and uptime/error alerts. No health payloads, auth tokens or passphrases in logs.
4. Hosted two-account isolation, expiry, concurrent tabs and stale writes; maximum-size export/restore and hosted D1 CPU/memory/load testing; actual phone/Safari/keyboard/screen-reader checks.
5. Review operator identity, launch regions, age suitability, privacy commitments, provider agreements and data-source/brand rights. Attribution is not a blanket redistribution permission.
6. Domain, sharing/audience and rollout scope; rollback rehearsal and release sign-off. The private preview is not secretly widened.
7. Native apps require signed packages, device permissions/entitlements, real-device testing, store privacy declarations, beta tracks and review. Apple expects more than a repackaged website; applicable new Google personal accounts require 12 continuously opted-in testers for 14 days. These steps cannot be certified by a web build.

## Operator runbook

Before release, run `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm audit --audit-level=high`, the production build, and `pnpm check:release`. Check each pending gate; never flip a boolean without evidence. CI uses pinned actions, read-only repository permission, bounded timeouts and no deployment secrets. GitHub branch protection and runner billing limits still need account-side verification.

On an incident: keep records intact; pause writes/admission at the application/provider layer if needed; show an honest status notice; never dump request bodies into logs. Roll back application code to the last verified deployment through the provider UI. Database migrations are additive; code rollback does not undo data writes or schemas. For data incidents, preserve a snapshot, restore to an isolated database, compare counts/hashes including archives, verify per-account ownership, then perform an approved cutover. Do not restore over the live database as a trial. Verify sign-in, save, read, archive and health after any cutover.

## References checked

- D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- Provider recovery: https://developers.cloudflare.com/d1/reference/time-travel/
- Apple review: https://developer.apple.com/app-store/review/guidelines/
- Google testing: https://support.google.com/googleplay/android-developer/answer/14151465
- Vercel deployment: https://vercel.com/docs/deployments

These published provider rules do not prove the settings or eligibility of this project's accounts. No paid service was purchased.
