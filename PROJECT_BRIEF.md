# CURSOR KICKOFF PACK v3 — VMO2/TCS Impact Assessment Estimation Agent
*(Supersedes v2. Save as `PROJECT_BRIEF.md` in the repo root. Every Cursor session starts by reading this file. Changes from v2: Eve runtime architecture (§6), five new BA golden cases (§3D), four labelled Vision-Card↔score eval pairs (§5b), updated agent prompts (§7).)*

---

## 0. Mission (unchanged)

- **Flow A — IIA / Seed Funding (pre-HLD):** Vision Card (+ heatmap) + IIA templates in → seed funding (SA+BA PU→£→duration to DoR), whole-project ballpark, computed confidence band, gap report of missing/ambiguous fields.
- **Flow B — IA (post-HLD):** detailed requirements + impacted areas + HLD in → deterministic line-item PU build-up × PUR(year), sign-off grade, every line traceable to a rule and an evidence span.
- **Year toggle:** PUR is config (§2), default 2026 = £362.

## 1. Non-negotiable design rules (unchanged, now Eve-enforced)

1. **The LLM never does arithmetic.** In the Eve runtime this is enforced structurally: the ONLY path to any number is calling an engine tool in `tools/`. No schema anywhere lets the model emit a PU or £ figure directly.
2. **Overlay vectors / complexity tables / management overlays are per-template YAML config, never assumed** (RetainX vs O2T vs DFE-default proof stands: guessed vector → 4,249.18 vs true 4,162.86).
3. **1 PU = 1 blended person-day; 5 PU = 1 person-week.**
4. **Golden tests are law** — engine ships only when §3 passes exactly.
5. **Confidence is computed** from manifest coverage × empirical variance (§4).
6. **Provenance on every figure** (rule id + evidence span).
7. **Engine stays framework-agnostic.** Pure TypeScript package `packages/engine` with its own vitest suite; Eve tools are thin wrappers. If Eve (a brand-new framework) churns, nothing golden breaks. Pin all versions.

## 2. Contractual rates — `rules/rates.yaml` (unchanged)

```yaml
tcs_consumer_data: {2025: 425.52, 2026: 362, 2027: 239, 2028: 184, 2029: 159, 2030: 146, 2031: 143}
techm_reference_pur_2025: 394.04
historical: {consolidated_calculator_v0_4: 414, payg_estimates: 450, lot_consumer: 419.32, lot_data: 525.00}
# Superseded planning figures (591.42 / 424 / 510 / 428 / 414-by-lot): never use for new estimates.
```
Open item: BA Allocation PU values shrink by year (295.2 → 277.2 → 259.2) — confirm with mentor whether effort quantities reduce annually or only the rate. Engine supports both via config.

## 3. Golden test suite — write FIRST, never edit expectations to pass

**A. Cost reproduction @ £425.52 (27 Wall-of-Reference rows, exact to 2 d.p.)** — unchanged from v2: MyO2 3,018.75→£1,284,538.50 (actual £1,376,000, −6.65%); RetainX 4,162.86→£1,771,380.19 (−7.22%); PayG Transf 3,253→£1,384,216.56 (−15.82%); PayG Comms 1,836→£781,254.72 (−18.31%); BSS 1,462→£622,110.24 (+8.45%); O2.co.uk 16,192.5→£6,890,232.60 (−1.01%); O2 Marketing 11,924→£5,073,900.48 (−3.63%); small-change pack {APIGee 6, 10-pages 18, Affirm 19, 360→DFE 15, Recycle 22} = 80 PU→£34,041.60 (−15.95%); + all 15 Data-lot rows (ACE 4,693.30; EDH>GCP 9,792.84; Netpulse 9,504; NCC Ph4 556.42 and Helix Datalake 492.06 kept as regression tests but excluded from calibration stats — variance explained by Infosys delivery / escalation discounts).

