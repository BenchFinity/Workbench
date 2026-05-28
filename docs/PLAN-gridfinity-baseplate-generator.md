# PLAN: Gridfinity Baseplate Generator

## Goal
Build a browser-based app that accepts a desired finished footprint, printer bed limits, and Gridfinity cell size, then previews and exports one or more printable baseplate files.

## Approach
Use a client-only TypeScript web app with a shared geometry pipeline for preview and export. The app computes the largest standard Gridfinity grid that fits inside the requested finished size, centers it inside that envelope, fills the remaining perimeter with padding, splits it into bed-safe tiles when needed, renders the assembled result in 3D, and exports STL, ZIP, and 3MF assets.

## Product Scope
- Inputs:
  - Project name for exported filenames and bundle metadata.
  - Desired finished width and depth, with inch and mm support.
  - Maximum printable bed width and depth, chosen from printer presets or entered manually with `Custom`.
  - Grid cell pitch, default `42mm`.
  - Finished envelope mode, default `centered padded grid`.
  - Baseplate variant, initially one standard profile.
  - Connector strategy for split plates.
- Outputs:
  - Single STL when the plate fits the bed.
  - ZIP containing per-tile STLs, connector STLs if applicable, and a manifest when split.
  - Assembled 3MF with all tiles arranged in build-space positions.
- Preview:
  - Interactive 3D view of the full assembled baseplate.
  - Tile boundaries, part labels, and bed-limit overlay.
  - Derived dimensions and tile count summary.

## V1 Decisions
- Canonical compatibility target: Tracefinity-compatible standard Gridfinity bins, using Tracefinity release `0.4.0` from 2026-05-26 as the current public reference point.
- Baseplate profile: standard Gridfinity baseplate socket profile on a `42mm x 42mm` pitch, with `6mm x 2mm` magnet pockets enabled by default in the Tracefinity preset and configurable off for faster drawer baseplates.
- Finished size behavior: exact requested envelope with the largest whole-cell Gridfinity grid centered inside it and solid perimeter padding around the edges.
- Split-plate priority: simple printing first, with a mechanical joining feature required.
- V1 connector: edge-open underside connector notches plus separate printed spline keys. This keeps the visible top Gridfinity interface clean and avoids side protrusions.
- V1 export: direct 3MF, STL, and ZIP bundle.
- Default printer preset: Bambu Lab H2C left-nozzle build area, `325mm x 320mm`.
- Printer preset scope: broad curated list of common FDM printers grouped by brand, plus `Custom` for missing machines.
- User defaults: settings dialog saves startup and reset defaults to browser local storage.

## Tracefinity Compatibility Notes
Tracefinity currently documents Gridfinity units as `42mm x 42mm`; bin height uses `7mm` units plus a `5mm` base; standard magnets are `6mm x 2mm`; and generated bins conform to the Gridfinity spec. Its public repository lists release `0.4.0` as latest on 2026-05-26 and describes generated bins as Gridfinity-compatible with proper base profile, magnet holes, and stacking lip.

Practical v1 rule: generated baseplates must accept Tracefinity bins without requiring special Tracefinity-specific bin settings. Magnet pockets are configurable, but the Tracefinity preset defaults them on and the baseplate socket geometry and pitch should remain standard.

References:

- `https://tracefinity.net/docs/bin-configuration`
- `https://github.com/tracefinity/tracefinity`
- `https://github.com/gridfinity-unofficial/specification`

## Sizing Rules
All internal geometry should use millimeters.

For a requested size:

```text
targetWidthMm = inputWidth * unitScale
targetDepthMm = inputDepth * unitScale
cols = floor(targetWidthMm / cellSizeMm)
rows = floor(targetDepthMm / cellSizeMm)
gridWidthMm = cols * cellSizeMm
gridDepthMm = rows * cellSizeMm
paddingLeftMm = (targetWidthMm - gridWidthMm) / 2
paddingRightMm = targetWidthMm - gridWidthMm - paddingLeftMm
paddingFrontMm = (targetDepthMm - gridDepthMm) / 2
paddingBackMm = targetDepthMm - gridDepthMm - paddingFrontMm
actualWidthMm = targetWidthMm
actualDepthMm = targetDepthMm
```

Envelope modes:

- `centeredPaddedGrid`: floor to the largest whole-cell grid that fits inside the requested size, then center it and fill the remaining edge space with solid padding.
- `fitWithin`: floor to the largest whole-cell grid that does not exceed the requested size and omit padding.
- `coverAtLeast`: ceil to the smallest whole-cell grid that covers the requested size.
- `nearest`: round to the closest whole-cell grid.
- `exactEnvelope`: keep whole cells and add non-grid perimeter border to hit the exact requested size.

Default recommendation: `centeredPaddedGrid`, with the UI clearly showing the full requested finished size, grid size, and per-edge padding.

Example, `22in x 10.5in` with `42mm` cells:

- Target: `558.8mm x 266.7mm`.
- Grid: `13 x 6` cells.
- Grid area: `546mm x 252mm`, or `21.496in x 9.921in`.
- Finished size: `558.8mm x 266.7mm`, or `22in x 10.5in`.
- Padding: `6.4mm` left/right and `7.35mm` front/back.

## Splitting Strategy
Split preferably on Gridfinity cell boundaries so each tile remains standard and predictable. When perimeter padding is present, include the padding in the outermost tiles only.

Derived values:

```text
printableWidthMm = bedWidthMm - printMarginMm * 2
printableDepthMm = bedDepthMm - printMarginMm * 2
maxColsPerTile = floor((printableWidthMm - maxHorizontalPaddingForTile) / cellSizeMm)
maxRowsPerTile = floor((printableDepthMm - maxVerticalPaddingForTile) / cellSizeMm)
tileCols = splitInteger(cols, maxColsPerTile)
tileRows = splitInteger(rows, maxRowsPerTile)
```

