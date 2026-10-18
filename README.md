# Minimal

A daily planner and health log combining tasks, notes, calendar, focus sessions, nutrition, training and rewards. Dark mode is the default; light mode is optional.

## Current hosting

The live private account service runs on Sites with trusted platform identity and Cloudflare D1. The frontend is in `app-shell.html` and `public/`; the account API is in `app/api/state/route.ts`, schema in `db/`, and migrations in `drizzle/`. No personal records or credentials belong in this repository.

Account saving is automatic. Hosted browser copies are temporary by default, with an explicit Remember this device option. Notes and unfinished drafts are part of synced account records. Export is optional for safekeeping, not a daily requirement. Read CHECKPOINT-02-DEVICE-PRIVACY.md for storage limitations.

## Development

Use the Node and pnpm versions in package.json. Install dependencies with pnpm install, then pnpm dev. The maintained local Sites plugin provides its documented development identity; it is not a production authentication system. Run pnpm test:security, pnpm test:privacy, pnpm test:food and pnpm test:packaged and pnpm test:storage. Production builds use the Sites build workflow.

## Vercel migration

This snapshot is not a ready-to-launch Vercel account service. It relies on Cloudflare bindings, the Sites worker runtime and trusted identity headers added by the hosting platform. A public Vercel deployment must never trust caller-supplied oai-authenticated-user headers.

Before a Vercel launch: choose a free-tier identity and database provider; replace platform authentication and storage with server-side verified identity and a supported database adapter; migrate records safely; configure production security headers and secrets; then repeat account isolation, rate limiting, recovery, browser and device checks. Do not connect this branch and assume it provides equivalent cloud saving. No Vercel production deployment has been made.

## Nutrition and licensing

Food search calculates calories and macros from standard portions and scales them when the amount changes. Match raw/cooked foods, product variant and units. Indian prepared dishes are labeled estimates; packaged references are market-specific. Food labels and databases contain uncertainty, so calculated values cannot guarantee the exact nutrients in an individual plate. See public/DATA-LICENSES.md and public/EXERCISE-LICENSE.md.

## Release status

See LAUNCH-CHECKLIST.md. Hosted two-account verification and later launch checkpoints remain open. The existing website stays private; a target date is not a launch guarantee.

## Storage growth

Settings → Room to grow shows active-record storage. Hosted accounts can move older food and water logs into read-only online archives, then view them in Settings. No automatic pruning occurs. Active records have a 900,000-byte cap; accounts support at most ten archives, each bounded by the same source snapshot limit. Notes, tasks and training are not archived by this feature. This is a bounded initial release architecture, not unlimited storage.

Normal JSON backups export active records only. Archive downloads are separate; archiving is not independent disaster recovery. Account erasure includes online archives. See CHECKPOINT-03-STORAGE-GROWTH.md for evidence and limitations.

## Snapshot notes

Snapshot of Sites source commit a3f77dd1e6dc32d8464b09a1cb3c7b9bf68b29fb. The hosting manifest includes only non-secret D1/R2 binding names; select/register a Sites project before using its publishing workflow. No local database, runtime state, credentials or user archives are included.

Root index.html and adjacent assets support a device-only static preview when served at http://127.0.0.1:8765/. The full account app uses app-shell.html and public/. Keep both frontend copies aligned. A static preview does not provide account saving or online archives. Vercel migration remains separate, as described above.
