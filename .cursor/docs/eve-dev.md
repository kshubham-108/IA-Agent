# Eve framework documentation

Agents working on `agent/` should consult the Eve docs:

- **URL:** https://eve.dev/docs
- **Bundled (version-pinned):** `agent/node_modules/eve/docs/` after `pnpm install`

## Cursor @Docs (manual)

There is no repo or settings API to register @Docs automatically. You must:

1. Open **Cursor Settings → Features → Docs** (or use **@Docs** in chat → **Add**).
2. Add documentation source: **https://eve.dev/docs** (or search **eve.dev**).
3. In chat, reference with `@Docs eve.dev` when implementing Eve tools, channels, or connections.

Optional: check `settings.json` — as of scaffold, Cursor does not expose a `docs.index` key for project-level indexing.

Domain rules in `.cursor/rules/domain.mdc` also point here.
