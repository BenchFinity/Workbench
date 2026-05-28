# Agent Handoff

## Current State

Benchfinity V1 is complete, audited, tested, and pushed as the foundation for the larger Workbench phase. The local app generates Gridfinity-compatible baseplates, preview meshes, STL exports, split ZIP exports, and Bambu Studio-style 3MF packages with one plate per tile and connector-key objects when split.

## Most Important Ground Truth

- Use `Benchfinity` as the product and repo name.
- Describe output as `Gridfinity-compatible`; avoid making `Gridfinity` the product brand.
- Do not use the Bambu Studio CLI for automated validation because it can crash on this machine.
- The code is intentionally modularized around UI, geometry, export selection, STL/ZIP, and 3MF internals.
- `docs/WORKBENCH-VNEXT.md` is the source of truth for the next major implementation phase.

## Verification Baseline

Last known good checks:

```bash
npm run test
npm run build
npm audit
```

Expected results:

- 34 tests passing.
- Production build passing with only the existing Three.js/Vite chunk-size warning.
- 0 npm audit vulnerabilities.

## Next Best Work

1. Start the Workbench phase from `docs/WORKBENCH-VNEXT.md`.
2. Decide backend repo/app shape for QQQ/Postgres integration.
3. Add account, project, workbench item, baseplate design, printer profile, and export artifact persistence.
4. Keep the existing V1 generator as the first workbench item type rather than rewriting the geometry/export core.
5. Add an artifact-storage decision before server-side generation.

## Open Cautions

- Bambu Studio GUI import should still be manually checked for release confidence.
- Printer preset dimensions should remain treated as user-facing defaults, not authoritative manufacturer specifications.
- The Vite bundle-size warning is expected because Three.js and React Three Fiber dominate the bundle. Code splitting can wait until the app grows.
