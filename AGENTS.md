# Benchfinity Agent Guide

## Project Context

Benchfinity is a BenchFinity project for generating Gridfinity-compatible baseplates, split print bundles, and Bambu Studio-style 3MF files. V1 is a local browser app. The next phase is the Workbench version with accounts, projects, saved designs, export history, and a QQQ/Postgres backend.

Use GitHub Issues for new project work unless James explicitly asks to skip issue tracking.

## Required Startup Reads

Before making code changes, read:

1. `README.md`
2. `docs/SESSION-STATE.md`
3. `docs/TODO.md`
4. `docs/WORKBENCH-VNEXT.md`
5. `docs/AGENT-HANDOFF.md`

`docs/PLAN-gridfinity-baseplate-generator.md` is the historical V1 plan and remains useful for original design intent.

## Commands

```bash
npm install
npm run test
npm run build
npm audit
```

Use `npm run dev` for local browser verification.

## Validation Rules

- Do not use the Bambu Studio CLI for automated validation. Its `--info` mode can trigger macOS crash reports on this machine.
- Validate 3MF output with unit tests, package-structure inspection, and manual Bambu Studio GUI import when needed.
- Keep `npm run test`, `npm run build`, and `npm audit` green before handoff.
- Browser smoke should cover settings open/close and 3MF export link creation.

## Architecture Boundaries

- `src/App.tsx` owns top-level state and orchestration only.
- `src/components/` owns UI surfaces and reusable fields.
- `src/geometry/` owns layout, split planning, connector placement, and mesh generation.
- `src/export/` owns STL, ZIP, 3MF, download, and export-selection behavior.
- `src/export/threeMf/` is intentionally split by concern: package assembly, mesh conversion, placement, core XML, Bambu metadata, formatting, constants, and shared types.
- `src/printers.ts` owns printer presets and grouping.

## Coding Expectations

- Keep changes small, explicit, and covered by focused tests.
- Prefer pure functions for geometry/export logic so they can be tested without React.
- Keep React components presentational unless they are the top-level app shell.
- Do not add dependencies unless the value is clear and tests/build/audit stay clean.
- Preserve Gridfinity/Tracefinity compatibility language as compatibility, not as the product brand.