**B. Template arithmetic (unchanged):** RetainX 1,328 → vector {.25,.0,.25,1.0,.10,.25,.25,.05×6} +15 = 3,202.2 → ×{PM .15, Warranty .05, Cont .10} = **4,162.86 = 832.572 pw**. O2T 4,400 (itemised: 250 dyn screens 2,300; 50 CMS 250; 175 APIGEE ops 525; 25 MSA 250; 4 SDK 40; 10 reports 50; tagging 500; test data 100; other 30; Bazaar 135; 3rd-party 100; catalogue 120) → {.30,.25,1.0,.10,.25,.25,.05×5} +15 = 10,795 → ×{.25,.20,.05} = **16,192.5 = 3,238.5 pw**. DFE default base×2.30×1.35 (28→86.94). Complexity: New {3,5,8,12} / Enh {0.75,2.5,6,12}, reuse-% pro-rata. Data ETL matrix (High/RealTime/VC=56 … Low/Batch/VS=2), accelerators (CIF −27%, GCS −32%…), storage {1,2,3,5,8} with PII/framework multipliers. MW matrix {New,Modify,Reuse,Onboard}×{Apigee,MSA,Fusion}×{S,M,C}. 360 AD T-shirt {XS 13, S 25, M 49, L 97, XL 218}. Data milestone split {Design 40%, Build&UT 60%, ST-support 10%, OAT+Deploy 5%, Warranty 8% opex, Addl PS 1%}.

