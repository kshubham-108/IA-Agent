# Numbered prototype form (e.g. Websafe 2026.03)

Section-numbered Vision Cards using §1.x / §2.x headings instead of named table bands.

## Section map

| Section | Typical content | Extract fields |
|---|---|---|
| §1.1 SMART outcome grid | Strategic outcome, metrics | `future_vision`, `problem_opportunity`, POPIT customer/comp hints |
| §1.2 Value case | Benefits, budget ref | `budget_ref`, beneficiaries |
| §2.1 Channels & systems | Web/app/contact platforms | `channels_processes_systems`, Technology evidence |
| §2.2 Process impact | Ops/process change | People/Process evidence |
| §2.3 Journeys | Journey counts, workflows | `journey_counts`, Complexity evidence |
| §3 Heatmap | Inline or attached POPIT | `heatmap`, CIF/CDF notes |

## Extraction rules

- Detect format by § numbering (`§1.1`, `§1.2`, …) or "SMART outcome grid" heading.
- Map numbered sections to the same manifest field ids as the 2026.xx prototype (cross-skill compatibility).
- SMART grids often compress multiple POPIT signals into one row — split into separate `popitEvidence` entries with shared `evidence_span` prefixes (`§1.1 …`).
- Never emit numeric scores from extraction; quote the grid cell text.

## POPIT guidance

Websafe-class cards often score high **Technology** (broad digital estate) with moderate **Customer** and **People/Process** — but always derive scores from extracted evidence via `score_ba`, not assumptions from format alone.

When §3 heatmap is inline (not attached), status=`found` with the summary text; when absent, status=`missing` and call `gap_report`.
