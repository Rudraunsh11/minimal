# Render device-only beta

Owner selected Render on 18 October 2026 and confirmed My Workspace. Use Rudraunsh11/minimal, branch codex/device-privacy-and-latest-preview, repository root. Build: `node render-beta/build.mjs && node render-beta/test.mjs`. Publish: `render-beta/dist`. Set SKIP_INSTALL_DEPS=true; no package installation is needed. Choose Static Site, not a paid web service/database. Keep manual deploys until the source is reviewed for an automatic deployment policy.

The Render adapter reuses the tested dependency-free beta, updates provider disclosures and embeds a content security policy. Apply response headers in render-beta/headers.json under Render Settings → Headers. Those settings require the Dashboard/API because the current create-static-site tool does not expose headers. The embedded policy cannot enforce frame-ancestors; that directive requires the HTTP header. All private account APIs and online backup/archive controls are excluded. Device records remain in one browser/origin, unencrypted; JSON export/restore is the transfer method. Sites account records/archives are not automatically migrated.

Publication is only complete after Render reports the specific deployment live and the actual HTTPS URL is checked. Creation may require connecting Render to the private GitHub repository. Never make the repository public or expose tokens to work around missing access. No native app-store release or universal bug-free guarantee is implied.

## Verified deployment

Live: https://minimal-rudraunsh.onrender.com/

Service srv-dbab9ec9v7es73fs9tkg; deployment dep-dbab9ek9v7es73fs9ukg; source 107b2f3a6e63053448748f4e76e296401c860ce1. Render reported live on 18 October 2026. Remote build and beta tests passed. HTTPS root returned 200; local browser rendered the dark default and device-only notice. Custom HTTP CSP/frame restrictions still need provider configuration; in-document CSP is active. Provider sends HSTS and nosniff. Automatic deploys remain off. The separate Docker service minimal-qsz1 was not modified.
