# Vercel device-only beta — 18 October 2026

The owner explicitly selected a device-only beta. This is separate from the private Sites account service. No Vercel deployment has yet been verified.

## Import settings

- Repository: Rudraunsh11/minimal.
- Reviewed branch: codex/device-privacy-and-latest-preview (PR 1; not main).
- Root directory: repository root (`.`).
- Framework preset: Other; root vercel.json sets framework null.
- Build: node vercel-beta/build.mjs.
- Install: echo No dependencies required.
- Output: vercel-beta/dist.
- Node: 22 or newer. No environment variables or account tokens are needed.
- Keep the free/Hobby scope. Do not upgrade or purchase a domain.

The root configuration deliberately builds only the static beta. It does not install the repository's Sites dependencies, compile its Worker, or deploy its account API. The builder uses Node built-ins and explicit frontend assets. Generated vercel-beta/dist is ignored by Git; Vercel builds it from reviewed source. Do not choose the Next.js preset or pnpm install for this beta.

## Included and excluded

Local tasks, notes, calendar, food/water, workouts, focus completion, virtual rewards, plans and appearance are retained. Browser local storage is unencrypted, limited to 900 KB records and specific to one origin/browser. No sign-in, cloud sync, online archive, full-account encrypted backup, server database or closed-app alarm is advertised or deployed. JSON export/restore remains available and must be safeguarded. Existing Sites account records are not automatically migrated. Export/restore is needed to transfer active records between the two addresses; online archives are not imported by that JSON operation.

## Evidence

- Full application's regression suite and TypeScript pass locally.
- Added focus-completion tests cover paused/early deadlines, resume, delayed completion date, replay deduplication and break exclusions.
- node vercel-beta/build.mjs and node vercel-beta/test.mjs pass.
- Beta tests validate referenced assets, all script syntax, exact CSP hashes, dependency-free build and no account scripts/credential/server files in the output.
- Real local browser: loaded the deployable build with its headers; started a one-minute focus block, paused/resumed, navigated away, observed automatic completion/history saving; checked beta notices and removed account controls. This does not certify all devices or every interaction.
- The full Sites dependency audit still reports GHSA-vfj7-8cjw-p6xm in build dependency braces 3.0.3 with no patched release. The static beta uses no package dependencies/build glob parser. No advisory is suppressed.

## Deployment and rollback

Connect Vercel to the intended account; import the reviewed branch with settings above. Verify the returned deployment reaches Ready before claiming publication. Test the actual HTTPS URL for saving across refresh, food portions, tasks/notes/calendar, focus history/rewards, privacy links and security headers. Check a real phone and keyboard use. Promote only that verified deployment. Keep the previous Vercel deployment for rollback; code rollback does not recover cleared browser data. Records belong to the origin, so moving between preview/production/custom domains requires explicit JSON export/restore.

Vercel's setup page failed with a certificate authority error in the available browser. It was not bypassed. The Vercel connector is not connected. Account connection/sign-in is the remaining external step before deployment can be executed and verified.
