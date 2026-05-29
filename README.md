# Benchfinity

[![CI](https://github.com/BenchFinity/workbench/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/BenchFinity/workbench/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/BenchFinity/workbench)](LICENSE)

Benchfinity is a browser app for generating Gridfinity-compatible workbench baseplates as STL, split ZIP bundles, and Bambu Studio-style 3MF files.

The V1 app runs locally in the browser. The next Workbench phase adds accounts, projects, saved designs, export history, and a QQQ/Postgres backend.

## Commands

```bash
npm install
npm run dev
npm run test
npm run build
npm audit
```

## Docker

Benchfinity publishes container images to GitHub Container Registry.

```bash
docker build -t benchfinity-workbench .
docker run --rm -p 8080:8080 benchfinity-workbench
```

The production image serves the built Vite app on port `8080`. Published images use `ghcr.io/benchfinity/workbench`.

## Architecture

- `src/App.tsx` owns top-level state, defaults, validation, and export orchestration.
- `src/components/` owns UI surfaces: controls, settings, preview, and reusable fields.
- `src/geometry/` owns Gridfinity layout, split planning, connector placement, and mesh generation.
- `src/export/` owns file creation. `createExportBlob.ts` selects STL, ZIP, or 3MF; `bundle.ts` writes split ZIPs; `stl.ts` writes binary STL; `threeMf/` contains focused 3MF package, mesh, placement, XML, and Bambu metadata modules.
- `src/printers.ts` owns printer presets and grouping for UI selectors.

## Agent Handoff

- `AGENTS.md` contains repo-specific agent instructions.
- `docs/SESSION-STATE.md` records current implementation status and validation notes.
- `docs/AGENT-HANDOFF.md` summarizes the current ground truth and next best work.
- `docs/WORKBENCH-VNEXT.md` is the requirements/design source for the next large expansion.
- `docs/TODO.md` tracks completed V1 work and next-phase tasks.

## V1 Scope

- Exact finished envelope with centered Gridfinity cells and solid perimeter padding.
- Project name input used in exported filenames, manifest, and README.
- KofTwentyTwo project footer.
- Settings dialog for saved defaults in local storage.
- Pre-export validation for project name, dimensions, margin, printable fit, and generated tiles.
- Standard `42mm` Gridfinity pitch by default.
- Tracefinity-compatible socket profile.
- `6mm x 2mm` magnet pockets enabled by default.
- Open-bottom lightweight mode for lower-filament grid-only prints.
- Automatic split tiles when the plate is larger than the printable bed.
- Printer bed presets grouped by brand, with Bambu Lab H2C left-nozzle selected by default and a `Custom` option for manual dimensions.
- Edge-open underside connector notches with a separate connector key STL.
- Bambu Studio-style 3MF export with one printable plate per generated tile, plus STL export for single plates and ZIP export for split plates.

## Branch And Release Flow

- `develop` is the default branch for integration work.
- `feature/*` branches publish snapshot container images tagged with the sanitized branch name and short commit SHA.
- `develop` publishes a snapshot image and the `develop` image tag.
- `release/*` and `rc/*` branches publish RC images and prerelease GitHub Releases.
- `main` publishes the clean package version image tag and a stable GitHub Release.

## License

Benchfinity is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
