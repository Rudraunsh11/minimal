# Minimal — reported flaws and release gates

Owner report: 15 items. Updated 24 October 2026 (Asia/Kolkata).

## Priority and disposition

| Priority | Reported items | Change / acceptance condition | Status |
|---|---|---|---|
| P1 — reliable editing | 1, 5, 6, 9 | Stable save-status location; modal locks page scroll; background delegated events blocked; page renders deferred during editing; responsive form widths and visual-viewport height | Implemented; mobile-width browser checks passed |
| P1 — record correctness | 3 | Central transition checks reject new/changed future food, water, training, timed movement, step, learning and focus records and new future habit checks. Tasks, calendar and notes remain available for planning. Past logs allowed; existing future records retained/removable | Model tests and future-water browser check passed |
| P1 — data protection | 12 | Encrypt active records, previous snapshot and retained migration copies with a recovery/key-management design; migration must be atomic and verifiable | OPEN — current IndexedDB and JSON exports remain unencrypted |
| P2 — usability | 2, 4, 8, 11 | Manipulation touch behavior on controls; 16px form inputs; constrained desktop width; navigation attached to body on mobile; larger Notes textarea | Implemented; mobile-width browser geometry checked; physical pinch/double-tap still needs devices |
| P2 — date clarity | 7 | Date resets to today when changing sections; visible Back to today notice for historical/future views; local midnight rollover when following today | Implemented; route reset checked in browser |
| P2 — history control | 10 | Delete confirmation for learning and focus. Delete linked focus/learning records together and derive rewards again | Model tests passed; learning deletion and XP recalculation verified in browser |
| P1 — recoverable accounts | 13 | Authenticated private cloud records, durable sync, account recovery and independently restorable backups | OPEN — no account/database service is connected to this Render static app |
| P2 — capacity | 15 | Explicit per-account quotas, shared provider quota, monitoring and storage upgrade thresholds | OPEN — dependent on cloud project and approved operating budget |
| Release gate | 14 | Independent reviewer physically tests iPhone + Android and signs a dated report with versions/devices/findings/retest | OPEN — desktop tests are not an independent physical-device security audit |

No user data was uploaded, cleared or migrated by this release. Browser checks used separate practice records.

## Implemented regression coverage

Run `node render-beta/build.mjs` then `node render-beta/test.mjs`.

- Existing static asset, CSP, script syntax, safe database startup and durable focus checks.
- Offline shell integrity, installation failure/repair, multiple-window update guards and pending-save safety.
- Every supported actual-activity collection rejects future additions/changes and accepts past/today entries.
- Historical future records survive unrelated saves and can be removed.
- Future planning stays available; future habit completion is rejected.
- Focus-linked learning deletion works in either direction; standalone learning deletes independently.
- Save banner stays in one DOM position; modal render/event isolation is present.

Browser observations at 376px viewport: dialog top stayed 12px before/after typing; Notes textarea 230px minimum; no horizontal document overflow; body fixed while editing and static after closing; navigation fixed with its bottom equal to viewport height (766px). Test learning entry earned 15 XP; deletion restored 0 XP. These are desktop browser observations, not physical-phone certification.

## Security / cloud implementation sequence

1. Select and connect an owner-controlled account/database project. Keep Render as static frontend. Never put service-role/database credentials in frontend assets, browser storage or GitHub.
2. Define key recovery BEFORE encrypting existing local records. A passphrase-only vault cannot be recovered by email alone. A key stored beside ciphertext does not meaningfully protect a copied browser database. Protect previous snapshots and legacy copies too. Test wrong key, tampering, interrupted migration, rollback, restart and multiple tabs using synthetic records.
3. Implement managed login, verified recovery flows, user-bound authorization and database row policies. Test two unrelated accounts against every read/write/delete/export operation. Validate exact redirect origins, session expiry/revocation and rate limits.
4. Implement an explicit local-to-account migration with a verified receipt; do not silently upload the current device's health logs. Use revision-based writes, idempotent operation IDs, offline queue and conflict review. Never claim cloud-saved until server acknowledgement.
5. Add scheduled off-site backups with retention, access controls and restore into a fresh database. A synchronized record and one previous local snapshot are not independent backups. Exercise lost-device and lost-account recovery.
6. Establish account quotas and aggregate capacity monitoring. The existing 20 MB device budget is an app limit, not cloud storage or a reserved browser quota. Increasing one constant does not add server storage.
7. Commission independent security review and physical iOS/Android tests. Fix and retest findings before removing the beta qualification.

## Free service constraints checked 24 October 2026

- Render free Postgres expires after 30 days; it is unsuitable as the sole permanent account database. Free web-service local files are ephemeral. https://render.com/docs/free
- Supabase Free currently lists 500 MB database storage and 1 GB file storage, shared by the project; inactive projects can pause. These are not per-user allocations. Free tier is a possible evaluation option, not an unlimited-storage or backup guarantee. https://supabase.com/pricing

No paid plan was enabled, no expiring database was created and no cloud credentials were requested in chat. Cloud project selection is pending owner input.

## Physical device / independent audit checklist

Record device model, OS version, browser/installed-app version, app release and tester. For each: video or reproduction, expected result, actual result, severity, fix reference and retest.

- iOS Safari and installed Home Screen app; Android Chrome and installed PWA.
- Open/close Notes repeatedly after scrolling. Type a long note, select text, paste multiple lines, show/hide keyboard, rotate. No moving popup, background action or escaped input; draft survives reopen/restart after Saved.
- Focus topic and food search keyboard input; Enter submits only intended form; Escape/Back closes expected surface and restores focus/scroll.
- Double-tap controls without accidental zoom; deliberate pinch zoom remains accessible; zoomed text and landscape retain usable controls.
- Bottom navigation remains anchored while scrolling; safe areas and software keyboard do not cover Save/Cancel.
- Local midnight, resume after several days, timezone changes, planned dates and future activity rejection.
- Focus completion while another editor is open; save failure, suspension and reopening; no duplicated sessions/rewards; focus/learning deletion stays linked.
- Offline cold start after ready; missing/corrupt shell; update with pending save/open editor/multiple windows; no record loss.
- Low-space/denied storage, interrupted writes, stale tab conflict, backup restore, user clearing data and retained legacy copies.
- Inspect storage, cache, exports, logs and network for personal data leakage; review scripts, XSS paths, CSP and third-party requests.
- After cloud work: cross-account isolation, session revocation, recovery abuse, exports/deletion, encrypted backup restore and quota exhaustion.

Security review must be independent to be described as independent. No such review has been performed or commissioned by this release.
