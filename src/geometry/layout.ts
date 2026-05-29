import { GRIDFINITY_PROFILE } from "./profile";
import type { EdgePadding, PlateInput, PlateLayout, SplitEdge, TileSpec, Unit } from "./types";

const INCH_TO_MM = 25.4;
const MAX_EXPORT_CELLS = 600;

export function toMillimeters(value: number, unit: Unit): number {
  return unit === "in" ? value * INCH_TO_MM : value;
}

export function splitBalanced(total: number, count: number): number[] {
  if (count <= 0 || count > total) {
    return [];
  }

  const base = Math.floor(total / count);
  const remainder = total % count;

  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function deriveLayout(input: PlateInput): PlateLayout {
  const targetWidthMm = toMillimeters(input.finishedWidth, input.finishedUnit);
  const targetDepthMm = toMillimeters(input.finishedDepth, input.finishedUnit);
  const bedWidthMm = toMillimeters(input.bedWidth, input.bedUnit);
  const bedDepthMm = toMillimeters(input.bedDepth, input.bedUnit);
  const printableWidthMm = bedWidthMm - input.printMarginMm * 2;
  const printableDepthMm = bedDepthMm - input.printMarginMm * 2;
  const cellSizeMm = input.cellSizeMm;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPositive(targetWidthMm) || !isPositive(targetDepthMm)) {
    errors.push("Finished dimensions must be positive.");
  }

  if (!isPositive(bedWidthMm) || !isPositive(bedDepthMm)) {
    errors.push("Printer bed dimensions must be positive.");
  }

  if (!Number.isFinite(input.printMarginMm) || input.printMarginMm < 0) {
    errors.push("Print margin must be zero or greater.");
  }

  if (!isPositive(printableWidthMm) || !isPositive(printableDepthMm)) {
    errors.push("Printable bed area must be positive after margin.");
  }

  if (!isPositive(cellSizeMm)) {
    errors.push("Grid cell size must be positive.");
  }

  if (isPositive(cellSizeMm) && cellSizeMm <= GRIDFINITY_PROFILE.socketOpeningMm) {
    errors.push("Grid cell size must be larger than the socket opening.");
  }

  const cols = isPositive(cellSizeMm) ? Math.floor(targetWidthMm / cellSizeMm) : 0;
  const rows = isPositive(cellSizeMm) ? Math.floor(targetDepthMm / cellSizeMm) : 0;

  if (cols < 1 || rows < 1) {
    errors.push("Finished size must fit at least one whole Gridfinity cell.");
  }

  if (cols * rows > MAX_EXPORT_CELLS) {
    errors.push(`Grid cannot exceed ${MAX_EXPORT_CELLS} cells for browser STL export.`);
  }

  const gridWidthMm = cols * cellSizeMm;
  const gridDepthMm = rows * cellSizeMm;
  const paddingMm: EdgePadding = {
    left: (targetWidthMm - gridWidthMm) / 2,
    right: targetWidthMm - gridWidthMm - (targetWidthMm - gridWidthMm) / 2,
    front: (targetDepthMm - gridDepthMm) / 2,
    back: targetDepthMm - gridDepthMm - (targetDepthMm - gridDepthMm) / 2,
  };

  const emptyLayout: PlateLayout = {
    targetWidthMm,
    targetDepthMm,
    printableWidthMm,
    printableDepthMm,
    cellSizeMm,
    cols,
    rows,
    gridWidthMm,
    gridDepthMm,
    paddingMm,
    tiles: [],
    errors,
    warnings,
  };

  if (errors.length > 0) {
    return emptyLayout;
  }

  if (cellSizeMm !== GRIDFINITY_PROFILE.defaultCellSizeMm) {
    warnings.push("Tracefinity compatibility is strongest at the standard 42mm grid pitch.");
  }

  if (input.openBottom && input.includeMagnets) {
    warnings.push("Magnet pockets are skipped in open-bottom mode.");
  }

  const split = findBestSplit(
    cols,
    rows,
    paddingMm,
    targetWidthMm,
    targetDepthMm,
    printableWidthMm,
    printableDepthMm,
    cellSizeMm,
  );

  if (!split) {
    errors.push("No valid split fits inside the printable bed area.");
    return emptyLayout;
  }

  return {
    ...emptyLayout,
    tiles: split.tiles,
    errors,
    warnings,
  };
}

