import { GRIDFINITY_PROFILE } from "./geometry/profile";
import type { PlateInput } from "./geometry/types";
import { CUSTOM_PRINTER_ID, DEFAULT_PRINTER_ID, findPrinterPreset } from "./printers";

const STORAGE_KEY = "benchfinity.defaults.v1";
const defaultPrinter = findPrinterPreset(DEFAULT_PRINTER_ID);

export type AppDefaults = {
  input: PlateInput;
  selectedPrinterId: string;
  exploded: boolean;
};

export const FACTORY_DEFAULTS: AppDefaults = {
  selectedPrinterId: DEFAULT_PRINTER_ID,
  exploded: false,
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

  const input = isRecord(value.input) ? value.input : {};
  const selectedPrinterId = typeof value.selectedPrinterId === "string" ? value.selectedPrinterId : DEFAULT_PRINTER_ID;
  const normalized: AppDefaults = {
    selectedPrinterId,
    exploded: typeof value.exploded === "boolean" ? value.exploded : FACTORY_DEFAULTS.exploded,
    input: {
      projectName: stringValue(input.projectName, FACTORY_DEFAULTS.input.projectName),
      finishedWidth: numberValue(input.finishedWidth, FACTORY_DEFAULTS.input.finishedWidth),
      finishedDepth: numberValue(input.finishedDepth, FACTORY_DEFAULTS.input.finishedDepth),
      finishedUnit: unitValue(input.finishedUnit, FACTORY_DEFAULTS.input.finishedUnit),
      bedWidth: numberValue(input.bedWidth, FACTORY_DEFAULTS.input.bedWidth),
      bedDepth: numberValue(input.bedDepth, FACTORY_DEFAULTS.input.bedDepth),
      bedUnit: unitValue(input.bedUnit, FACTORY_DEFAULTS.input.bedUnit),
      cellSizeMm: numberValue(input.cellSizeMm, FACTORY_DEFAULTS.input.cellSizeMm),
      printMarginMm: numberValue(input.printMarginMm, FACTORY_DEFAULTS.input.printMarginMm),
      includeMagnets:
        typeof input.includeMagnets === "boolean" ? input.includeMagnets : FACTORY_DEFAULTS.input.includeMagnets,
      openBottom: typeof input.openBottom === "boolean" ? input.openBottom : FACTORY_DEFAULTS.input.openBottom,
    },
  };

  const preset = findPrinterPreset(normalized.selectedPrinterId);

  if (preset) {
    normalized.input.bedWidth = preset.bedWidth;
    normalized.input.bedDepth = preset.bedDepth;
    normalized.input.bedUnit = preset.unit;
  } else if (normalized.selectedPrinterId !== CUSTOM_PRINTER_ID) {
    normalized.selectedPrinterId = DEFAULT_PRINTER_ID;
    normalized.input.bedWidth = FACTORY_DEFAULTS.input.bedWidth;
    normalized.input.bedDepth = FACTORY_DEFAULTS.input.bedDepth;
    normalized.input.bedUnit = FACTORY_DEFAULTS.input.bedUnit;
  }

  return normalized;
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
