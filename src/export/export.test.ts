import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { createConnectorKeyPart, createPlateModels } from "../geometry/model";
import { deriveLayout } from "../geometry/layout";
import type { PlateInput } from "../geometry/types";
import { createExportBundle } from "./bundle";
import { createConnectorKeyObjects } from "./connectorKeyObjects";
import { createExportBlob, exportFileExtension, exportStatusLabel } from "./createExportBlob";
import { serializeBinaryStl } from "./stl";
import { createThreeMfPackage } from "./threeMf";

const splitInput: PlateInput = {
  projectName: "Garage drawer",
  finishedWidth: 22,
  finishedDepth: 10.5,
  finishedUnit: "in",
  bedWidth: 220,
  bedDepth: 220,
  bedUnit: "mm",
  cellSizeMm: 42,
  printMarginMm: 5,
  includeMagnets: true,
  openBottom: false,
};

const rotatedSplitInput: PlateInput = {
  ...splitInput,
  projectName: "Rotated drawer",
  finishedWidth: 420,
  finishedDepth: 126,
  finishedUnit: "mm",
  bedWidth: 150,
  bedDepth: 230,
  bedUnit: "mm",
};

const rotatedSingleInput: PlateInput = {
  ...rotatedSplitInput,
  projectName: "Rotated single",
  finishedWidth: 210,
};

