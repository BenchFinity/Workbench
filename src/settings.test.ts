import { describe, expect, it } from "vitest";
import { FACTORY_DEFAULTS, normalizeDefaults, parseStoredDefaults } from "./settings";

describe("settings", () => {
  it("loads factory defaults when storage is empty", () => {
    expect(parseStoredDefaults(null)).toEqual(FACTORY_DEFAULTS);
  });

  it("normalizes custom printer defaults", () => {
    const defaults = normalizeDefaults({
      exploded: true,
      design: {
        selectedPrinterId: "custom",
        input: {
          projectName: "Tool drawer",
          finishedWidth: 20,
          finishedDepth: 9,
          finishedUnit: "in",
          bedWidth: 280,
          bedDepth: 260,
          bedUnit: "mm",
          cellSizeMm: 42,
          printMarginMm: 3,
          includeMagnets: false,
          openBottom: true,
        },
      },
    });

    expect(defaults.design.selectedPrinterId).toBe("custom");
    expect(defaults.design.input.bedWidth).toBe(280);
    expect(defaults.design.input.bedDepth).toBe(260);
    expect(defaults.design.input.includeMagnets).toBe(false);
    expect(defaults.design.input.openBottom).toBe(true);
    expect(defaults.exploded).toBe(true);
  });

  it("uses preset bed dimensions for saved presets", () => {
    const defaults = normalizeDefaults({
      design: {
        selectedPrinterId: "bambu-h2c-right",
        input: {
          bedWidth: 999,
          bedDepth: 999,
        },
      },
    });

    expect(defaults.design.input.bedWidth).toBe(305);
    expect(defaults.design.input.bedDepth).toBe(320);
  });
});
