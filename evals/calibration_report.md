# Calibration Report

Generated: 2026-07-21T15:12:02.062Z

## Backtest (Wall of Reference @ £425.52)

| Metric | Value | Target | Status |
|---|---:|---|:---:|
| MAPE | 8.96% | — | — |
| Bias | 4.50% | — | — |
| Leave-one-out band coverage | 92.00% | ≥90% | PASS |
| Anchor IA band coverage (±15%) | 76.00% | — | — |
| Fitted LOO half-width | ±24.05% (q=0.94) | — | — |

Excluded from calibration (2 explained outliers): data-ncc-phase-4, data-helix-datalake.

Evaluated rows: 25 (engine `applyPur` @ 2025 PUR).

### Sample row results (first 10)

| Project id | Engine £ | Actual £ | Relative error | LOO covered |
|---|---:|---:|---:|:---:|
| data-ccs-phase-2 | £515,160.91 | £517,970.4 | 0.55% | PASS |
| data-ofcom-net-act | £12,777.85 | £13,616.2 | 6.56% | PASS |
| data-helix-cmdb | £58,071.12 | £60,675.11 | 4.48% | PASS |
| data-edh-fdp-dq | £73,460.92 | £74,418 | 1.30% | PASS |
| data-ace-landing-pad | £1,997,093.31 | £2,041,594.98 | 2.23% | PASS |
| data-cpe-inventory | £86,329.18 | £83,774.33 | -2.96% | PASS |
| data-losing-provider | £83,626.02 | £79,053.11 | -5.47% | PASS |
| data-bulk-diagnostic | £45,527.58 | £46,470.99 | 2.07% | PASS |
| data-picasso | £48,123.76 | £48,837.98 | 1.48% | PASS |
| data-augustus-bill-ops | £12,880.62 | £13,703.04 | 6.38% | PASS |

## Extraction eval (§5b labelled pairs)

| Metric | Value | Target | Status |
|---|---:|---|:---:|
| Aggregate field accuracy | 100.00% | ≥95% | PASS |
| POPIT tolerance | 4/4 pairs | ≥3/4 pairs with POPIT ±1 on ≥3 dimensions | PASS |
| Band correctness | 4/4 | 4/4 band correct | PASS |

| Pair | Field accuracy | POPIT ±1 dims | Band | PU | Gap flags |
|---|---:|---:|:---:|:---:|:---:|
| ofr | 100.00% | 4/4 | PASS | PASS | PASS |
| websafe | 100.00% | 4/4 | PASS | PASS | PASS |
| verint | 100.00% | 4/4 | PASS | PASS | PASS |
| pega | 100.00% | 4/4 | PASS | PASS | PASS |

## Manifest coverage distribution (unlabelled sample)

Seed: 42; sample size: 10.

| Stat | Value |
|---|---:|
| Mean coverage | 59.3% |
| Min | 46.7% |
| Max | 66.7% |

Buckets: 0.5-0.74=9, 0.0-0.49=1

Confidence slider seed (mean manifest coverage): **0.593**

| Vision card | Format | Coverage | Gaps |
|---|---|---:|---:|
| Vision_Card_Template 2026.03 giffgaff 5GSA.docx | prototype-2026 | 60.0% | 6 |
| 1Global Additional MVNO Onboarding - VMO2 Vision Document v2.1.docx | unknown | 60.0% | 6 |
| Vision Card - Straegic ARP v1.docx | unknown | 60.0% | 6 |
| Vision_Card_Template_ Sky Cinema and Disney+ (Kahlo_Glass Slipper).docx | unknown | 60.0% | 6 |
| Vision Document HLR-UDB.docx | unknown | 60.0% | 6 |
| Vision_Card_Template 2026.03 5GSA SIM Swap reliability.docx | prototype-2026 | 60.0% | 6 |
| Vision_Card_SharePoint_Migration.docx | unknown | 66.7% | 5 |
| Vision_Card_Template 2026.04 Scotty Unoptimised Devices revised version june 26.docx | prototype-2026 | 60.0% | 6 |
| Vision Document Vodafone decom v2.1.docx | unknown | 46.7% | 8 |
| O2 Daisy Data Extraction for Telephony Vision card_.docx | unknown | 60.0% | 6 |

## Provenance

- `applyPur`: 25 rows @ PUR £425.52 (2025)
- `backtest.mape`: Mean absolute percentage error vs VMO2 actuals → 8.962156074924502
- `backtest.bias`: Signed mean relative error (estimate vs actual) → 4.501892899918028
- `backtest.loo_band`: Leave-one-out symmetric band @ q=0.9400000000000001 abs relative error → 92
- `confidence.ia`: Anchor ±15% band @ manifestCoverage=1 → 76
- `extraction.labelled_pairs`: 4 §5b fixture extracts vs iia-seed-funding manifest → 100
- `scoreBa`: Engine POPIT/band checks on expected dimensions
- `gap_report`: 10 unlabelled cards @ seed 42
