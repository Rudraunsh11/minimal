# Minimal Supabase foundation — 24 October 2026

## Actual status

- Owner-controlled existing project: `drdunpstvvotmxdvgolv` (`Rudraunsh11's Project`), free organization, Sydney region. No new paid project was created.
- Remote migration recorded by Supabase: `20261023201906_minimal_encrypted_account_storage`.
- Database objects are installed. Existing website data was not uploaded. The first verification found zero cloud records.
- Security and performance advisors returned no findings after migration. This is an automated check, not an independent audit.
- `cloud-crypto.js`, `cloud-store.js` and `auth-client.js` are prepared and locally tested adapters. **They are not loaded by the live Render app.** The live app remains device-only.
- The owner now prefers email/password registration as the main flow. The adapter supports signup, signin, confirmation resend and password recovery, but production SMTP, account UI and real delivery acceptance are still required. A Google web client has been created with owner approval; configuring that optional provider still requires owner-side secret entry.
- The Render private-storage checkpoint adds optional local encryption and encrypted file backups. Users who have not enabled it still have unencrypted browser records; previously downloaded plaintext JSON files remain unchanged. Cloud encryption alone does not change local saving.

## Security boundaries

`minimal_cloud_state` uses the authenticated user's UUID as primary key and has forced RLS. Explicit grants exclude anonymous users. The three policies restrict SELECT/INSERT/UPDATE to the verified account and a live Auth session. The narrow helper in the non-exposed `minimal_private` schema is SECURITY DEFINER solely to inspect the caller's Auth user/session. Its search path is empty; PUBLIC and anon execution are revoked. It returns a Boolean only. User-editable metadata is never used for authorization.

API functions run SECURITY INVOKER. Writes use expected revisions and preserve an encrypted previous snapshot. A delete writes a monotonic tombstone and clears both snapshots rather than dropping the row, preventing a stale first-save request from recreating deleted data.

Encrypted payload checks cap envelopes at 28 MB. The crypto adapter accepts at most 20,000,000 plaintext UTF-8 bytes, uses AES-256-GCM, random 16-byte salt and 12-byte IV, and PBKDF2-SHA256 with 600,000 iterations. Additional authenticated data binds the project and owner UUID. Passphrases and derived keys are not persisted by this adapter. Wrong-account or tampered ciphertext fails authentication before parsing. The existing record validator must run before encryption and after decryption.

The database cannot prove that a malicious owner client genuinely encrypted its own data; shape validation is a boundary against accidental plaintext formats, not a cryptographic proof. Backend administrators can see owner IDs, sizes and update times, but the intended client uploads encrypted record content only. XSS or a compromised unlocked device can read records in memory; encryption does not make those threats disappear.

## Required Google owner setup

1. Open https://console.cloud.google.com/auth/overview in your own Google account. Create/select a Google Cloud project for Minimal.
2. Configure Audience for the intended external users. During testing, add your own Google email as a test user.
3. Set app name Minimal, support/developer contact to your own address. Request only `openid`, email and profile scopes; no Gmail, Drive or Calendar access is needed.
4. Create an OAuth client of type Web application at https://console.cloud.google.com/auth/clients/create .
5. Authorized JavaScript origin: `https://minimal-rudraunsh.onrender.com`
6. Authorized redirect URI: `https://drdunpstvvotmxdvgolv.supabase.co/auth/v1/callback`
7. Enter the generated Client ID and Client Secret directly into the Google provider configuration at https://supabase.com/dashboard/project/drdunpstvvotmxdvgolv/auth/providers?provider=Google . Never put the Client Secret in frontend assets, chat, GitHub or browser storage.
8. Set Supabase Site URL to `https://minimal-rudraunsh.onrender.com/` at https://supabase.com/dashboard/project/drdunpstvvotmxdvgolv/auth/url-configuration . Allow this exact production return URL. Avoid wildcard redirects; keep development origins separate.
9. Keep provider checks enabled. Do not enable Skip nonce checks for the web flow or automatic email confirmation as a workaround.
10. Test consent, successful callback, denied/cancelled consent, session revocation and account recovery. Publish the Google app for the intended audience only after testing and applicable Google requirements are met. A bought domain is not necessary for the initial default-project-URL flow; Google brand verification and a branded auth domain are separate later decisions.

