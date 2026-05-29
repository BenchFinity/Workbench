# Session State

## Current Branch

`feature/9-public-repo-ci`

## Status

V1 implementation is complete and the audit follow-up is closed. The repository now uses `develop` as the default branch, and Workbench VNext work is tracked in GitHub Issues under the `Workbench VNext` milestone and the `Benchfinity Roadmap` project. Repository foundation work is tracked in GitHub Issue #9.

## Implemented

- Benchfinity Vite, React, TypeScript app scaffold.
- Project name input used in filenames and export metadata.
- Footer shows the Benchfinity name and a link to benchfinity.com.
- Settings dialog persists startup and reset defaults in browser local storage.
- Pre-export validation blocks invalid project names, dimensions, margins, oversized grids, layouts without printable tiles, and connector-key plates that do not fit the selected bed.
- Centered padded envelope sizing.
- Bed-fit validation, brand-grouped printer presets, and balanced split planning.
- Bambu Lab H2C presets distinguish left nozzle, right nozzle, dual-nozzle safe, and total two-nozzle envelope.
- Tracefinity-compatible Gridfinity profile constants.
- Generated 3D mesh preview with tile labels and bed outline.
- Standard socket layer, magnet through-pockets, edge-open underside connector notches, and connector key mesh.
- Open-bottom lightweight mode for grid-only prints with no broad bottom floors, while keeping split connector notches backed by bottom-layer edge-cell pads.
- Bambu Studio-style 3MF export with millimeter units, one printable plate per generated tile, explicit bed placement transforms, and connector key object when split.
- 3MF exports include one connector key object per generated seam notch, grouped on a connector keys plate.
- 3MF build items now carry explicit per-plate global translations, so Bambu Studio fallback imports do not stack the split pieces even if plate metadata is flattened.
- 3MF package content types explicitly declare the Bambu metadata config and JSON parts.
- STL export for single plates, including rotated single-tile layouts.
- ZIP export for split plates with rotated tile STLs, connector key STL, connector quantity in `manifest.json` and `README.txt`, and project metadata.
- Persistent visible download link after export, so in-app browser users can see and retry the generated file.
- App shell, plate controls, workspace preview, form controls, and settings dialog are split into focused components so `App.tsx` stays centered on state and orchestration.
- Export orchestration is centralized in `createExportBlob.ts`, with connector-key 3MF object creation isolated in `connectorKeyObjects.ts`.
- 3MF export internals are split into focused `threeMf/` modules for package assembly, mesh conversion, placement, core XML, Bambu metadata, shared formatting, constants, and types.
- README architecture notes document the main module boundaries.
- Root `AGENTS.md` and `docs/AGENT-HANDOFF.md` document agent startup context, validation rules, architecture boundaries, and next-phase handoff notes.
- Unit/export tests, including Bambu-style 3MF package structure and a manifold edge regression for generated tile meshes.
- Regression coverage confirms open-bottom split tiles keep connector pads aligned with the underside notches.
- `docs/WORKBENCH-VNEXT.md` captures the QQQ/Postgres-backed account, project, and workbench direction for the next version.
- GitHub Issues #1 through #8 mirror the Workbench VNext TODO list.
- GitHub Issue #9 tracks public repository setup, Docker packaging, CI, GHCR image publishing, and release automation.

## Verification

- `npm run test` passes, 34 tests.
- `npm run build` passes with a Vite chunk-size warning caused by Three.js dependencies.
- `npm audit` reports 0 vulnerabilities after updating Vitest to 4.1.7.
- Browser smoke test passed with settings dialog open/close, 3MF export link creation, and no console errors.
- Do not use the installed Bambu Studio CLI for automated validation. Its `--info` mode can trigger macOS crash reports even when the log says the 3MF loaded. Use package-structure tests and manual Bambu Studio GUI import checks instead.
- Regression checks confirm split 3MF exports have one plate record per tile plus connector plate, and that build transforms spread the objects into non-overlapping plate lanes.
- Regression checks cover rotated single STL exports, rotated split ZIP STL exports, connector-key quantities, 3MF metadata content types, connector-key 3MF object placement, and connector-key plate validation.

## GitHub Workflow

- Default branch: `develop`.
- Active feature branch: `feature/9-public-repo-ci`.
- Work issue: #9, `Prepare public repo, container CI, and releases`.
- Roadmap project: `Benchfinity Roadmap`.
- Repository home: `BenchFinity/workbench`.
