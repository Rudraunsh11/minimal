# Checkpoint 4 — optional private device storage

Implementation and automated verification completed on 3 November 2026. Publication must be verified separately in Render.

## What users can do

Settings → Private storage lets a user choose a private passphrase, save a random recovery key and explicitly enable encryption. The current database and previous snapshot are encrypted before known old browser copies for that profile are removed. Other profiles and previously downloaded files are not changed. Encryption is optional; existing users are not silently migrated.

Lock now and reopening require the passphrase or recovery key. The recovery key unlocks the encrypted records; it does not restore a lost device or file. Both credentials must be kept privately. Losing both makes the encrypted data unrecoverable. Account passwords and this private-storage key are separate.

When protection is on, normal and pending-record exports are encrypted. Encrypted backup restoration requires private storage at the destination, previews the record counts and requires an explicit replacement action. The target device retains its own encryption credentials. Ordinary JSON import remains available for older backups and is encrypted on write when protection is on.

## Design and limits

- AES-256-GCM, fresh random IV for each encryption, random 256-bit data key.
- Independent passphrase and recovery-key wrappers, each with PBKDF2-SHA256 at 600,000 iterations and its own random salt.
- Authenticated context binds the vault identity, profile and purpose. Parameters and sizes are checked before expensive crypto work.
- Non-extractable working key held in this tab's memory. No passphrase or raw data key is saved by Minimal.
- Atomic database writes and expected revisions preserve concurrent-write protection. Enabling encryption reseals the previous snapshot in the same transaction.
- Schema validation before encryption and after decryption. Existing 20 MB plaintext budget is unchanged; ciphertext and previous snapshots take extra browser space.
- No cloud upload or account integration is enabled. An unlocked app, compromised script, malicious extension or compromised device can still access records. Previously downloaded plaintext backups remain plaintext.

## Verification

`tests/local-vault.mjs` uses synthetic records and real Web Crypto with the test-only fake-indexeddb 6.2.4 package. It covers passphrase and recovery unlock, wrong secrets, tamper/KDF rejection, profile/key isolation, encrypted current/previous rows, stale writes, storage failure, recovery into a fresh database and clearing tombstones.

The earlier local browser run verified opt-in setup, incorrect-passphrase rejection, recovery-key unlock, lock/reopen, retained encrypted water logs and encrypted export. Later safeguards include blocking dialog dismissal during crypto work and requiring encrypted destination storage for restore. Physical iPhone/Android and an independent audit remain open.

## Rollback

After users enable private storage, publish a replacement verified shell that retains the vault reader and the same database schema. Do not roll back to a version that cannot read encrypted rows, discard encrypted records, unregister the service worker automatically or ask users to clear site data. An encrypted backup plus its separately saved credentials is the recovery route.
