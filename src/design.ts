import type { PlateInput } from "./geometry/types";
import { findPrinterPreset } from "./printers";

export const DESIGN_SCHEMA_VERSION = 1;

// Serializable unit of a saved baseplate design -- the persistence payload the
// Workbench (VNext) will store. schemaVersion lets stored designs migrate as the
// generator input model evolves.
export type BaseplateDesign = {
  schemaVersion: typeof DESIGN_SCHEMA_VERSION;
  input: PlateInput;
  selectedPrinterId: string;
};

// A known printer preset overrides the input's bed width/depth/unit; Custom or an
// unknown id leaves the entered bed dimensions untouched.
export function applyPrinterToInput(input: PlateInput, printerId: string): PlateInput {
  const preset = findPrinterPreset(printerId);
  if (!preset) {
    return input;
  }
  return { ...input, bedWidth: preset.bedWidth, bedDepth: preset.bedDepth, bedUnit: preset.unit };
}
