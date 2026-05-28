# Benchfinity

Browser app for generating Gridfinity-compatible workbench baseplates as STL, ZIP, and 3MF files.

## Commands

```bash
npm install
npm run dev
npm run test
npm run build
```

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
