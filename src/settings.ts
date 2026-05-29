import { DESIGN_SCHEMA_VERSION, applyPrinterToInput, type BaseplateDesign } from "./design";
import { GRIDFINITY_PROFILE } from "./geometry/profile";
import { CUSTOM_PRINTER_ID, DEFAULT_PRINTER_ID, findPrinterPreset } from "./printers";

const STORAGE_KEY = "benchfinity.defaults.v2";
const defaultPrinter = findPrinterPreset(DEFAULT_PRINTER_ID);

export type AppDefaults = {
  design: BaseplateDesign;
  exploded: boolean;
};

export const FACTORY_DEFAULTS: AppDefaults = {
  design: {
    schemaVersion: DESIGN_SCHEMA_VERSION,
    selectedPrinterId: DEFAULT_PRINTER_ID,
    input: {
      projectName: "Gridfinity baseplate",
      finishedWidth: 22,
      finishedDepth: 10.5,
      finishedUnit: "in",
      bedWidth: defaultPrinter?.bedWidth ?? 325,
      bedDepth: defaultPrinter?.bedDepth ?? 320,
      bedUnit: defaultPrinter?.unit ?? "mm",
      cellSizeMm: GRIDFINITY_PROFILE.defaultCellSizeMm,
      printMarginMm: 5,
      includeMagnets: true,
      openBottom: false,
    },
  },
  exploded: false,
};

export function loadSavedDefaults(): AppDefaults {
  if (!canUseLocalStorage()) {
    return FACTORY_DEFAULTS;
  }

  return parseStoredDefaults(localStorage.getItem(STORAGE_KEY));
}

export function saveDefaults(defaults: AppDefaults): AppDefaults {
  const normalized = normalizeDefaults(defaults);

  if (canUseLocalStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  return normalized;
}

export function parseStoredDefaults(raw: string | null): AppDefaults {
  if (!raw) {
    return FACTORY_DEFAULTS;
  }

  try {
    return normalizeDefaults(JSON.parse(raw));
  } catch {
    return FACTORY_DEFAULTS;
  }
}

export function normalizeDefaults(value: unknown): AppDefaults {
  if (!isRecord(value)) {
    return FACTORY_DEFAULTS;
  }

  const designValue = isRecord(value.design) ? value.design : {};
  const input = isRecord(designValue.input) ? designValue.input : {};
  const selectedPrinterId =
    typeof designValue.selectedPrinterId === "string" ? designValue.selectedPrinterId : DEFAULT_PRINTER_ID;
  const factoryInput = FACTORY_DEFAULTS.design.input;
  const design: BaseplateDesign = {
    schemaVersion: DESIGN_SCHEMA_VERSION,
    selectedPrinterId,
    input: {
      projectName: stringValue(input.projectName, factoryInput.projectName),
      finishedWidth: numberValue(input.finishedWidth, factoryInput.finishedWidth),
      finishedDepth: numberValue(input.finishedDepth, factoryInput.finishedDepth),
      finishedUnit: unitValue(input.finishedUnit, factoryInput.finishedUnit),
      bedWidth: numberValue(input.bedWidth, factoryInput.bedWidth),
      bedDepth: numberValue(input.bedDepth, factoryInput.bedDepth),
      bedUnit: unitValue(input.bedUnit, factoryInput.bedUnit),
      cellSizeMm: numberValue(input.cellSizeMm, factoryInput.cellSizeMm),
      printMarginMm: numberValue(input.printMarginMm, factoryInput.printMarginMm),
      includeMagnets: typeof input.includeMagnets === "boolean" ? input.includeMagnets : factoryInput.includeMagnets,
      openBottom: typeof input.openBottom === "boolean" ? input.openBottom : factoryInput.openBottom,
    },
  };

  design.input = applyPrinterToInput(design.input, design.selectedPrinterId);

  if (!findPrinterPreset(design.selectedPrinterId) && design.selectedPrinterId !== CUSTOM_PRINTER_ID) {
    design.selectedPrinterId = DEFAULT_PRINTER_ID;
    design.input.bedWidth = factoryInput.bedWidth;
    design.input.bedDepth = factoryInput.bedDepth;
    design.input.bedUnit = factoryInput.bedUnit;
  }

  return {
    design,
    exploded: typeof value.exploded === "boolean" ? value.exploded : FACTORY_DEFAULTS.exploded,
  };
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function unitValue(value: unknown, fallback: "in" | "mm"): "in" | "mm" {
  return value === "in" || value === "mm" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}
