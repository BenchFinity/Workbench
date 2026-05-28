import { describe, expect, it } from "vitest";
import { DEFAULT_PRINTER_ID, PRINTER_PRESETS, findPrinterPreset } from "./printers";

describe("printer presets", () => {
  it("defaults to the Bambu Lab H2C left-nozzle build area", () => {
    const preset = findPrinterPreset(DEFAULT_PRINTER_ID);

    expect(preset?.name).toBe("Bambu Lab H2C, left nozzle");
    expect(preset?.bedWidth).toBe(325);
    expect(preset?.bedDepth).toBe(320);
    expect(preset?.unit).toBe("mm");
  });

  it("includes H2C left, right, dual, and total-envelope presets", () => {
    expect(findPrinterPreset("bambu-h2c-left")).toMatchObject({ bedWidth: 325, bedDepth: 320 });
    expect(findPrinterPreset("bambu-h2c-right")).toMatchObject({ bedWidth: 305, bedDepth: 320 });
    expect(findPrinterPreset("bambu-h2c-dual-nozzle")).toMatchObject({ bedWidth: 300, bedDepth: 320 });
    expect(findPrinterPreset("bambu-h2c-total-envelope")).toMatchObject({ bedWidth: 330, bedDepth: 320 });
  });

  it("keeps preset ids unique", () => {
    const ids = PRINTER_PRESETS.map((preset) => preset.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(PRINTER_PRESETS.length).toBeGreaterThan(45);
  });
});
