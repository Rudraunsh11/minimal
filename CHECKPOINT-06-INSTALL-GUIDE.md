# Install Minimal across browsers — 5 November 2026

Today → Install app now falls back to a clear, numbered guide for Safari on iPhone/iPad and Mac; Chrome on iPhone/iPad, Android and computers; and Google/in-app browsers. Settings → Install & offline → Browser instructions opens the guide even when a native install prompt is available. A suggested route is chosen locally from browser/device hints; the user can always choose another route. A compact path diagram and named browser-menu steps help users find the final Add/Install action.

`/install.html` is a shareable installation page using the same guide module and styles. It reads no records, registers no worker and denies fetch connections through its CSP. Its new asset paths also let an older app shell load the guide online without clearing or migrating the user's data. This is access to instructions, not forced activation of an app update. The page includes basic no-JavaScript instructions.

Chrome's native prompt remains user-initiated. Dismissal or failure opens the instructions instead of leaving the user stranded. The site cannot invoke Safari's Share/Add to Home Screen or Add to Dock interfaces automatically. The Google app route explains opening the same site in Safari/Chrome, with a public canonical copy link and manual-copy fallback when clipboard access is unavailable. No browser deep links, forced redirects, app-store claims, new permissions or paid services were introduced.

Installation does not create account sync or move records between browser storage spaces. The guide includes a disclosure for existing records and retains the offline-readiness check. Passphrases, private records, query strings and demo flags are never included in the copied URL. Numbered visual markers are hidden from assistive technology to avoid duplicated spoken list numbers. Form controls remain 16px to avoid introducing input-focus zoom on phones.

Validation: `node render-beta/build.mjs && node render-beta/test.mjs`, including `tests/install-guide.mjs`. Coverage includes iPhone/iPad desktop-style detection, Safari/Mac, Chrome mobile/desktop, Google/in-app routing, manual platform switching, clipboard failure, already-installed state and native prompt outcomes without record changes. Browser review confirmed desktop and 390px phone layouts, copy feedback, no horizontal overflow and scrolling within the modal. Physical phone installation remains a separate acceptance task; browser simulation does not prove installation on every device/version.

The browser review also loaded the direct page alongside an older cached shell. Two offline-update downloads in the existing production browser did not complete; the app preserved its previous shell and records. Do not claim that existing installed copies have all updated merely because deployment is live. Published-file verification, direct-page access and installed-shell update acceptance are separate checks.

Instructions checked against official Apple and Google guidance:

- https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios
- https://support.apple.com/en-us/104996
- https://support.google.com/chrome/answer/9658361 (Android, desktop and iOS variants)