function findBestSplit(
  cols: number,
  rows: number,
  padding: EdgePadding,
  targetWidthMm: number,
  targetDepthMm: number,
  printableWidthMm: number,
  printableDepthMm: number,
  cellSizeMm: number,
): { tiles: TileSpec[]; score: number } | undefined {
  let best: { tiles: TileSpec[]; score: number } | undefined;

  for (let colSegmentCount = 1; colSegmentCount <= cols; colSegmentCount += 1) {
    const colSegments = splitBalanced(cols, colSegmentCount);

    for (let rowSegmentCount = 1; rowSegmentCount <= rows; rowSegmentCount += 1) {
      const rowSegments = splitBalanced(rows, rowSegmentCount);
      const tiles = buildTiles(colSegments, rowSegments, padding, cellSizeMm);
      const valid = tiles.every((tile) => assignRotation(tile, printableWidthMm, printableDepthMm));

      if (!valid) {
        continue;
      }

      const tileCount = colSegmentCount * rowSegmentCount;
      const imbalance = segmentImbalance(colSegments) + segmentImbalance(rowSegments);
      const envelopeWaste =
        tiles.reduce((sum, tile) => sum + tile.widthMm * tile.depthMm, 0) - targetWidthMm * targetDepthMm;
      const score = tileCount * 100_000 + imbalance * 1_000 + envelopeWaste;

      if (!best || score < best.score) {
        best = { tiles, score };
      }
    }
  }

  return best;
}

function buildTiles(
  colSegments: number[],
  rowSegments: number[],
  padding: EdgePadding,
  cellSizeMm: number,
): TileSpec[] {
  const tiles: TileSpec[] = [];
  let rowStart = 0;
  let originY = 0;

  rowSegments.forEach((rowCount, rowIndex) => {
    let colStart = 0;
    let originX = 0;
    const frontPadding = rowIndex === 0 ? padding.front : 0;
    const backPadding = rowIndex === rowSegments.length - 1 ? padding.back : 0;
    const depthMm = frontPadding + rowCount * cellSizeMm + backPadding;

    colSegments.forEach((colCount, colIndex) => {
      const leftPadding = colIndex === 0 ? padding.left : 0;
      const rightPadding = colIndex === colSegments.length - 1 ? padding.right : 0;
      const widthMm = leftPadding + colCount * cellSizeMm + rightPadding;
      const splitEdges = getSplitEdges(colIndex, rowIndex, colSegments.length, rowSegments.length);

      tiles.push({
        id: `r${rowIndex + 1}-c${colIndex + 1}`,
        rowIndex,
        colIndex,
        rowStart,
        colStart,
        rowCount,
        colCount,
        widthMm,
        depthMm,
        originMm: {
          x: originX,
          y: originY,
        },
        paddingMm: {
          left: leftPadding,
          right: rightPadding,
          front: frontPadding,
          back: backPadding,
        },
        splitEdges,
        rotationDeg: 0,
      });

      originX += widthMm;
      colStart += colCount;
    });

    originY += depthMm;
    rowStart += rowCount;
  });

  return tiles;
}

function assignRotation(tile: TileSpec, printableWidthMm: number, printableDepthMm: number): boolean {
  if (tile.widthMm <= printableWidthMm && tile.depthMm <= printableDepthMm) {
    tile.rotationDeg = 0;
    return true;
  }

  if (tile.depthMm <= printableWidthMm && tile.widthMm <= printableDepthMm) {
    tile.rotationDeg = 90;
    return true;
  }

  return false;
}

function getSplitEdges(
  colIndex: number,
  rowIndex: number,
  colSegmentCount: number,
  rowSegmentCount: number,
): SplitEdge[] {
  const edges: SplitEdge[] = [];

  if (colIndex > 0) {
    edges.push("left");
  }

  if (colIndex < colSegmentCount - 1) {
    edges.push("right");
  }

  if (rowIndex > 0) {
    edges.push("front");
  }

  if (rowIndex < rowSegmentCount - 1) {
    edges.push("back");
  }

  return edges;
}

function segmentImbalance(segments: number[]): number {
  return Math.max(...segments) - Math.min(...segments);
}

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
