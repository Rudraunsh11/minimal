# Minimal — security review

Reviewed 18 October 2026. Scope: the current Minimal web application and its production build. Authentication, identity-provider configuration, and login flows were deliberately excluded at the owner's request and were not modified.

**Decision: suitable for continued private testing after these fixes; not yet approved for public health-data use or App Store / Google Play release.** This is a code review with targeted regression and local runtime tests, not an independent penetration-test certification or a guarantee of zero vulnerabilities.

## Findings fixed

| Priority | Finding | Change and evidence |
| --- | --- | --- |
| High | Imported food reference portions were not validated. A tampered portion weight reached an HTML attribute without escaping; recipe ingredient amounts had a similar unvalidated rendering path. | Validate reference labels, numeric weights, ingredient fields, URLs, nested recipes and yields; escape rendered attribute values. Malicious markup, invalid types, negative/non-finite values are rejected. The hosted CSP already restricted inline scripts; the finding still permitted markup injection and the plain local preview did not have that CSP. |
| High | The dependency scan found known critical/high advisories, including Next/ImageResponse RCE and React server-function DoS dependencies. | Updated Next to 16.3.8, React/React DOM/RSC to 19.2.8, Vite to 8.0.16, and patched vulnerable image/network/build transitives through the pnpm workspace configuration. This app has no ImageResponse route; a dependency finding is not proof that this route was exploitable. Production and full audit results are below. |
| Medium | The account API had no request throttling. | Added atomic D1 counters shared across Worker instances: 120 reads and 60 writes per account/minute; global guards of 1,200 reads and 300 writes/minute. PUT and DELETE share the write allowance. Returns 429 with Retry-After. Fixed windows can permit a burst around a window boundary. These are application quota guards, not volumetric DDoS protection. |
| Medium | Delayed sync reads could replace a newer device view with an older snapshot. | Single in-flight account read, monotonic revision checks, account-response validation, and rejection of reads overtaken by device edits or writes. Newer server snapshots still apply normally. |
| Medium | Recovery and deletion could race with changes made while a dialog/request was open. | Recovery confirmation checks the reviewed revision and edit generation. Deletion locks edits until the response has been handled and rechecks pending writes. Server conditional writes continue to prevent stale overwrites. |
| Medium | Blocked browser storage could throw before startup completed. | Startup catches storage failures and exposes the existing paused-editing warning rather than leaving a hidden/blank interface. |
| Medium | Health and personal records remain readable in browser storage; clearing a copy was not available in the app. | Added a typed-confirmation device-clear control. It clears only Minimal storage, preserves unrelated website settings, does not send a server DELETE, and pauses cleared tabs so they cannot silently repopulate the cache. Practice mode clears only practice records. This is a privacy control, not encryption. |
| Low–Medium | Request bodies lacked an application read deadline; revision parsing accepted noncanonical numeric forms; parse failures could echo input fragments. | 900 KB streaming and declared-size checks, a 10-second body deadline, strict decimal revisions, generic validation errors, 413/408 responses. Size validation also runs after optional field defaults are added. |
| Low–Medium | The page lacked a frame-ancestor restriction. | CSP now restricts framing to self and the named ChatGPT parent origins; blocks child frames, workers and objects; retains the exact inline-script hash, same-origin forms and limited network destinations. Successful local Worker response verified. No public/index.html bypass or shipped source maps were present. |

## Dependency results

The before scan reported **1 critical, 16 high, 17 moderate and 7 low** findings in its metadata. Counts are package-manager findings, not a count of reachable exploits.

After the updates:

- **Production dependencies: 0 known advisories** in the scan run for this review.
- **Full dependency tree: 1 high advisory**, no critical/moderate/low findings.
- Remaining: `braces` 3.0.3, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). No patched version was available when checked. Paths are `eslint-config-next → fast-glob → micromatch → braces` and `vinext → vite-plugin-commonjs → vite-plugin-dynamic-import → fast-glob → micromatch → braces`.
- These paths process build/lint file patterns; the application does not pass users' food, notes, or other request fields into them. Build only trusted project sources; track upstream replacement/fix. The full scan remains nonzero and is not labelled clean.

Evidence files: `dependency-audit-before.json`, `dependency-audit-after.json`, `dependency-audit-production.json` alongside this report. Registry/advisory results are a dated snapshot; rerun before each release.

## Other code paths reviewed

