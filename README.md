# IA Agent

VMO2/TCS Impact Assessment Estimation Agent monorepo.

See `PROJECT_BRIEF.md` for full specification (populate from your source brief if empty).

## Structure

- `packages/engine` — pure deterministic calculators + vitest golden tests
- `packages/rules` — YAML rates, complexity tables, overlays
- `packages/extraction-schemas` — zod extraction schemas (no numeric estimate fields)
- `agent` — Eve runtime (**eve 0.26.2**), skills, tools, evals, channels
- `apps/web` — Next.js UI
- `corpus` — vision cards + wall of reference

## Setup

**Requires Node.js 24.x** (Eve 0.26.2) and **pnpm 10.12.1** (see root `packageManager`).

```bash
corepack enable
corepack prepare pnpm@10.12.1 --activate
pnpm install
pnpm test
pnpm --filter @ia-agent/agent dev
```

If `pnpm` is missing from PATH, install via [pnpm.io/installation](https://pnpm.io/installation) or use Corepack as above.

## Eve docs

Add https://eve.dev/docs via Cursor **@Docs → Add → eve.dev**. See `.cursor/docs/eve-dev.md`.

## Evals & calibration (Agent 4)

```bash
# Ingest corpus (xlsx → wall_of_reference.json, vision card text index)
pnpm ingest-corpus

# Run full Eve eval suite (mock model) + emit evals/calibration_report.md
pnpm eval

# Calibration report only (no Eve agent sessions)
pnpm calibrate
```

Eval suites live in `evals/`:
- `ba-golden.eval.ts` — engine §5b PU/band golden checks
- `labelled-pairs.eval.ts` — end-to-end §5b Vision Card pairs (mock model)
- `calibration.eval.ts` — backtest MAPE/bias, LOO band coverage ≥90%, extraction metrics
