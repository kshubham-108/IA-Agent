# Prototype Vision Card 2026.xx

Dominant corpus format: structured Q&A tables.

## Section map

| Section | Extract fields | POPIT signal |
|---|---|---|
| Idea Tracking | `title`, `tracking_id`, `budget_ref`, `funding_division`, `demand_forum`, `ic_date`, `dependencies`, `nda` | Complexity (dependencies), CIF/CDF hints |
| Stakeholders | `proposer`, `sponsor`, `finance_bp` | People/Process (governance depth) |
| Context | `products_in_scope`, `channels_processes_systems`, `current_state`, `problem_opportunity` | Customer, Technology, Complexity |
| Outcome | `future_vision`, `delta`, `beneficiaries`, `exclusions`, journeys/workflows | Customer, People/Process, Complexity |
| Sizing sections | journey counts, heatmap references, non-functional needs | All POPIT dimensions |

## Extraction rules

- Return **text evidence only** — never emit numeric POPIT scores, PU, or £ from extraction.
- Prefer `found` when the card states a value verbatim; use `inferred` only when clearly implied by adjacent rows.
- Mark `missing` when a manifest field has no section or says TBC/blank.
- Mark `contradictory` when two sections disagree (e.g. scope in Context vs exclusions in Outcome).
- Capture `evidence_span` as a short verbatim quote (≤120 chars) pointing to the table row.

## POPIT guidance

- **Customer:** who is affected, segments, beneficiaries, regulatory/customer risk language.
- **People/Process:** operating model change, agent counts, training, process re-design depth.
- **Technology:** systems/channels in scope, integration count, platform replacement vs config.
- **Complexity:** journey/workflow counts, cross-domain dependencies, cutover risk.
- **CIF/CDF:** accelerators and decelerators called out in card or heatmap footnotes — pass to `score_ba`, do not sum inline.

After extraction, call `score_ba` with integer dimension scores derived from evidence — never from extraction schema fields.
