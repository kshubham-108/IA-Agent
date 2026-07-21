# Numbered prototype form (e.g. Websafe)

Section-numbered Vision Cards using numbered section headings instead of named table bands.

## Section map

| Section | Typical content | Extract fields |
|---|---|---|
| SMART outcome grid | Strategic outcome, metrics | `future_vision`, `problem_opportunity`, POPIT customer/comp hints |
| Value case | Benefits, budget ref | `budget_ref`, beneficiaries |
| Channels & systems | Web/app/contact platforms | `channels_processes_systems`, Technology evidence |
| Process impact | Ops/process change | People/Process evidence |
| Journeys | Journey counts, workflows | `journey_counts`, Complexity evidence |
| Heatmap | Inline or attached POPIT | `heatmap`, CIF/CDF notes |

## Extraction rules

- Detect format by numbered section headings or "SMART outcome grid" heading.
- Map numbered sections to the same manifest field ids as the prototype format (cross-skill compatibility).
- SMART grids often compress multiple POPIT signals into one row — split into separate `popitEvidence` entries with shared `evidence_span` prefixes.
- Never emit numeric scores from extraction; quote the grid cell text.

## POPIT guidance

Websafe-class cards often score high **Technology** (broad digital estate) with moderate **Customer** and **People/Process** — but always derive scores from extracted evidence via `score_ba`, not assumptions from format alone.

When heatmap is inline (not attached), status=`found` with the summary text; when absent, status=`missing` and call `gap_report`.
