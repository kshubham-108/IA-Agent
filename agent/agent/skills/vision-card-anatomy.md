# Vision Card anatomy

Three format variants the extractor must handle:

1. **Prototype Vision Card 2026.xx** (dominant): structured Q&A tables — Idea Tracking → Stakeholders → Context → Outcome → sizing sections.
2. **Numbered prototype form** (e.g. Websafe 2026.03): §1.1 SMART outcome grid, §1.2 value case, etc.
3. **Lean Vision Card** (e.g. SbD phase 2, Fixed RTE): minimal; frequently missing heatmap/scope — stress case for gap detection.

Extract per POPIT dimension with evidence spans. Never emit numeric estimates from extraction.
