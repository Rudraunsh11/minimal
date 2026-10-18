# Rewards and training update

## What changed

- Rewards: current/best streak, XP and levels, a seven-day activity strip, monthly challenges, and a badge shelf.
- Challenges: 100 completed tasks, 20 Academic tasks, learning on 10 days, training on 8 days, and 100,000 manually recorded steps during the current month.
- Task categories: Personal, Academic, Work, Physical. New completions count on the actual completion date; older completed tasks fall back to their assigned date.
- Learning journal: record a topic, date and minutes, and edit the entry later.
- Steps: save a daily total. Updating a day replaces the earlier total rather than adding it again. Phone/watch integration is not connected.
- Training: start/resume a session, search suggestions or enter a custom exercise, log each set separately, mark completed sets, use a rest timer, finish the session, review history, save a routine and start it again. Only completed sets enter history and rewards. Drafts persist on this browser. Previous exercise performance is shown for reference, not as a prescription.
- Notes: drafts survive closing the editor or refreshing. Save publishes the draft to your note collection.
- Recipes: searchable ingredients replace the huge dropdown.
- Nutrition: calories/macros remain visible; optional micronutrients expand on demand. Saving a label food leads directly into logging a portion.

## Reward rules

10 XP per completed task; 5 XP per checked habit per day; 15 XP per learning day; 25 XP per training day; 5 XP per day with recorded steps. Levels increase every 100 XP. Checking the same record repeatedly does not add extra XP. All rewards are derived from current saved records, so edits/deletions can change XP and badges. Monthly challenge badges restart with the new month. A current streak can end yesterday while today is unfinished. Future entries do not count. Food amounts and calorie targets do not earn points. Rewards have no monetary value.

## Verification

Pure-logic tests: completion-date attribution, repeated task toggles, study-day deduplication, streak grace/missed-day boundaries, month rollover, duplicate daily-step rejection, invalid dates and sets, draft exclusion from rewards, finished-session day counts and exact training volume.

Browser checks using practice data: start workout, enter differing set values, refresh/resume, finish only checked sets, 590 kg expected volume, save/restart routine with checkboxes reset, previous-performance reference, reward calculation, learning save, replace daily step total, note draft recovery. Existing food functionality is preserved. This is a scoped verification, not a claim that every possible interaction or physical device has been tested.

## Still required before a public launch

1. Account-based cloud storage with per-user authorization, automatic sync, conflict handling and recovery. Current records still live in this browser; optional exports remain advisable until cloud saving is built.
2. Public onboarding and sign-in separate from this owner-private hosted preview.
3. Reliable closed-app reminders and actual phone/watch integrations.
4. Broader food coverage, editable saved foods/recipes, and more accessible/complete recovery flows.
5. Device testing, privacy disclosures, account/data deletion, monitoring, and a release process.

No cloud saving, native iOS app or App Store submission is included in this update. No paid services were enabled.
