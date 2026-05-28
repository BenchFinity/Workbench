import { describe, expect, it } from "vitest";
import { deriveLayout } from "./geometry/layout";
import type { PlateInput } from "./geometry/types";
import { validateExport } from "./validation";

const validInput: PlateInput = {
  projectName: "Garage drawer",
  finishedWidth: 22,
  finishedDepth: 10.5,
  finishedUnit: "in",
  bedWidth: 325,
  bedDepth: 320,
  bedUnit: "mm",
  cellSizeMm: 42,
  printMarginMm: 5,
  includeMagnets: true,
  openBottom: false,
};

describe("validateExport", () => {
  it("accepts a valid generated layout", () => {
    const layout = deriveLayout(validInput);

    expect(validateExport(validInput, layout).errors).toEqual([]);
  });

  it("requires a project name for export filenames", () => {
    const input = {
      ...validInput,
      projectName: "   ",
    };
    const layout = deriveLayout(input);

    expect(validateExport(input, layout).errors).toContain("Project name is required for export filenames.");
  });

  it("includes layout validation errors", () => {
    const input = {
      ...validInput,
      printMarginMm: 500,
    };
    const layout = deriveLayout(input);

    expect(validateExport(input, layout).errors).toContain("Printable bed area must be positive after margin.");
  });

  it("rejects split layouts whose connector keys cannot fit on one bed plate", () => {
    const input = {
      ...validInput,
      finishedWidth: 420,
      finishedDepth: 42,
      finishedUnit: "mm" as const,
      bedWidth: 50,
      bedDepth: 50,
      bedUnit: "mm" as const,
      cellSizeMm: 42,
      printMarginMm: 0,
    };
    const layout = deriveLayout(input);

    expect(validateExport(input, layout).errors).toContain("Connector keys do not fit on one printer bed plate.");
  });
});