Official setup: https://supabase.com/docs/guides/auth/social-login/auth-google

The plugin provides database/project access, but does not provide Google Cloud OAuth application creation or the user's Google credentials. Owner-side credential/consent setup is required. No Google client secret has been created, retrieved or stored by these files.

## Client integration gates

Before importing these adapters into the Render build:

- Vendor/pin the official `@supabase/supabase-js` client to reviewed version 2.118.0 and retain its license/package integrity; avoid a runtime CDN dependency. The SDK is not currently installed or shipped with these foundation files. Upgrade only with docs/changelog review and tests.
- Instantiate through `MinimalCloudAuth.create`, using the project's enabled modern publishable key and tab session storage. Never use a service-role key. The adapter uses PKCE, one fixed production redirect, session refresh and verified `getUser` results. Auth session storage is tab-scoped, distinct from encryption key storage.
- Add only the exact Supabase HTTPS API origin to CSP connect-src. Keep the app-file service worker from caching Auth, REST responses or personal records.
- Show sign-in/cloud status separately from durable local saving. No user records should upload simply by signing in. Obtain explicit consent for initial device-to-account upload.
- Require the user to choose a private encryption passphrase. Explain that Google-account recovery does NOT recover this separate passphrase. Do not offer a misleading Forgot passphrase button. Define a separate recovery-key design before claiming recoverable end-to-end encryption.
- `put` accepts an explicitly read cloud revision; stale writes and unknown network outcomes pause and require a fresh read. Do not blindly retry a write with an unknown outcome. Review conflicts without overwriting local or remote records.
- Restore should preview/confirm, require durable local saving to be idle and preserve/export the current copy before replacement. Validate decrypted records using the 20 MB Render schema, not the older 900 KB source configuration.
- Define offline queue and account-switch behavior, opt-in automatic saving, safe logout, deletion confirmation, and record isolation before enabling a public sign-in button.

## Verification

Local tests:

```
node supabase-foundation/crypto-store-test.mjs
node supabase-foundation/auth-client-test.mjs
```

`isolation-test.sql` runs synthetic Auth users and sessions inside a transaction followed by ROLLBACK. It exercises actual hosted database RLS and functions. Synthetic identities and records must not persist. Initial hosted tests passed own access, cross-account denial, owner-change denial, stale CAS denial, encrypted previous save, plaintext-format denial, and rejection of revoked, unverified and anonymous access. The extended hosted test also passed deletion tombstones, stale-device resurrection denial and subsequent revision-aware writes. The anonymous HTTP checks returned 401/42501 for both the table and write RPC using the publishable key; public Auth settings responded normally.

This does not substitute for an actual Google sign-in, two real user sessions over HTTP, physical iOS/Android tests, an independent audit or a recovery drill with a fresh database.

## Capacity and backup limits

The 20 MB figure is a per-snapshot application budget, not allocated server storage for every user. Encryption/base64 and the previous snapshot consume extra capacity. Supabase Free has a shared 500 MB database budget; do not promise unlimited accounts or storage. Establish quotas, usage alerts and an approved upgrade policy before broad public account signup.

A live cloud record and its previous version are not an independent off-site backup. Supabase Free does not include automatic database backups and inactive projects can pause. Add scheduled independent encrypted backups and test restoration before calling disaster recovery complete.

No paid plan, domain, email service or extra database has been purchased.

## Email/password launch gate — 3 November 2026

`auth-client.js` supports email/password signup and signin, confirmation resend and password-reset requests with fixed production return URLs. It refuses unverified users and unexpected auto-confirmed signup sessions; password changes require a recovery session or the current password. The adapter is still not loaded by the public app. It does not create a public user roster, persist passwords or upload records when someone signs in.

Supabase's default sender is limited to project-team addresses and is unsuitable for public signup. Configure a verified production sender, then verify confirmation, resend, forgotten-password delivery, expired links, denied sessions, throttling and two real users before activation. Do not disable confirmation to bypass email delivery. Authorized operators can view registrations in Supabase Authentication → Users; passwords must never be readable.

Production recovery return URL: `https://minimal-rudraunsh.onrender.com/account-recovery.html`. That page and its SDK integration must be implemented and reviewed before enabling the adapter. The account password must not silently become the private-storage passphrase. Recovery of one does not recover the other.
