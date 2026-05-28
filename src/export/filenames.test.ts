import { describe, expect, it } from "vitest";
import { buildExportFilename, sanitizeFilenamePart } from "./filenames";

describe("export filenames", () => {
  it("uses a sanitized project name", () => {
    expect(buildExportFilename("Garage Drawer #2", 13, 6, "zip")).toBe("garage-drawer-2-gridfinity-13x6.zip");
  });

  it("falls back when the project name is empty", () => {
    expect(buildExportFilename("   ", 2, 1, "stl")).toBe("benchfinity-baseplate-2x1.stl");
  });

  it("removes leading and trailing separators", () => {
    expect(sanitizeFilenamePart("  !Kitchen Base!  ")).toBe("kitchen-base");
  });

  it("supports 3MF filenames", () => {
    expect(buildExportFilename("Garage Drawer", 13, 6, "3mf")).toBe("garage-drawer-gridfinity-13x6.3mf");
  });
});