- Database access uses bound SQL parameters. Current/previous records use atomic revision checks; deletion leaves a tombstone revision to prevent stale devices from restoring deleted content without an explicit conflict decision.
- State endpoints have private/no-store caching. Write requests require the same origin. Error responses do not intentionally log or return record payloads.
- Backups reject unsafe prototype keys, excessive nesting/size, duplicate record IDs, invalid dates and bounded field violations. Ordinary notes/tasks are rendered as escaped text. No app-level eval or shell execution of user records was identified.
- The app API does not fetch user-supplied URLs or accept file uploads. Source links must use HTTPS. Barcode requests go directly to the fixed Open Food Facts destination; no history or notes are included. Developer-avatar loading contacts GitHub; suggestions run on-device.
- A credential-pattern scan of 155 tracked files found no matching private keys, GitHub/OpenAI/AWS credentials, or tracked environment/database/runtime-state files. This is a heuristic current-source check, not a historical secret audit or proof that every possible secret format is absent.
- No native iOS/Android app project, native permissions, signing setup, or store binary exists in the reviewed source. There are no current cash payouts or coupon-redemption endpoints to secure.

## Verification completed

- Existing launch/API suite: same-origin writes, per-user query boundaries using supplied test identities, required revisions, concurrent stale-write rejection, SQL parameter binding, previous snapshot, deletion/tombstone and stale resurrection prevention; strict import/date/ID tests. These tests preserve existing boundary behavior; they do **not** constitute the deferred authentication review.
- Added reproducible security suite: tampered portions/ingredients, body size/deadline and generic errors, method/content-type/revision handling, persistent per-account/global rate limits and window reset, sync races, recovery/deletion locks, storage failure and device-clear isolation.
- Food/exercise library and nutrition arithmetic tests passed.
- TypeScript check and production build passed with the upgraded dependencies.
- Only the new rate-counter migration was generated and applied successfully to the local D1 preview; existing migration history and health records were not rewritten. Hosted publication applies the same schema-only migration.
- Built Worker root returned the expected security headers with a verified inline-script hash; `/index.html` returned 404. Browser practice-demo smoke test passed under the built CSP. The clear-device confirmation was inspected without clearing real records.

Run the committed security regression suite from the Site source checkout with `pnpm test:security`.

## Before a public or app-store launch

1. **Review authentication later, as requested.** Store/public release approval cannot include an unreviewed identity, session, logout and account-lifecycle boundary. Nothing in this review certifies that boundary.
2. **Decide sensitive-data storage and retention.** Browser localStorage and exported JSON backups are plaintext to someone with device/browser access; they are not end-to-end encrypted. Clearing this device does not clear other devices or downloaded backups. Record deletion removes the current/previous app payloads; minimal account/revision/rate-counter metadata remains. Provider backup retention was not verified. A native app needs its own app-private/encrypted storage, Keychain/Keystore key handling as appropriate, backup rules, and WebView/deep-link review once implemented.
3. **Publish an accurate privacy policy and store disclosures.** Cover health/activity/nutrition/notes, the hosted database and browser cache, external barcode/avatar requests, deletion/retention and support. Complete Apple privacy details and Google Play Data Safety against the final app's actual behavior; do not invent declarations from this prototype.
4. **Verify production operations.** Test backup restoration beyond the single previous snapshot; define retention, incident response, non-sensitive error monitoring, resource alerts and edge abuse controls. Application throttling itself still consumes platform resources. No sustained load test, provider configuration audit, or public traffic-volume assurance was performed.
5. **Review the final native release.** Recheck dependencies and network/transport settings, permissions and privacy manifests, signed release configuration, embedded secrets, file exports, screen/device exposure and platform policy compliance. A website build is not a reviewed iOS/Android binary.
6. **Resolve or explicitly accept the remaining build-tool advisory** with a trusted-source build policy and revisit it on dependency updates. For a broad public launch, obtain independent testing of the final deployed system.

The current owner-private audience is preserved. Sites source publication is separate from the owner's GitHub repository; this review does not claim GitHub was updated.

## References

- [OWASP HTML5 Security Cheat Sheet — browser storage and untrusted data](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [OWASP REST Security Cheat Sheet — validation and request controls](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [Next/ImageResponse advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)
- [React server-function advisory](https://github.com/advisories/GHSA-wx67-qw84-cm4g)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Data Safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
