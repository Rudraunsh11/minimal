# Minimal release checklist — 4 November 2026

This checklist covers the public Render device app and the planned Supabase account service. The earlier private Sites checklist is preserved in LAUNCH-CHECKLIST-SITES-20261018.md. Its old Vercel, 900 KB and private-hosted account assumptions do not describe the current Render release.

| Area | Implementation / evidence | Remaining acceptance |
| --- | --- | --- |
| Device saving | IndexedDB, 20 MB plaintext record budget, revision checks, save failures/retry, previous save; tests/device-database.mjs | Physical low-memory devices, eviction and multi-tab acceptance |
| Installation / offline | Verified app shell, manifest/icons, explicit multi-window-safe update; tests/pwa.mjs and pwa-client.mjs | Actual iPhone/Android installation, airplane mode, reopening |
| Editing / navigation | Modal background lock, stable notes, activity date guards, reset-to-today, mobile navigation, history deletion; tests/ux-regression.mjs | Physical keyboard, zoom, accessibility and all-feature acceptance |
| Food logging | Meal-based Add food, explicit edit/remove with bounded Undo, compact search, source references, adjustable portions, custom food library, unknown nutrition stays unknown; CHECKPOINT-05-FOOD-DIARY.md and food/custom/regional tests | Nutrition catalogue review; homemade dishes remain estimates; physical-device acceptance |
| Local encryption / file recovery | Optional private storage, recovery key, encrypted backup and explicit restore; CHECKPOINT-04-LOCAL-ENCRYPTION.md | Independent crypto review and physical-device acceptance |
| Account sign-in | Google web client created with owner approval; email/password adapter and accessible account screens prepared/tested in supabase-foundation; synthetic browser signup preview passed | Brevo email verification, SMTP/sender setup, SDK mounting and recovery page, cross-tab email flow, real verification/reset delivery, two-user HTTP testing. Not loaded by the public app |
| Cloud data protection | Supabase forced RLS, live-session ownership checks, encrypted snapshots, revision/tombstone controls; hosted synthetic isolation tests | Opt-in migration, per-account local separation, safe queue/conflict UI, account-switch/logout/delete, public integration |
| Backups / disaster recovery | Local encrypted file export and synthetic fresh-database recovery | Independent scheduled cloud backup destination, retention and operator restore drill |
| Capacity / operations | App size/record limits; Supabase last measured about 11 MB, zero real cloud records; no unlimited-capacity claim | Server-wide quotas, usage alerts, signup/abuse limits, live monitoring and load acceptance |
| Security / dependencies | Static CSP and assets, secret/history review, MIT and upstream notices; automated Supabase advisors clear at last check | Legacy private-prototype dependency upgrades still under verification; independent security audit |
| Privacy / support | Current Render policy and help describe optional encryption and device-only limits | Operator/jurisdiction/retention review before broader account release |
| Release | GitHub main synchronized with development branch; explicit Render deployments, verified app files and recovery-aware update path | Production acceptance evidence and rollback drill. Render still tracks the development branch with automatic deployments off. Repository remains private |

Email/password registration is the owner's preferred main flow. Registered users are visible only to authorized operators in Supabase Authentication → Users. Passwords must never be exposed in an owner-facing dashboard or copied into Minimal records.

The remaining external dependencies cannot be marked complete from source tests alone. No paid service, sender domain or independent audit has been purchased. Native app-store distribution is outside the current installable-browser-app release.
