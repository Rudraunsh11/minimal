# Checkpoint 1 — device database (21 October 2026)

The Render device-only beta now uses IndexedDB with a 20,000,000-byte personal-record budget and up to 100,000 entries per collection. This is an application limit, not a reserved browser quota or cloud storage allocation. The private Sites backend policy is unchanged.

Existing valid browser records migrate once. The original localStorage copy remains untouched until the user explicitly clears device records. A successful read-back is required before editing starts. Practice records stay separate. A clear writes a revision tombstone so retained older copies cannot resurrect on reopen.

Writes use atomic IndexedDB transactions and revision checks. Rapid edits queue the newest complete snapshot. Saving errors preserve the last committed database state and retain the pending draft in the open tab, with export/retry controls. The app warns before leaving with pending work. A crash before transaction completion can still lose pending edits. Stale-tab conflicts pause editing rather than overwrite a newer save.

Settings displays usage, browser estimates, an optional persistent-storage request, and a review/restore action for the previous committed snapshot. Previous-save recovery is not an independent backup. JSON export/restore remains available. Restores validate the complete data before replacement. No records are automatically deleted to free space.

## Verification

- Database tests: migration once, invalid migration, practice isolation, concurrent initialization, transaction rollback, stale revisions, failed-save retry, queued writes, previous-save restore, clearing tombstones and size limits.
- Ten-year synthetic history: 21,900 food entries, 14,600 water entries and 30,000 tasks; 8,644,935 bytes; exact database round trip.
- Real local browser: legacy migration, new edits surviving reopen, 8.64 MB JSON restore and reopen, recovery to the previous practice snapshot.
- Static build: asset references, script syntax, exact inline content-security hashes, disabled account/API paths, revised capacity and database integration checks.
- Focus completion celebration waits for a confirmed database save.

## Reproduce database tests

The shipped app has no package dependencies. The database tests require Node and the development-only npm package `fake-indexeddb` version `6.2.4`. Install it in a separate test directory, then run from the repository:

```sh
node render-beta/build.mjs
node render-beta/test.mjs
MINIMAL_IDB_TEST_PACKAGE=/absolute/test-directory/node_modules/fake-indexeddb node tests/device-database.mjs
```

The tests never connect to production and use only synthetic records. Do not publish test fixtures or the test package in `render-beta/dist`.

## Still open

No accounts, cross-device sync, server backup, encryption, install/offline service worker or closed-app alarms are added here. Browser clearing, private mode, storage pressure or loss of the device can remove local data. Persistence is browser-controlled. Full-state snapshots can use additional memory and recovery disk space. Physical iOS/Android, assistive technology and low-memory device testing remain required. This checkpoint alone does not make the product a supported full release.

Next checkpoint: installable PWA with correct icons, offline shell, cache updates and real-device installation tests.