describe("exports", () => {
  it("serializes a printable tile STL", async () => {
    const layout = deriveLayout(splitInput);
    const models = createPlateModels(layout, splitInput);
    const blob = serializeBinaryStl(models[0].parts, models[0].tile.id);

    expect(blob.type).toBe("model/stl");
    expect(blob.size).toBeGreaterThan(1000);
  });

  it("rotates single STL exports when the only tile fits rotated", async () => {
    const layout = deriveLayout(rotatedSingleInput);
    const models = createPlateModels(layout, rotatedSingleInput);
    const blob = await createExportBlob({
      format: "mesh",
      input: rotatedSingleInput,
      layout,
      models,
      connectorKey: createConnectorKeyPart(),
      additionalObjects: [],
    });
    const rotatedBounds = readBinaryStlBounds(await blob.arrayBuffer());

    expect(layout.tiles).toHaveLength(1);
    expect(layout.tiles[0].rotationDeg).toBe(90);
    expect(exportFileExtension("mesh", models)).toBe("stl");
    expect(exportStatusLabel("mesh", models)).toBe("STL");
    expect(rotatedBounds.minX).toBeCloseTo(-layout.tiles[0].depthMm);
    expect(rotatedBounds.maxX).toBeCloseTo(0);
    expect(rotatedBounds.minY).toBeCloseTo(0);
    expect(rotatedBounds.maxY).toBeCloseTo(layout.tiles[0].widthMm);
  });

  it("creates a split ZIP bundle with manifest and connector", async () => {
    const layout = deriveLayout(splitInput);
    const models = createPlateModels(layout, splitInput);
    const bundle = await createExportBundle(layout, splitInput, models, createConnectorKeyPart());
    const zip = await JSZip.loadAsync(await bundle.arrayBuffer());
    const manifestText = await zip.file("manifest.json")?.async("string");
    const manifest = manifestText ? JSON.parse(manifestText) : undefined;

    expect(bundle.size).toBeGreaterThan(1000);
    expect(zip.file("connector-key.stl")).toBeTruthy();
    expect(zip.file("r1-c1.stl")).toBeTruthy();
    expect(manifest.projectName).toBe("Garage drawer");
    expect(manifest.printMode).toBe("standard solid-bottom");
    expect(manifest.derived.gridColumns).toBe(13);
    expect(manifest.derived.gridRows).toBe(6);
  });

  it("creates one 3MF connector-key object per required seam key", () => {
    const layout = deriveLayout(splitInput);
    const connectorKey = createConnectorKeyPart();
    const objects = createConnectorKeyObjects(splitInput, layout, connectorKey);

    expect(objects).toHaveLength(10);
    expect(objects.every((object) => object.plateIndex === layout.tiles.length)).toBe(true);
    expect(objects[0]).toMatchObject({
      name: "connector-key-1",
      plateName: "connector keys",
      translationMm: {
        x: 20,
        y: 20,
        z: 0,
      },
    });
  });

  it("rotates split ZIP tile STLs and records connector key quantity", async () => {
    const layout = deriveLayout(rotatedSplitInput);
    const models = createPlateModels(layout, rotatedSplitInput);
    const bundle = await createExportBundle(layout, rotatedSplitInput, models, createConnectorKeyPart());
    const zip = await JSZip.loadAsync(await bundle.arrayBuffer());
    const manifestText = await zip.file("manifest.json")?.async("string");
    const readmeText = await zip.file("README.txt")?.async("string");
    const rotatedTileBuffer = await zip.file("r1-c1.stl")?.async("arraybuffer");
    const manifest = manifestText ? JSON.parse(manifestText) : undefined;
    const rotatedBounds = rotatedTileBuffer ? readBinaryStlBounds(rotatedTileBuffer) : undefined;

    expect(layout.tiles).toHaveLength(2);
    expect(layout.tiles.every((tile) => tile.rotationDeg === 90)).toBe(true);
    expect(manifest.connectors.quantity).toBe(1);
    expect(readmeText).toContain("Connector keys required: 1");
    expect(rotatedBounds?.minX).toBeCloseTo(-layout.tiles[0].depthMm);
    expect(rotatedBounds?.maxX).toBeCloseTo(0);
    expect(rotatedBounds?.minY).toBeCloseTo(0);
    expect(rotatedBounds?.maxY).toBeCloseTo(layout.tiles[0].widthMm);
  });

  it("records open-bottom mode in the ZIP bundle", async () => {
    const input = {
      ...splitInput,
      openBottom: true,
    };
    const layout = deriveLayout(input);
    const models = createPlateModels(layout, input);
    const bundle = await createExportBundle(layout, input, models, createConnectorKeyPart());
    const zip = await JSZip.loadAsync(await bundle.arrayBuffer());
    const manifestText = await zip.file("manifest.json")?.async("string");
    const readmeText = await zip.file("README.txt")?.async("string");
    const manifest = manifestText ? JSON.parse(manifestText) : undefined;

    expect(manifest.printMode).toBe("open-bottom lightweight");
    expect(readmeText).toContain("Print mode: open-bottom lightweight");
  });

  it("creates a standards-compatible 3MF package for a single geometry part set", async () => {
    const layout = deriveLayout(splitInput);
    const models = createPlateModels(layout, splitInput);
    const blob = await createThreeMfPackage(models[0].parts, {
      title: splitInput.projectName,
      objectName: models[0].tile.id,
    });
    const { contentTypesText, modelText, packageRelationshipsText, modelRelationshipsText, modelSettingsText } =
      await loadThreeMfPackage(blob);

    expect(blob.type).toBe("model/3mf");
    expect(blob.size).toBeGreaterThan(1000);
    expect(contentTypesText).toContain("application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
    expect(contentTypesText).toContain('PartName="/Metadata/model_settings.config" ContentType="application/xml"');
    expect(contentTypesText).toContain('PartName="/Metadata/slice_info.config" ContentType="application/xml"');
    expect(contentTypesText).toContain('PartName="/Metadata/filament_sequence.json" ContentType="application/json"');
    expect(packageRelationshipsText).toContain("http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel");
    expect(modelRelationshipsText).toContain("http://schemas.openxmlformats.org/package/2006/relationships");
    expect(modelText).toContain('unit="millimeter"');
    expect(modelText).toContain('<metadata name="Application">BambuStudio-');
    expect(modelText).toContain('<metadata name="BambuStudio:3mfVersion">1</metadata>');
    expect(modelText).toContain(`<object id="1" type="model">`);
    expect(modelText).toContain(`<object id="2" type="model" name="${models[0].tile.id}">`);
    expect(modelText).toContain('<item objectid="2" transform=');
    expect(modelSettingsText).toContain(`<object id="2">`);
    expect(modelSettingsText).toContain(`<metadata key="name" value="${models[0].tile.id}"/>`);
    expect(modelSettingsText).toContain("<plate>");
    expect(countMatches(modelText, /<vertex\b/g)).toBeGreaterThan(0);
    expect(countMatches(modelText, /<triangle\b/g)).toBeGreaterThan(0);
  });

  it("creates one Bambu plate and build item per split tile", async () => {
    const layout = deriveLayout(splitInput);
    const models = createPlateModels(layout, splitInput);
    const connectorKey = createConnectorKeyPart();
    const blob = await createThreeMfPackage(models, {
      title: splitInput.projectName,
      plateWidthMm: 220,
      plateDepthMm: 220,
      additionalObjects: [
        {
          name: `${connectorKey.name}-1`,
          parts: [connectorKey],
          plateIndex: models.length,
          plateName: "connector keys",
          translationMm: {
            x: 20,
            y: 20,
            z: 0,
          },
        },
        {
          name: `${connectorKey.name}-2`,
          parts: [connectorKey],
          plateIndex: models.length,
          plateName: "connector keys",
          translationMm: {
            x: 44,
            y: 20,
            z: 0,
          },
        },
      ],
    });
    const { modelText, modelSettingsText, filamentSequenceText } = await loadThreeMfPackage(blob);
    const objectCount = models.length + 2;
    const plateCount = models.length + 1;
    const vertexXs = readVertexCoordinates(modelText, "x");
    const buildTranslations = readBuildTransformTranslations(modelText);

    expect(countMatches(modelText, /<object\b/g)).toBe(objectCount * 2);
    expect(countMatches(modelText, /<item objectid="\d+" transform="[^"]+" printable="1"\/>/g)).toBe(objectCount);
    expect(buildTranslations).toHaveLength(objectCount);
    expect(countMatches(modelSettingsText, /<plate>/g)).toBe(plateCount);
    expect(countMatches(modelSettingsText, /<model_instance>/g)).toBe(objectCount);
    expect(modelText).toContain(`name="${models[0].tile.id}"`);
    expect(modelText).toContain(`name="${models[models.length - 1].tile.id}"`);
    expect(modelText).toContain(`name="${connectorKey.name}-1"`);
    expect(modelText).toContain(`name="${connectorKey.name}-2"`);
    expect(modelSettingsText).toContain('value="connector keys"');
    expect(filamentSequenceText).toContain(`"plate_${plateCount}"`);
    expect(Math.max(...buildTranslations.map((translation) => translation.x))).toBeGreaterThan(220);
    expect(Math.min(...buildTranslations.map((translation) => translation.x))).toBeGreaterThan(0);
    expect(buildTranslations.at(-2)?.x).toBe((models.length % 3) * (220 + 40) + 20);
    expect(buildTranslations.at(-1)?.x).toBe((models.length % 3) * (220 + 40) + 44);
    expect(Math.max(...vertexXs)).toBeLessThan(120);
    expect(Math.min(...vertexXs)).toBeGreaterThan(-120);
  });
});

async function loadThreeMfPackage(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const contentTypesText = await zip.file("[Content_Types].xml")?.async("string");
  const packageRelationshipsText = await zip.file("_rels/.rels")?.async("string");
  const modelText = await zip.file("3D/3dmodel.model")?.async("string");
  const modelRelationshipsText = await zip.file("3D/_rels/3dmodel.model.rels")?.async("string");
  const modelSettingsText = await zip.file("Metadata/model_settings.config")?.async("string");
  const sliceInfoText = await zip.file("Metadata/slice_info.config")?.async("string");
  const filamentSequenceText = await zip.file("Metadata/filament_sequence.json")?.async("string");

  expect(zip.file("[Content_Types].xml")).toBeTruthy();
  expect(zip.file("_rels/.rels")).toBeTruthy();
  expect(zip.file("3D/3dmodel.model")).toBeTruthy();
  expect(zip.file("3D/_rels/3dmodel.model.rels")).toBeTruthy();
  expect(zip.file("Metadata/model_settings.config")).toBeTruthy();
  expect(zip.file("Metadata/slice_info.config")).toBeTruthy();
  expect(zip.file("Metadata/filament_sequence.json")).toBeTruthy();

  return {
    contentTypesText: contentTypesText ?? "",
    packageRelationshipsText: packageRelationshipsText ?? "",
    modelText: modelText ?? "",
    modelRelationshipsText: modelRelationshipsText ?? "",
    modelSettingsText: modelSettingsText ?? "",
    sliceInfoText: sliceInfoText ?? "",
    filamentSequenceText: filamentSequenceText ?? "",
  };
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}

function readVertexCoordinates(modelText: string, axis: "x" | "y" | "z"): number[] {
  return Array.from(modelText.matchAll(new RegExp(`<vertex[^>]* ${axis}="([^"]+)"`, "g")), (match) => Number(match[1]));
}

function readBuildTransformTranslations(modelText: string): { x: number; y: number; z: number }[] {
  return Array.from(modelText.matchAll(/<item objectid="\d+" transform="([^"]+)" printable="1"\/>/g), (match) => {
    const values = match[1].split(/\s+/).map(Number);

    expect(values).toHaveLength(12);

    return {
      x: values[9],
      y: values[10],
      z: values[11],
    };
  });
}

function readBinaryStlBounds(buffer: ArrayBuffer): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const triangleOffset = 84 + triangleIndex * 50;

    for (let vertexIndex = 0; vertexIndex < 3; vertexIndex += 1) {
      const vertexOffset = triangleOffset + 12 + vertexIndex * 12;
      const x = view.getFloat32(vertexOffset, true);
      const y = view.getFloat32(vertexOffset + 4, true);
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }

  return bounds;
}