**C. Seed-funding golden case (unchanged):** OFR — BA 20→VH→295.2 PU (2026 col) + SA 139→VH→2×16.1wk = 161 PU pre-DoR ⇒ **456.2 PU** = £194,122.22 @2025 / **£165,144.40 @2026** / £109,031.80 @2027. Duration = max(BA 20+wk, SA 16.1wk) elapsed, derived not fixed. Open scope question (456.2 vs Vision Card's 160-day discovery plan) stays behind a flag.

**D. NEW — five BA calculator golden cases (from `BA_IIA_Analysis_Template.xlsx` → `Examples` tab, verified):**
| Case | Cust | P/P | Tech | Comp | CIF | CDF | Total | Band | PU (2026) | Effort | Duration |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Verint to AWS Migration | 1 | 1 | 3 | 1 | +1 | −2 | **5** | Medium | **49.20** | 100% BA | 10 wks |
| Offline Fixed Retentions | 4 | 5 | 4 | 3 | +4 | 0 | **20** | Very High | **295.20** | 300% BA | 20+ wks |
| PEGA Migration | 0 | 2 | 1 | 2 | +1 | −4 | **2** | Low | **16.40** | 50% BA | 6.5 wks |
| Woody RAF Migration | 0 | 2 | 3 | 1 | +1 | −7 | **0** | Very Low | **0** | 0% BA | 0 wks |
| Websafe Strategic | 2 | 2 | 5 | 3 | +2 | −2 | **12** | Medium High | **65.60** | 100% BA | 13 wks |

Tests: (i) score summation incl. negative floor behaviour (Woody: 7 raw → clamps to 0); (ii) band lookup {0–1 VL, 2–4 L, 5–8 M, 9–12 MH, 13–16 H, 17–20 VH}; (iii) PU per year column; (iv) duration lookup.

## 4. Confidence model (unchanged)
Anchors: full IA ±15% (P90 of calibrated variance); IIA+heatmap −30%/+50%; Vision-only −50%/+100%. Slide by manifest-coverage. Gap report ranks missing fields by estimate impact.

## 5. Gap detection & required-inputs manifests (unchanged mechanism)

## 5b. NEW — Vision Card corpus & labelled eval pairs

**Corpus:** 59 Vision Cards/Documents in `/mnt/project` (plus OFR v0.1 + Websafe + 2× giffgaff OCS as PDFs). Three format variants the extractor must handle:
1. **Prototype Vision Card 2026.xx** (dominant): structured Q&A tables — Idea Tracking (title, description, tracking ID, budget ref, funding division, demand forum, IC date, dependencies, NDA) → Stakeholders (proposer, sponsor, finance BP, optional roles) → Context (who affected, products/services in scope, channels/processes/systems, current state, problem/opportunity) → Outcome (future vision, delta, beneficiaries, exclusions, journeys/workflows…) → sizing-relevant sections.
2. **Numbered prototype form** (e.g. Websafe 2026.03): §1.1 SMART outcome grid, §1.2 value case, etc.
3. **Lean Vision Card** (e.g. SbD phase 2, Fixed RTE): minimal, frequently missing heatmap/scope sections — the stress case for gap detection.

**Labelled end-to-end pairs (Vision Card in corpus ↔ known BA outcome from §3D):**
| Vision Card file | Expected extract → score → PU |
|---|---|
| `Offline_Fixed_Retentions_Vision_Card_v1_0.docx` (+v0.1 pdf) | 4/5/4/3, CIF+4, CDF 0 → 20 → 295.2 |
| `20260515_Vision_Card_Websafe_Strategic_Ver1_2.pdf` | 2/2/5/3, +2, −2 → 12 → 65.6 |
| `Verint_Migration_to_Amazon_Connect_-_Vision_Card.docx` | 1/1/3/1, +1, −2 → 5 → 49.2 |
| `Pega_Cloud_Vision_Card_v1__1_.docx` | 0/2/1/2, +1, −4 → 2 → 16.4 |
(Woody RAF has no card in the project — request it; it's the zero-case.)
Observed and encouraging: card *thinness* tracks score (Pega: empty stakeholder rows, TBC budget, no dependencies → score 2; Verint: dense → 5; OFR: richest at 42KB → 20). Gap detection and scoring share signal.

**Eval targets:** extraction ≥95% field accuracy on the 4 pairs; POPIT dimension scores within ±1 on ≥3 of 4 dimensions per card; total score band correct on 4/4. Where a dimension can't be extracted (e.g. journey counts absent), correct behaviour is *flag as gap + widen band*, NOT guess — tests must assert flagging.

**Known-absent files to request** (visible on SharePoint screenshot, not in project): `My O2 Mobile App New Template v1.0`, `O2_Marketing_Transformation_Estimation_2.2 v.F`, both `P7 Baselining TCS Effort Estimates` pptx decks, Woody RAF Vision Card, and the filled SA templates per calibrated project.

## 6. Architecture — Eve runtime (CHANGED)

**Decision:** Build on **Eve** (Vercel's agent framework — vercel.com/eve, docs eve.dev), running on VMO2's Vercel enterprise plan, with **Claude as the model via Vercel AI Gateway**. Eve = the framework ("Next.js for agents": markdown instructions/skills, TypeScript tools, durable by default); AI Gateway = model routing; Claude = the extraction/classification brain. These are layers, not alternatives.

Why Eve fits this exact system: `tools/` in TypeScript with zod schemas is precisely where the deterministic engine surfaces (the model can only *call* calculators, closing Rule 1 structurally); `skills/` markdown holds the domain playbooks (template anatomies, manifest guidance) loaded when relevant; built-in **Evaluations** ("test suites with scoring rubrics, run on every deployment") hosts §3/§5b; **human-in-the-loop approval gates** implement the walkthrough→verbal→written sign-off states from `TCS_IA_Template__Approvers.xlsx`; **durable Workflows** checkpoint long document-processing runs; **channels** give web/API today and Teams later for VMO2 reviewers; Sandbox isolates any file parsing.

**Monorepo:**
```
ia-agent/
  PROJECT_BRIEF.md
  .cursor/rules/domain.mdc          # condensed §1–§5b
  packages/engine/                  # PURE deterministic calculators + provenance + vitest golden tests (§3)
  packages/rules/                   # YAML: rates, complexity tables, overlay vectors, manifests, matrices
  packages/extraction-schemas/      # zod: VisionCardExtract, HeatmapExtract, IaSpecExtract (no numeric estimate fields)
  agent/                            # Eve agent directory
    instructions.md                 #   role + Rule 1 verbatim + workflow (extract → gap-check → call tools → explain)
    agent.ts                        #   model: Claude via AI Gateway; runtime config
    skills/                         #   vision-card-anatomy.md, iia-scoring.md, ia-template-guide.md, gap-reporting.md
    tools/                          #   extract_vision_card.ts, score_ba.ts, score_sa.ts, estimate_dfe.ts, estimate_data.ts,
                                    #   estimate_mw.ts, estimate_360.ts, seed_funding.ts, apply_pur.ts, gap_report.ts,
                                    #   confidence_band.ts, wall_of_reference_neighbours.ts   (all thin wrappers over packages/engine)
    evals/                          #   golden + extraction-pair suites wired to Eve Evaluations
    channels/                       #   web + api (Teams later)
  apps/web/                         # Next.js UI: upload, IIA/IA flow, year toggle, line-item provenance, gap panel,
                                    # inline gap-answering that re-invokes the agent, eCare-shaped export
  corpus/                           # 59 vision cards, wall_of_reference.json, filled templates, labelled pairs
```

## 7. Parallel Cursor agents — updated prompts

**Session 0 (you, ~30 min):** `Read PROJECT_BRIEF.md. Create the monorepo per §6: pnpm workspaces, TypeScript strict, vitest. Run npx eve@latest init agent for the Eve directory; pin the generated eve version. Add .cursor/rules/domain.mdc condensing §1–§5b. Index https://eve.dev/docs in Cursor (@Docs → add eve.dev) so agents can consult the framework. Copy the 59 vision cards + Wall of Reference into corpus/. Commit "scaffold".`

**Agent 1 — Engine & rules (blocking; unchanged scope + §3D):**
`Read PROJECT_BRIEF.md §1–§3. Build packages/rules (every table as YAML) and packages/engine as pure functions with provenance: scoreBa, scoreSa, estimateDfe, estimateData, estimateMw, estimate360, seedFunding, applyPur, confidenceBand. Then evals: golden.test.ts asserting §3A costs to 2 d.p., §3B totals exactly, §3C seed for 2025/26/27, and §3D — all five BA example cases including Woody's clamp-to-zero. Never edit expected values; failures mean the engine is wrong. Deliver green vitest.`

**Agent 2 — Eve agent & extraction (parallel; REWRITTEN):**
`Read PROJECT_BRIEF.md §5, §5b, §6 and the eve docs (@Docs eve.dev). In agent/: write instructions.md (Rule 1 verbatim: every number must come from a tool call; if a manifest field is missing, call gap_report and widen the band — never infer silently); agent.ts pinning Claude via AI Gateway; skills/ for the three Vision Card format variants (§5b) with extraction guidance per POPIT dimension; tools/ as thin zod-validated wrappers over packages/engine (import, no logic) plus extract_vision_card.ts which returns per-field {value, evidence_span, confidence, status: found|inferred|missing|contradictory} and contains NO numeric estimate fields in its schema. Wire agent/evals to run the §5b labelled pairs: OFR→20/295.2, Websafe→12/65.6, Verint→5/49.2, Pega→2/16.4, asserting dimension scores ±1 and correct gap-flagging where fields are absent. Deliver: eve eval run output.`

**Agent 3 — Web app (parallel; minor change):**
`Read PROJECT_BRIEF.md §0, §4, §6. Build apps/web (Next.js 15): upload (pdf/docx/xlsx), IIA/IA flow selector, year toggle from rules/rates.yaml (default 2026 £362), results with headline PU/£/duration/band, expandable line items with rule-id + evidence-span provenance, gap panel with inline answers that re-invoke the agent via its API channel, eCare-deck-shaped export. Talk to the Eve agent through its api channel; mock behind an interface until Agents 1–2 land.`

**Agent 4 — Evals & calibration (after Agent 1 green; expanded):**
`Read PROJECT_BRIEF.md §3–§5b. Build corpus ingestion (corpus/wall_of_reference.json from the xlsx; parse all 59 vision cards to text + metadata), backtest.ts (MAPE/bias vs actuals excl. two explained outliers; band coverage ≥90% target; leave-one-out band fitting), and extraction-eval harness over the 4 labelled pairs + 10 randomly sampled unlabelled cards scored for manifest coverage distribution (this distribution seeds the confidence slider). Emit calibration_report.md on every run; register the suite with Eve Evaluations so it runs on deploy.`

## 8. Definition of done v0.1 (updated)
Engine golden green (incl. §3D) → Eve agent evals green on all 4 labelled pairs → backtest + coverage report generated → apps/web runs Flow A on the OFR Vision Card and Flow B on the RetainX pack with correct numbers, and degrading the OFR card (delete sections) visibly widens the band and grows the gap report.

# PROJECT BRIEF ADDENDUM v3.1 — Readiness Gate UI, Knowledge Architecture, Model Bake-off
*(Append to PROJECT_BRIEF.md. Extends v3; nothing in v3 §1–§5b changes. New sections §9–§12 and agent prompts 5–7. Current repo state: Agents 1, 4 done (55/55 golden, 8.96% MAPE, 92% LOO coverage); Agent 2 done pending live-model run; Agent 3 shell done; §8 live demo outstanding.)*

---

## §9. Readiness Gate — landing page spec (replaces Agent 3's upload screen)

**Layout.** Single centred prompt tab (Claude-style), positioned at or slightly below vertical centre. Inside the tab, before any upload, a greyed checklist renders as placeholder-weight text:

```
> Requirements — Vision Document
> Impact Areas — Solution Heatmap (optional)          ← italic
> High-Level Design (HLD) (optional)                  ← italic
```
Note the spelling: **HLD, High-Level Design** (not HDL). Bottom-left: a slightly-larger circular **plus** icon → file picker / drag-drop (pdf, docx, xlsx; multi-file). Bottom-right: the **agent submit icon**, slightly larger than standard, rendered at ~25% opacity while gated.

**Checklist item states.**
| State | Visual | Meaning |
|---|---|---|
| `pending` | grey, `>` prefix | nothing uploaded yet covers this need |
| `checking` | grey + inline spinner | Stage-1 classifier running on a just-uploaded file |
| `partial` | amber + warning icon + short reason | a relevant doc exists but key fields are missing (e.g. "Impact Areas — partial: app T-shirt sizes missing") |
| `satisfied` | green + check icon | need covered with evidence |
| `contradictory` | amber + reason | two docs disagree (rare; surfaces extractor `contradictory` status) |

**Gating rule.** Submit icon goes to full opacity (enabled) when **all mandatory items are `satisfied`**. Mandatory set is flow-aware and drives flow selection implicitly — the user never picks Flow A/B:
- Requirements `satisfied` only → Flow A (IIA), band −50%/+100%
- + Impact Areas `satisfied` → Flow A enriched, band −30%/+50%
- + HLD (and/or IA-template spec) `satisfied` → Flow B (IA), band ±15%

**Confidence chip.** Small pill between the icons showing the live expected band for the current checklist state, updating as items turn green. This is the Cone of Uncertainty surfaced pre-submit.

**Uploaded-file chips** render above the checklist (filename + type icon + remove). Removing a file re-evaluates the checklist. Keyboard accessible throughout; checklist lines are focusable with state announced (aria-live on state changes).

**Behavioural contract.** On each upload: call Stage-1 `classify_documents` (§10) per file, stream state transitions pending→checking→(satisfied|partial). On submit: run the full Flow A/B pipeline (existing Agent 2 path) and route to the results page (unchanged from v3 Agent 3 scope).

## §10. Two-stage pipeline (new tool + knowledge-architecture rules)

**Stage 1 — `classify_documents` (new tool).** Input: file text/bytes. Output per file: `{doc_type: vision_card|heatmap|hld|iia_ba_template|iia_sa_template|ia_spec|other, checklist_coverage: {requirements, impact_areas, hld} each {status, missing_fields[], evidence_span}, confidence}`. Runs on the **cheap model tier** (see §11). Fast (<5s/file target), no estimation, no numbers. Reuses the manifest definitions from packages/rules — do not duplicate them.

**Stage 2** — the existing extract → gap-report → engine-tools → explain flow, on the **quality model tier**. Unchanged.

**Knowledge-architecture rules (hard requirements — these answer the proprietary-data question):**
1. **Calibrated numbers never reach any model.** PU tables, PUR curve, complexity factors, overlay vectors, T-shirt matrices live ONLY in packages/rules + packages/engine. Audit `agent/skills/*` and `instructions.md` and strip any calibrated numeric values into rules; skills carry methodology and anatomy only.
2. **No fine-tuning.** Knowledge = skills (curated methodology, versioned in git) + tools (deterministic engine) + runtime retrieval (`wall_of_reference_neighbours` returns top-k rows only, never the whole corpus). Rates change → edit YAML, redeploy; nothing retrains.
3. **User uploads are transient**: sent per-request via AI Gateway, not persisted to any model. Corpus and rules live in the VMO2 repo/storage only.
4. Produce `SECURITY_DATAFLOW.md` (one page): diagram of what crosses the model boundary (user docs, instructions/skills, top-k Wall rows) vs what never does (all calibrated tables, PUR, engine); note that enterprise API terms for the chosen provider(s) must be confirmed by VMO2 as excluding training on inputs; state data residency options.

## §11. Model strategy — bake-off, then model-per-stage

Model choice is config (`agent.ts` via AI Gateway), affects extraction only — every golden number is model-invariant. Decide by measurement, not preference:
- **Candidates:** current Claude quality tier, current Gemini quality tier, plus the cheap/fast tier of each (four runs). Gateway strings resolved from live AI Gateway model list at run time — do not hard-code stale ids.
- **Tasks scored separately:** (a) Stage-1 classification (checklist coverage on 12 sampled corpus cards + the 4 labelled ones), (b) Stage-2 extraction (the §5b labelled pairs: field accuracy, POPIT ±1 per dimension, total-band correctness, and **gap-flagging correctness** — flagging a missing field is a pass, guessing it is a fail).
- **Metrics:** accuracy per above, £-cost per document, p50/p95 latency.
- **Output:** `model_bakeoff_report.md` with a recommendation per stage. Expected shape: cheapest adequate model for Stage 1; Stage 2 decided by the accuracy table. Wire winners into `agent.ts` as two named model slots `MODEL_CLASSIFY`, `MODEL_EXTRACT` (env-overridable).

## §12. Outstanding v3 items folded into this phase
- Copy the four labelled vision cards into `corpus/vision-cards/`; set `AI_GATEWAY_API_KEY`; run `pnpm eval:live` (Agent 2's environmental steps).
- Run `pnpm install && pnpm --filter @ia-agent/web dev` locally to verify Agent 3's build (Node was off PATH in-session).
- **O2T overlay alignment:** re-derive the O2 Transformation itemised base (§3B) directly from `O2_TransformationEstimation_...xlsx` cell-by-cell and reconcile any line-item drift; adjust rules YAML, never the test expectation, unless the source file itself disagrees with §3 — in which case flag, don't silently change.
- **BA year-PU scaling:** engine already supports per-year PU columns; keep 2026 as default and add a `ba_year_scaling: confirm_with_mentor` flag surfaced in the audit trail until the mentor rules whether effort quantities shrink annually or only the rate.

---

## Cursor agent prompts (paste verbatim, one session each)

**Agent 5 — Readiness Gate UI (apps/web):**
`Read PROJECT_BRIEF.md §9–§10 and the existing apps/web code. Replace the current upload screen with the Readiness Gate: centred prompt tab; greyed checklist (Requirements mandatory; Impact Areas and HLD optional, italic with "(optional)"); circular plus upload bottom-left; submit icon bottom-right at 25% opacity until all mandatory items are satisfied, then 100%; five checklist states per §9 with amber partial reasons; live confidence chip per the flow-aware band table; uploaded-file chips with remove + re-evaluation; aria-live state announcements; streaming state transitions wired to a new /api/classify endpoint that calls the agent's classify_documents tool (mock until Agent 6 lands). Match the existing app's styling. Deliver: the gate working end-to-end against the mock with a Playwright test covering grey→amber→green→submit-enabled.`

**Agent 6 — Two-stage pipeline + knowledge hardening (agent/ + packages):**
`Read PROJECT_BRIEF.md §10 and eve docs (@Docs eve.dev). Add tools/classify_documents.ts per the §10 schema, importing manifest definitions from packages/rules (no duplication), model slot MODEL_CLASSIFY. Audit agent/instructions.md and every file in agent/skills/ and remove any calibrated numeric values (PU values, rates, factors, matrices) — replace with references like "call score_ba" — and add a CI check (script + test) that fails if any number from packages/rules YAML appears verbatim in skills or instructions. Write SECURITY_DATAFLOW.md per §10.4. Extend agent/evals with 6 classification cases (vision-only, vision+heatmap, thin lean card, HLD present, contradictory pair, irrelevant doc). Deliver: green evals + the CI leak-check passing.`

**Agent 7 — Model bake-off (evals/):**
`Read PROJECT_BRIEF.md §11. Parameterise model per stage via MODEL_CLASSIFY / MODEL_EXTRACT env slots resolved through AI Gateway. Build evals/bakeoff.ts running the §11 matrix (4 models × 2 task suites), collecting accuracy, gap-flagging correctness, cost per document from gateway usage metadata, and p50/p95 latency. Emit model_bakeoff_report.md with a per-stage recommendation table and wire the chosen defaults into agent.ts. Requires AI_GATEWAY_API_KEY; fail gracefully with a clear message if unset. Deliver: the report generated from a real run.`

**Then close §8:** with Agents 5–6 merged and env set, run the live demo — OFR Vision Card through Flow A (expect score 20, 295.2 BA PU, seed 456.2 PU, £165,144.40 @2026, band −50/+100 → −30/+50 as the heatmap is added) and the RetainX pack through Flow B (4,162.86 PU, £1,771,380.19 @£425.52-basis, ±15%) — and record the band-widening-on-degradation walkthrough (delete Vision Card sections, watch checklist and band respond) as the mentor demo.

## Sequencing for the next working session
1. Ten-minute env pass: corpus copy, `AI_GATEWAY_API_KEY`, local `pnpm install` + web dev-server check (§12).
2. Launch Agent 6 first (it defines the classify tool Agent 5 consumes) and Agent 5 in parallel against the mock.
3. Launch Agent 7 once the key is set — it's independent.
4. O2T overlay reconciliation (§12) in a short focused session.
5. Close §8 with the live demo recording; take `model_bakeoff_report.md` and `SECURITY_DATAFLOW.md` to the mentor — they answer his cost and confidentiality questions with evidence rather than opinion.
