# Minimal

A calm space to plan your day, track your health, and organize your life.

## Run it

Keep `index.html` and `foods.js` in the same folder. Open `index.html` in Safari or Chrome. For a stable local website address, run `python3 -m http.server 8000` from that folder, then visit http://localhost:8000.

The hosted private version has its own browser storage. Use Settings → Export backup on the old address, then Settings → Restore on the new address to move records. Browsers do not automatically share records across addresses or devices.

## Included

- Today dashboard with a selectable date.
- Quick Add from every screen: search foods, repeat recent portions, or enter known calorie/macro totals for the complete entry. Missing nutrients remain unknown.
- Beginner hints (on by default), an eight-step guided tour, and an isolated practice demo at `?demo=1`.
- Read START-HERE.md for a complete first-use walkthrough.
- Tasks with priorities, dates, editable checklists, completion, and deletion.
- Month calendar with editable events and in-app start reminders.
- Searchable notes with explicit Save and Cancel.
- Daily habits and water logging, adjustable water goal, undo last drink.
- Food search across 8,156 USDA records, source links, gram portions, reference portion weights, and calculations for calories, macros, fibre, sugar, sodium, calcium, iron, potassium, magnesium, and vitamins A (RAE), C, D, and B12.
- Packaged-food barcode number lookup through Open Food Facts; reference unit must be confirmed against the package. Camera scanning is not included.
- Custom label foods with configurable label amount and g/ml basis.
- Recipes from ingredient weights and final cooked edible yield.
- Meal grouping, editable portions, optional calorie/macro targets.
- Exercise logs with sets, repetitions, external weight, notes, and weekly set counts.
- JSON backup export/import with validation and replacement confirmation.
- Migration from the earlier task and quick-note prototype on the same browser origin.

## Nutrition calculations

A food is stored as nutrient values per 100 g or 100 ml. Logged nutrients = reference nutrient × amount eaten ÷ 100. Millilitres are not silently converted to grams. Use weighed portions for USDA records, including liquid foods whose reference basis is mass.

Reference portions use USDA gram weights. They are estimates of household measures, not a substitute for weighing your actual portion. Match raw versus cooked and the exact product/preparation.

Recipe nutrients = sum of ingredient nutrients × 100 ÷ final edible recipe weight. Cooking nutrient losses and discarded liquid are not modeled. A recipe nutrient is unknown if any ingredient lacks it.

Daily totals sum known values and show data coverage. Missing nutrients remain null (unknown), not zero. Precision is retained in calculations; rounding is for display. Reported source energy is used rather than forcing 4/4/9 macro arithmetic. Open Food Facts kJ-only energy is converted using 4.184 kJ per kcal. Vitamin A IU is not converted to RAE without composition data.

No claim is made that these estimates are more accurate than Tracked or laboratory measurements. Food variation, label rounding, recipe yield, database errors, and portion measurement affect accuracy.

## Data sources and licensing

USDA FoodData Central: SR Legacy April 2018 (7,793 records) and Foundation April 2026 (363 records). Data are public domain/CC0. Each record links to its FDC source. SR Legacy is historical, and similarly named Foundation records remain separate rather than overwriting their provenance.

- https://fdc.nal.usda.gov/download-datasets/
- https://fdc.nal.usda.gov/api-guide/

Open Food Facts: on-demand barcode lookup, community-contributed data under ODbL. Check against the label. Requests send barcode digits to Open Food Facts; no notes, tasks, or meal history are sent. Saved Open Food Facts records retain attribution. Respect Open Food Facts licensing if redistributing database-derived records.

- https://world.openfoodfacts.org/
- https://world.openfoodfacts.org/data

No private API keys are included. USDA search uses a bundled data snapshot rather than a metered API. Barcode lookup requires internet and may be unavailable or rate-limited.

## Privacy and limits

Records are saved in localStorage on the current browser/device/origin. GitHub stores code, not your logs. Browser storage can be cleared and private-browsing storage is temporary. Export backups regularly; backups contain your personal data.

This is a personal-use first release, not a full multi-user production platform. Not connected: cross-device accounts, cloud database, background push/email reminders, external calendar sync, wearable health sync, AI meal photos, voice logging, coaching, payments, or a custom minimal.com domain. Reminders work only while the app is open and browser timers are running. No paid service was configured.

## Verification

Browser tests cover legacy migration; task/checklist edits; cancel; plain-text note rendering and search; event time validation; water and undo; habits; nutrition portion scaling; missing-data propagation; label normalization; recipe yield; goals; workout logs; reload persistence; backup round-trip; mobile overflow; and storage failure messages.

## Project files

- `index.html`: interface, styling, calculations, and browser storage.
- `foods.js`: compact USDA food snapshot with nutrient values and reference portions.
- `README.md`: setup, calculations, sources, and limitations.
