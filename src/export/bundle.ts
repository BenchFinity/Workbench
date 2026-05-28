import JSZip from "jszip";
import { connectorKeyCount } from "../geometry/connectors";
import { GRIDFINITY_PROFILE } from "../geometry/profile";
import { serializeBinaryStlBuffer } from "./stl";
import type { GeometryPart, PlateInput, PlateLayout, TileModel } from "../geometry/types";

export async function createExportBundle(
  layout: PlateLayout,
  input: PlateInput,
  models: TileModel[],
  connectorKey: GeometryPart,
): Promise<Blob> {
  const zip = new JSZip();

  models.forEach((model) => {
    zip.file(
      `${model.tile.id}.stl`,
      serializeBinaryStlBuffer(model.parts, model.tile.id, { rotationDeg: model.tile.rotationDeg }),
    );
  });

  if (connectorKeyCount(layout) > 0) {
    zip.file("connector-key.stl", serializeBinaryStlBuffer([connectorKey], "connector-key"));
  }

  zip.file("manifest.json", JSON.stringify(createManifest(layout, input), null, 2));
  zip.file("README.txt", createReadme(layout, input));

  return zip.generateAsync({ type: "blob" });
}

function createManifest(layout: PlateLayout, input: PlateInput) {
  const keyCount = connectorKeyCount(layout);

  return {
    generator: "benchfinity",
    version: "0.1.0",
    projectName: input.projectName,
    printMode: input.openBottom ? "open-bottom lightweight" : "standard solid-bottom",
    compatibility: {
      target: GRIDFINITY_PROFILE.name,
      tracefinityRelease: GRIDFINITY_PROFILE.tracefinityRelease,
      tracefinityReleaseDate: GRIDFINITY_PROFILE.tracefinityReleaseDate,
    },
    input,
    derived: {
      finishedWidthMm: layout.targetWidthMm,
      finishedDepthMm: layout.targetDepthMm,
      gridColumns: layout.cols,
      gridRows: layout.rows,
      gridWidthMm: layout.gridWidthMm,
      gridDepthMm: layout.gridDepthMm,
      paddingMm: layout.paddingMm,
      printableWidthMm: layout.printableWidthMm,
      printableDepthMm: layout.printableDepthMm,
    },
    tiles: layout.tiles.map((tile) => ({
      id: tile.id,
      filename: `${tile.id}.stl`,
      colStart: tile.colStart,
      rowStart: tile.rowStart,
      colCount: tile.colCount,
      rowCount: tile.rowCount,
      widthMm: tile.widthMm,
      depthMm: tile.depthMm,
      originMm: tile.originMm,
      paddingMm: tile.paddingMm,
      splitEdges: tile.splitEdges,
      suggestedPrintRotationDeg: tile.rotationDeg,
    })),
    connectors: keyCount > 0
      ? {
          filename: "connector-key.stl",
          type: "edge-open underside spline key",
          quantity: keyCount,
          sizeMm: {
            width: GRIDFINITY_PROFILE.connectorKeyWidthMm,
            depth: GRIDFINITY_PROFILE.connectorKeyDepthMm,
            height: GRIDFINITY_PROFILE.connectorKeyHeightMm,
          },
        }
      : null,
  };
}

function createReadme(layout: PlateLayout, input: PlateInput): string {
  const keyCount = connectorKeyCount(layout);
  const lines = [
    input.projectName.trim() || "Benchfinity export",
    "",
    `Finished size: ${formatMm(layout.targetWidthMm)} x ${formatMm(layout.targetDepthMm)}`,
    `Grid: ${layout.cols} x ${layout.rows} at ${formatMm(layout.cellSizeMm)}`,
    `Print mode: ${input.openBottom ? "open-bottom lightweight" : "standard solid-bottom"}`,
    `Padding: left ${formatMm(layout.paddingMm.left)}, right ${formatMm(layout.paddingMm.right)}, front ${formatMm(
      layout.paddingMm.front,
    )}, back ${formatMm(layout.paddingMm.back)}`,
    `Tiles: ${layout.tiles.length}`,
    "",
    "Print STL files in millimeters.",
  ];

  if (keyCount > 0) {
    lines.push(`Connector keys required: ${keyCount}`);
    lines.push("Print connector-key.stl at the required quantity and install from the underside.");
  }

  return `${lines.join("\n")}\n`;
}

function formatMm(value: number): string {
  return `${Number(value.toFixed(2))}mm`;
}
