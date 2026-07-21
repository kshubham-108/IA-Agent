# IA Agent

VMO2/TCS Impact Assessment Estimation Agent monorepo.

See `PROJECT_BRIEF.md` for full specification.

## Structure

- `packages/engine` — pure deterministic calculators + vitest golden tests
- `packages/rules` — YAML rates, complexity tables, overlays
- `packages/extraction-schemas` — zod extraction schemas (no numeric estimate fields)
- `agent` — Eve runtime (eve **0.26.2**), skills, tools, evals, channels
- `apps/web` — Next.js UI
- `corpus` — vision cards + wall of reference

## Setup

```bash
pnpm install
pnpm test
```

## Eve docs

Add https://eve.dev/docs via Cursor **@Docs → add eve.dev**. See `.cursor/docs/eve-dev.md`.

## Manual step

`npx eve@latest init agent` could not run in scaffold environment (Node not in PATH). Agent directory was hand-scaffolded to match Eve 0.26.2 layout; run `pnpm install` and `pnpm --filter @ia-agent/agent dev` locally to verify.
