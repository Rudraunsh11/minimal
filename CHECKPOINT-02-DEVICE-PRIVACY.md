# Checkpoint 2 — Device-data privacy

18 October 2026. Implementation complete; this is not a declaration of public-launch readiness.

Hosted account records now use a temporary tab copy by default. Remember this device is an explicit account-specific choice in Settings. It copies the active records before changing policy and removes the previous storage copy after a successful switch. Browser storage is plaintext, not encryption. Browsers can restore temporary storage after reopening a session; extensions and access to the browser profile remain risks.

Sign-out, account deletion and Clear device remove the relevant copies and clear hidden editor text. Matching open tabs receive an invalidation event without record contents. Where browser restrictions prevent storage access or cross-tab signalling, the interface explains the cleanup limitation. Downloaded backup files cannot be erased by the app.

Older unassigned or other-account copies are never automatically loaded into a signed-in account. They are preserved for explicit recovery/cleanup. A verified account can review, export, replace or remove its own alternate copy. Unsynced copies remain until a successful account save; conflicting pending copies are preserved for review. Never imply that all historical plaintext has already vanished from a device.

Notes and unfinished drafts sync as part of account records. No authentication tokens are placed in Web Storage. Appearance preferences can remain on the device. Local-file/local preview and practice mode continue using device saving and explain their different behavior.

Verification: device-storage factory tests and account/session regression tests cover mode switching, storage failures, scoped purges, pending-copy recovery, conflicting copies, metadata-before-body writes and sibling-tab invalidation. Existing food portion and packaged-label tests also pass. Local browser QA verified the default-off switch, explicit confirmation text and cancellation; destructive cleanup and failure paths were exercised in automated tests, not against personal browser records. Real-device checks and the two-authorized-account hosted test remain outstanding launch evidence.

GitHub contains source, not private user records. The existing account service relies on Sites trusted identity headers and Cloudflare D1. Moving the full service to Vercel requires a supported identity provider and database adapter, trusted server-side identity verification, migration and fresh isolation testing. Never trust browser-supplied identity headers on a public Vercel endpoint. No Vercel production deployment is claimed.
