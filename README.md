# Minimal

A daily planner and health log combining tasks, notes, calendar, focus sessions, nutrition, training and rewards. Dark mode is the default; light mode is optional.

## Current hosting

The live private account service runs on Sites with trusted platform identity and Cloudflare D1. The frontend is in `app-shell.html` and `public/`; the account API is in `app/api/state/route.ts`, schema in `db/`, and migrations in `drizzle/`. No personal records or credentials belong in this repository.

Account saving is automatic. Hosted browser copies are temporary by default, with an explicit Remember this device option. Notes and unfinished drafts are part of synced account records. Export is optional for safekeeping, not a daily requirement. Read CHECKPOINT-02-DEVICE-PRIVACY.md for storage limitations.

## Development

Use the Node and pnpm versions in package.json. Install dependencies with pnpm install, then pnpm dev. The maintained local Sites plugin provides its documented development identity; it is not a production authentication system. Run pnpm test:security, pnpm test:privacy, pnpm test:food and pnpm test:packaged. Production builds use the Sites build workflow.

## Vercel migration

This snapshot is not a ready-to-launch Vercel account service. It relies on Cloudflare bindings, the Sites worker runtime and trusted identity headers added by the hosting platform. A public Vercel deployment must never trust caller-supplied oai-authenticated-user headers.

Before a Vercel launch: choose a free-tier identity and database provider; replace platform authentication and storage with server-side verified identity and a supported database adapter; migrate records safely; configure production security headers and secrets; then repeat account isolation, rate limiting, recovery, browser and device checks. Do not connect this branch and assume it provides equivalent cloud saving. No Vercel production deployment has been made.

## Nutrition and licensing

Food search calculates calories and macros from standard portions and scales them when the amount changes. Match raw/cooked foods, product variant and units. Indian prepared dishes are labeled estimates; packaged references are market-specific. Food labels and databases contain uncertainty, so calculated values cannot guarantee the exact nutrients in an individual plate. See public/DATA-LICENSES.md and public/EXERCISE-LICENSE.md.

## Release status

See LAUNCH-CHECKLIST.md. Hosted two-account verification and later launch checkpoints remain open. The existing website stays private; a target date is not a launch guarantee.

## Source snapshot and local static preview

Snapshot of Sites source commit 409850d0d43c5b108cccfdaf8063890d63e6e909. Site-specific identity and runtime files are excluded. `.openai/hosting.json` retains only non-secret binding names for local development; register/select the correct Sites project before publishing through Sites.

Root index.html and its adjacent assets also provide a device-only preview: run Python's static server on port 8765 in this directory and open http://127.0.0.1:8765/. This address saves in that browser only. It is not the online account service. The public/ copies are the assets served by the full account app. Keep both copies aligned when editing.
