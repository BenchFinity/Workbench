import type { PlateInput, PlateLayout } from "./geometry/types";
import { connectorKeyCount, planConnectorKeyLayout } from "./geometry/connectors";
import { GRIDFINITY_PROFILE } from "./geometry/profile";
import { toMillimeters } from "./geometry/layout";

export type ExportValidation = {
  errors: string[];
  isValid: boolean;
};

const MAX_PROJECT_NAME_LENGTH = 80;

export function validateExport(input: PlateInput, layout: PlateLayout): ExportValidation {
  const errors = [
    ...validateProjectName(input.projectName),
    ...layout.errors,
  ];

  if (layout.errors.length === 0 && layout.tiles.length === 0) {
    errors.push("No printable tiles were generated.");
  }

  if (layout.errors.length === 0) {
    errors.push(...validateConnectorKeys(input, layout));
  }

  return {
    errors: Array.from(new Set(errors)),
    isValid: errors.length === 0,
  };
}

function validateConnectorKeys(input: PlateInput, layout: PlateLayout): string[] {
  const keyCount = connectorKeyCount(layout);

  if (keyCount === 0) {
    return [];
  }

  const keyLayout = planConnectorKeyLayout({
    count: keyCount,
    keyWidthMm: GRIDFINITY_PROFILE.connectorKeyWidthMm,
    keyDepthMm: GRIDFINITY_PROFILE.connectorKeyDepthMm,
    bedWidthMm: toMillimeters(input.bedWidth, input.bedUnit),
    bedDepthMm: toMillimeters(input.bedDepth, input.bedUnit),
  });

  return keyLayout.fits ? [] : ["Connector keys do not fit on one printer bed plate."];
}

function validateProjectName(projectName: string): string[] {
  const trimmed = projectName.trim();

  if (!trimmed) {
    return ["Project name is required for export filenames."];
  }

  if (trimmed.length > MAX_PROJECT_NAME_LENGTH) {
    return [`Project name must be ${MAX_PROJECT_NAME_LENGTH} characters or fewer.`];
  }

  return [];
}
