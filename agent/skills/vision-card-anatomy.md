# Vision Card anatomy

Three format variants the extractor must handle — load the dedicated skill for each:

1. **`prototype-vision-card-2026`** — structured Q&A tables (dominant).
2. **`numbered-prototype-form`** — §1.x sectioned forms (e.g. Websafe §1.1 SMART grid).
3. **`lean-vision-card`** — minimal cards (SbD phase 2, Fixed RTE); stress case for gap detection.

Extract per POPIT dimension with evidence spans. Never emit numeric estimates from extraction.
