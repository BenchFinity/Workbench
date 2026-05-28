import { describe, expect, it } from "vitest";
import { deriveLayout, splitBalanced } from "./layout";
import type { PlateInput } from "./types";

const baseInput: PlateInput = {
  projectName: "Gridfinity baseplate",
  finishedWidth: 22,
  finishedDepth: 10.5,
  finishedUnit: "in",
  bedWidth: 220,
  bedDepth: 220,
  bedUnit: "mm",
  cellSizeMm: 42,
  printMarginMm: 5,
  includeMagnets: true,
  openBottom: false,
};

describe("deriveLayout", () => {
  it("centers the largest whole-cell grid inside the requested envelope", () => {
    const layout = deriveLayout(baseInput);

    expect(layout.errors).toEqual([]);
    expect(layout.cols).toBe(13);
    expect(layout.rows).toBe(6);
    expect(layout.gridWidthMm).toBe(546);
    expect(layout.gridDepthMm).toBe(252);
    expect(layout.targetWidthMm).toBeCloseTo(558.8);
    expect(layout.targetDepthMm).toBeCloseTo(266.7);
    expect(layout.paddingMm.left).toBeCloseTo(6.4);
    expect(layout.paddingMm.right).toBeCloseTo(6.4);
    expect(layout.paddingMm.front).toBeCloseTo(7.35);
    expect(layout.paddingMm.back).toBeCloseTo(7.35);
  });

  it("splits oversized plates into printable balanced tiles", () => {
    const layout = deriveLayout(baseInput);

    expect(layout.tiles.length).toBeGreaterThan(1);
    expect(
      layout.tiles.every((tile) =>
        tile.rotationDeg === 0
          ? tile.widthMm <= layout.printableWidthMm && tile.depthMm <= layout.printableDepthMm
          : tile.depthMm <= layout.printableWidthMm && tile.widthMm <= layout.printableDepthMm,
      ),
    ).toBe(true);
    expect(layout.tiles.some((tile) => tile.splitEdges.length > 0)).toBe(true);
  });

  it("reports invalid envelopes that cannot fit a whole grid cell", () => {
    const layout = deriveLayout({
      ...baseInput,
      finishedWidth: 30,
      finishedDepth: 30,
      finishedUnit: "mm",
    });

    expect(layout.errors).toContain("Finished size must fit at least one whole Gridfinity cell.");
  });

  it("reports invalid print margins", () => {
    const layout = deriveLayout({
      ...baseInput,
      printMarginMm: -1,
    });

    expect(layout.errors).toContain("Print margin must be zero or greater.");
  });

  it("reports cell pitches that cannot contain the socket profile", () => {
    const layout = deriveLayout({
      ...baseInput,
      cellSizeMm: 30,
    });

    expect(layout.errors).toContain("Grid cell size must be larger than the socket opening.");
  });

  it("warns when open-bottom mode skips magnet pockets", () => {
    const layout = deriveLayout({
      ...baseInput,
      openBottom: true,
      includeMagnets: true,
    });

    expect(layout.warnings).toContain("Magnet pockets are skipped in open-bottom mode.");
  });

  it("guards against excessive browser STL exports", () => {
    const layout = deriveLayout({
      ...baseInput,
      finishedWidth: 60,
      finishedDepth: 60,
      finishedUnit: "in",
    });

    expect(layout.errors).toContain("Grid cannot exceed 600 cells for browser STL export.");
  });
});

describe("splitBalanced", () => {
  it("avoids tiny remainder tiles", () => {
    expect(splitBalanced(13, 3)).toEqual([5, 4, 4]);
  });
});
