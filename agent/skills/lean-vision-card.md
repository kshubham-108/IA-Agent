# Lean Vision Card (SbD phase 2, Fixed RTE)

Minimal Vision Cards — frequently missing heatmap, journey counts, stakeholders, budget, dependencies. **Stress case for gap detection.**

## Typical gaps (expect `missing` status)

- Empty stakeholder rows → `sponsor`, `proposer` missing
- Budget reference TBC → `budget_ref` missing
- No dependencies section → `dependencies` missing
- No journey/workflow counts → `journey_counts` missing
- No POPIT heatmap → `heatmap` missing

## Extraction rules

- Do **not** infer missing fields from title alone.
- Lean cards may only have title + one outcome paragraph — extract what is present; flag the rest.
- Use `inferred` sparingly for POPIT evidence when the card implies but does not state (e.g. "Pega migration" → technology evidence `found`, customer evidence often `inferred` or `missing`).
- Thin cards correlate with lower BA scores — but scoring still goes through `score_ba` after gap-check.

## Correct behaviour (§5b eval targets)

When journey counts or heatmap are absent:

1. Set field status to `missing` (not `found`, not silent omission).
2. Call `gap_report` with manifest `iia-seed-funding`.
3. Call `confidence_band` with reduced manifest coverage to widen the band.
4. Never guess dimension scores to compensate for missing scope data.

Pega Cloud is the reference lean pair: empty stakeholders, TBC budget, no dependencies → score 2 / Low / 16.4 PU @2026 when scored via engine.