Rules:

- If one tile can fit by rotating, allow rotation and mark it in the manifest.
- Split counts should minimize the number of printed parts first, then avoid tiny remainder tiles.
- Distribution should be balanced, for example `13` columns on a `5` column max becomes `5, 4, 4`, not `5, 5, 3`.
- Outer tiles carry the centered padding. Interior tiles should remain whole-cell rectangular grid sections.
- Connector geometry must be included in bed-fit calculations if it protrudes beyond the tile envelope.
- If the bed cannot fit at least one grid cell plus required edge geometry, show a blocking validation error.

## Assembly Strategy
Start with connector choices that do not change the top Gridfinity interface.

Recommended MVP connector:

- Edge-open underside connector notches on split edges.
- Separate printed spline keys exported as their own STL files.
- Small clearance parameter for fit tuning.
- Optional mounting holes for users who want to screw tiles to a substrate.

Why this should be first:

- It preserves the standard top surface.
- It does not increase the tile footprint.
- It keeps the splitting math simple.
- It is easier to print than edge dovetails on small printers.

Later connector options:

- Edge dovetails for snap-fit plates.
- Alignment pin holes for metal or printed dowels.
- No connector geometry for users mounting to a board.

## Geometry Pipeline
Create a small geometry core that produces indexed triangle meshes from typed inputs.

Suggested core types:

```typescript
type GridConfig = {
  targetWidthMm: number;
  targetDepthMm: number;
  cellSizeMm: number;
  envelopeMode: EnvelopeMode;
};

type PrinterConfig = {
  bedWidthMm: number;
  bedDepthMm: number;
  printMarginMm: number;
};

type BaseplateProfile = {
  name: string;
  cellSizeMm: number;
  heightMm: number;
  topFeatureDimensions: Record<string, number>;
};

type TileSpec = {
  id: string;
  colStart: number;
  colCount: number;
  rowStart: number;
  rowCount: number;
  paddingMm: {
    left: number;
    right: number;
    front: number;
    back: number;
  };
  rotationDeg: 0 | 90;
  originMm: [number, number];
  splitEdges: SplitEdge[];
};
```

Implementation options:

- Fastest MVP: generate watertight `THREE.BufferGeometry`, preview it directly, then serialize the same geometry to STL.
- More robust CSG: use a browser-capable CAD kernel such as ManifoldJS or JSCAD for boolean operations, then convert the resulting mesh to Three.js.

Recommendation: start with direct mesh generation if the chosen baseplate profile can be expressed without heavy boolean operations. Move to ManifoldJS if connector sockets, holes, and chamfers become fragile.

## Preview
Use Three.js for the viewport.

Preview features:

- Orbit controls.
- Full assembled plate view.
- Optional exploded view with small gaps between tiles.
- Tile color alternation and labels.
- Bed outline overlay for the selected printer dimensions.
- Dimension annotations for requested finished size, centered grid area, and edge padding.
- Warning badges for overage, undersize, or invalid bed fit.

The preview should consume the same generated tile mesh data used by exporters, not a simplified duplicate model.

## Export
STL:

- Export one STL for unsplit plates.
- Export one STL per tile when split.
- Export connector STLs when connector keys are generated.
- STL is unitless, but the app should document and name files as millimeter-scale models.

3MF:

- Preferred for richer export because units and multi-object build layouts are explicit.
- Package as a ZIP-based 3MF archive with each tile as a build item.
- Include model metadata such as grid size, cell pitch, and tile coordinates.

ZIP bundle:

- `manifest.json`, listing inputs, derived dimensions, tile layout, rotations, Tracefinity compatibility target, connector settings, and filenames.
- `README.txt`, short print and assembly notes.
- `tile-r{row}-c{col}.stl` or equivalent stable names.
- `connector-*.stl` when applicable.

## Proposed Stack
- Vite, React, TypeScript.
- Three.js for preview.
- Optional `@react-three/fiber` if component-based scene composition is useful.
- Geometry/export:
  - `three` STL exporter for the direct mesh MVP.
  - `jszip` for ZIP and 3MF packaging.
  - ManifoldJS or JSCAD only if boolean geometry needs justify the dependency.
- Web Worker for geometry generation once meshes become large enough to affect UI responsiveness.
- Vitest for sizing, splitting, and manifest tests.
- Playwright for viewport smoke tests and export flow checks.

## Files Affected
Initial implementation will likely add:

- `package.json` and lockfile.
- `src/app` or `src` app entry files, depending on Vite or Next.js choice.
- `src/geometry/*` for layout, splitting, mesh generation, and exporters.
- `src/components/*` for controls, preview, and export UI.
- `src/types/*` for shared config and manifest types.
- `docs/` for planning and geometry notes.

## Steps
1. [x] Confirm exact Gridfinity baseplate profile and first connector strategy.
2. [x] Scaffold TypeScript web app.
3. [x] Implement unit conversion, centered padded envelope sizing, and derived dimension summary.
4. [x] Implement split planning and tile manifest generation.
5. [x] Build initial 3D preview from generated tile mesh data.
6. [x] Implement standard baseplate mesh generation.
7. [x] Add STL export for single and split plates.
8. [x] Add ZIP bundle export with manifest and connector assets.
9. [x] Add 3MF export for direct Bambu Studio import.
10. [x] Add unit tests for sizing, splitting, and manifests.
11. [x] Add browser smoke tests for preview and export.

## Open Questions
- None for v1 planning. Remaining choices are implementation details unless requirements change.
