# Vercel release handoff

18 October 2026. No Vercel deployment has been completed. The current account service uses Sites trusted identity and Cloudflare D1. Do not import this whole repository using the default Next.js preset and assume equivalent authentication/saving.

## Account-connected release

Connect the intended Vercel project and choose a compatible identity/database provider on its free tier. Configure secrets through the provider UI, never Git. Replace trusted-header identity with server-verified sessions and replace the Cloudflare/D1 adapter. Migrate data into an isolated environment; verify account isolation, revisions, archives, full backup/restore, quotas and security headers. Preview first, then approve the production domain/audience. A service bypass token is not user authentication and must not be used as a shortcut.

## Optional device-only beta

Requires the owner's explicit choice. This would be a separate static deployment with visible device-only saving notices, no account-sync claims and no online archive/restore controls. Browser clearing or a new device would not preserve records. No such public beta has been substituted for the account app without authorization.

## Release checks

Run pnpm test, pnpm exec tsc --noEmit, pnpm audit --audit-level=high and pnpm check:release. The last two currently report open gates. Confirm provider billing limits and a free deployment scope. Vercel's Git integration can create automatic deployments once connected; configure it only for the reviewed target. Native App Store/Play Store publication is a separate process.
