import type { GeometryPart, PlateInput, PlateLayout, TileModel } from "../geometry/types";
import { toMillimeters } from "../geometry/layout";
import { createExportBundle } from "./bundle";
import { serializeBinaryStl } from "./stl";
import { createThreeMfPackage, type ThreeMfAdditionalObject } from "./threeMf";

export type ExportFormat = "mesh" | "3mf";

export type ExportBlobOptions = {
  format: ExportFormat;
  input: PlateInput;
  layout: PlateLayout;
  models: TileModel[];
  connectorKey: GeometryPart;
  additionalObjects: ThreeMfAdditionalObject[];
};

export async function createExportBlob({
  format,
  input,
  layout,
  models,
  connectorKey,
  additionalObjects,
}: ExportBlobOptions): Promise<Blob> {
  if (format === "3mf") {
    return createThreeMfPackage(models, {
      title: input.projectName,
      plateWidthMm: toMillimeters(input.bedWidth, input.bedUnit),
      plateDepthMm: toMillimeters(input.bedDepth, input.bedUnit),
      additionalObjects,
    });
  }

  if (models.length === 1) {
    return serializeBinaryStl(models[0].parts, "gridfinity-baseplate", { rotationDeg: models[0].tile.rotationDeg });
  }

  return createExportBundle(layout, input, models, connectorKey);
}

export function exportFileExtension(format: ExportFormat, models: TileModel[]): "3mf" | "stl" | "zip" {
  if (format === "3mf") {
    return "3mf";
  }

  return models.length === 1 ? "stl" : "zip";
}

export function exportStatusLabel(format: ExportFormat, models: TileModel[]): "3MF" | "STL" | "ZIP" {
  if (format === "3mf") {
    return "3MF";
  }

  return models.length === 1 ? "STL" : "ZIP";
}
