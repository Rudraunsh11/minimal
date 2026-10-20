# Minimal: food, exercise and artwork sources

## Exercise catalogue

The 876 imported exercise entries come from [Free Exercise DB, maintained by yuhonas and contributors](https://github.com/yuhonas/free-exercise-db), based on the original exercises.json project by Ollie Jennings. The upstream [Unlicense](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md) dedicates the dataset to the public domain. A copy is bundled in EXERCISE-LICENSE.md.

Minimal includes names, muscle/equipment classifications and movement notes. It normalizes equipment names, derives a default logging mode and lets the user choose repetitions or time. No Hevy artwork, descriptions, videos, account data or proprietary database was imported. The overlap is in commonly named movements, not a verified reproduction of Hevy's current catalogue. This is not an endorsement by Hevy or the dataset authors.

## USDA FoodData Central

The existing 8,156 USDA reference foods retain individual FDC identifiers and links. USDA FoodData Central data is public-domain/CC0. See [USDA documentation](https://fdc.nal.usda.gov/data-documentation.html). Keep the original preparation and basis (per 100 g) when interpreting records. Generic ingredient references are not measurements of every Indian cultivar or household dish.

## Indian dish index and recipe templates

Minimal's original discovery index has 255 names tagged across 28 states, 8 union territories and everyday favourites. Tags indicate familiarity/discovery, not exclusive origin, cultural authenticity or population-wide dietary frequency. It is not an exhaustive catalogue of Indian cuisine.

The original dish index contains 58 ingredient blueprints. The simple food logger precomputes ready-to-log nutrition profiles only when every ingredient resolves and all four core nutrition fields are known. It sums source ingredient nutrients and divides by a fixed example cooked yield. These fixed profiles use SR Legacy sunflower oil (FDC 171025, linoleic approximately 65%) instead of the nutrition-empty Foundation oil record 1750349. Users choose a suggested serving and adjust quantity; no recipe preparation or calorie entry is required. Unsupported names are excluded from ready-to-log results rather than assigned fabricated numbers.

These profiles are labelled **estimates**. They are original example recipes, not measured IFCT/INDB records, MyFitnessPal entries, or a guarantee of a household's preparation. Suggested idli, roti, bowl and other serving weights are app references with explicit gram weights, not universal standards. Cooking losses, oil absorption, fermentation and discarded liquid are not modelled. Unknown micronutrients stay unknown. Users may select grams for a weighed portion; nutrient references remain unrounded when saved.

MyFitnessPal data is not imported. Its developer portal requires contacting the provider for API integration; no API access or redistribution permission has been supplied. See [MyFitnessPal developer portal](https://www.myfitnesspal.com/apps/api/documents) and [Terms](https://www.myfitnesspal.com/terms-of-service).

The Indian discovery index, recipe blueprints and geometric artwork were created for this project. No new public license is granted for Minimal's original code or creative work by this source-attribution document. USDA source facts remain public domain, and the exercise dataset keeps its upstream Unlicense.

Regional background references, not imported nutrition datasets: [Incredible India](https://www.incredibleindia.gov.in/), [ICMR–NIN](https://www.nin.res.in/) and the [Indian Nutrient Databank project](https://www.anuvaad.org.in/indian-diet-data/).

IFCT 2017, INDB and other third-party Indian recipe databases are not bundled. Open access is not treated here as proof of an unrestricted redistribution license. The Sangat repository was reviewed but not imported; its claim that IFCT is public domain was not treated as sufficient provenance for redistribution.

## Open Food Facts

Barcode lookups use [Open Food Facts](https://world.openfoodfacts.org/data), whose database is licensed under the Open Database License (ODbL). Individual source links accompany saved barcode records. Product data is community-contributed and should be checked against the package. The app does not bundle product images. Only a barcode is sent for lookup; the user's food log is not sent.

## Artwork and motion

The mandala SVG is an original geometric vector asset created for Minimal. No third-party mandala artwork or Apple visual assets were copied. It is decorative, not a health metric or control. The existing botanical wordmark is an AI-generated asset based on the owner's supplied reference.

Motion design reference: [Apple's iPhone page](https://www.apple.com/iphone/), [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/motion), and [WebKit: Responsive Design for Motion](https://webkit.org/blog/7551/responsive-design-for-motion/). Minimal uses its own implementation. Effects respect reduced-motion preferences; matching Apple's entire device-tested experience is not claimed.

## Individual Indian ingredients and labelled products

Common Indian ingredient names are search aliases for the original USDA food description; the selected result still identifies raw/cooked preparation. We do not equate paneer with generic Western cottage cheese. Two specifically named Amul products include a small set of factual nutrient values from the producer's published tables, checked on 18 October 2026: [Dudhsagar Dairy: Amul Fresh Paneer](https://dudhsagardairy.coop/dairy/products/amul-fresh-paneer/) (per 100 g) and [Amul Taaza](https://dudhsagardairy.coop/dairy/products/amul-taaza/) (per 100 ml). These are product-specific manufacturer estimates; recipes and packs may vary. No product image, marketing text or wholesale proprietary database is imported, and no endorsement or open license over the producer's content is claimed. App glass/serving weights are explicitly displayed references. Manufacturer data gaps remain unknown.

## Snacks, chocolates and ready-made foods

The Snacks & ready-made browser reuses selected USDA source records, retaining their FDC IDs and links; US branded references remain explicitly labelled US. It also contains small sets of factual product nutrition values from [MAGGI Masala](https://www.maggi.in/en/product/maggi-2-minute-noodles-masala/), [MAGGI Special Masala](https://www.maggi.in/en/product/maggi-2-minute-special-masala-instant-noodles/), [Haldiram's international product table](https://international.haldiram.com/namkeen-and-savories/namkeens), and [Cadbury Dairy Milk UK 110 g](https://www.cadburygiftsdirect.co.uk/cadbury-dairy-milk-110g.html), checked 18 October 2026. Haldiram's facts are per 35 g manufacturer serving and are normalized to 100 g without intermediate rounding. Cadbury energy is converted from kJ using 4.184 kJ per kcal; that UK recipe is not represented as the Indian product. Noodle serving weights refer to the dry product, not the water added during cooking. No images, marketing copy or wholesale proprietary database are imported; no brand endorsement or open license over manufacturer content is claimed. Pack labels can change. Missing products may use the existing Open Food Facts barcode lookup. Public Open Food Facts search was unavailable during this update; no search dataset was imported.

## Regional food expansion — 20 October 2026

The discovery index now contains 273 distinct names. 194 have ready-to-log estimates, with at least eight available in every one of the 28 states and eight union territories. Unresolved names remain visible with no calorie or macro claim. This is not an exhaustive inventory of any region.

New formulations are original fixed edible-ingredient weights and cooked-yield assumptions. Ingredient facts come from the bundled USDA FoodData Central records, with the already disclosed product-specific paneer manufacturer reference where explicitly named. Every logged estimate retains its source ingredient IDs, names, grams and batch yield. The source disclosure shows these facts. No Indian Food Composition Tables, MyFitnessPal, Tracked or proprietary recipe database was copied.

These are mathematical reference estimates, not laboratory analysis, diet prescriptions or measured values for the user's food. Household water, oil, cuts, preparation and brands change nutrition. No heat-retention, fermentation or oil-absorption model is claimed. Missing nutrients remain unknown; invalid negative source values are excluded rather than silently clamped. An unavailable local grain or fermented ingredient is not replaced with a different food and presented as exact.

Regional tags are discovery aids, not claims of exclusive origin. Cultural context was checked against official tourism examples: [Nagaland food guide](https://www.incredibleindia.gov.in/en/nagaland/kohima/food-guide-traditional-naga-dishes), [Arunachal Pradesh cuisine](https://www.incredibleindia.gov.in/en/arunachal-pradesh/itanagar/a-culinary-journey-through-itanagar-and-arunachal-pradesh), and [Tripura food guide](https://www.incredibleindia.gov.in/en/tripura/agartala/savour-the-flavours). Only factual context was consulted, not article text or imagery reproduced. [USDA FAQ](https://fdc.nal.usda.gov/faq/) explains source types and variability. These links do not validate the app's chosen recipes or yields.
