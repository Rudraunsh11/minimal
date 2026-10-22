# Checkpoint 2 — installation and offline access

Implemented for the Render device-only beta. The private Sites deployment is unchanged.

## Using it

1. Open the Render address while online. Open Settings → Install & offline.
2. Wait for **Offline access is ready**. The first download is roughly 3.5 MB and requires a working connection. An incomplete download is not reported as ready.
3. Choose Install Minimal. Where a browser installation prompt is unavailable, the app gives platform instructions: Safari Share → Add to Home Screen on iPhone/iPad, Safari File → Add to Dock on supported Macs, or the installation option in Chrome/Edge’s menu. Browser support and the available menu wording vary.
4. Open from your home screen or applications. Built-in tasks, notes, calendar, food references, water, workouts, focus and rewards use the same local saving engine offline. Barcode lookup, external links and the remote developer avatar require internet.
5. Return online and choose Check for updates. Finish open forms and wait for Saved. Close other Minimal windows, then choose Update & reopen when offered.

Installation does not create accounts, cloud sync, server backups, more record capacity or closed-app alarms. Each browser/installed-app storage area may differ. Keep the same website address; export and restore before moving records to another storage area. No native app-store package is created.

## Update and recovery design

- Each offline shell has a deterministic release ID and SHA-256 digest for every public file.
- All files must download and match before installation succeeds. Network errors, timeouts and version mismatches retain the prior working version.
- Public-file allowlist only: no API responses, personal records, barcodes or external domains enter the shell cache.
- No forced activation on install. The explicit update control blocks pending saves/open forms; the worker refuses activation with multiple Minimal windows open.
- A confirmed update locks editing before reopening. IndexedDB is never changed by the worker or installation code. Active timer/workout records remain in the database.
- Missing cached files may be fetched again only if their digest matches the running version. Check for updates repairs missing files when possible. Failed repair retains available files.
- If the opening page is unavailable and cannot be downloaded safely, an isolated Repair & reopen screen offers recovery. It has a restrictive content-security policy and never reads or writes personal records.
- The prior shell is retained during transition; only Minimal-owned app caches are pruned. Browser eviction and clearing can still remove offline access. Personal records retain their separate 20 MB budget; offline files and recovery copies use additional browser space.

## Verification

Automated tests cover manifest/PNG dimensions, all file digests, failed/timed-out/corrupt downloads, cache isolation, offline routing, missing-file repair, recovery page, multi-window activation, pending-save and open-form guards, single reload and untouched personal state. Static checks run as part of the Render build.

Actual Safari local test: offline readiness confirmed; test server changed to HTTP 503; full app reopened, 250 ml added to the 500 ml practice history, and 750 ml survived another offline reload. After reconnecting the server, Update & reopen changed app release from 0e032ce8a146ca69 to 36e931d2dc091dc0 and retained practice tasks, notes, food and water records. Later recovery/timeout refinements are covered by the automated tests.

Still requires owner acceptance on physical iPhone/Android hardware: install, reopen in airplane mode after readiness, add a sample record, reopen again and confirm persistence. Native home-screen prompts, browser eviction and closed-device behavior are not certified by a desktop test.

## Reproduce

```sh
node render-beta/build.mjs
node render-beta/test.mjs
```

There are no production package dependencies. PNG icons are committed alongside their code-native SVG source; they need no image tooling during deployment.

## Rollback

Before rolling back code, export records. The prior deployed storage release has no service worker: a rollback must publish a replacement worker, not only delete sw.js, because installed workers can continue serving their cached app. Publish a new verified shell with the last working app and the same IndexedDB schema. Do not clear user records or unregister workers automatically. Ask users to save, close other windows and apply the replacement version.
