import JSZip from "jszip";
import type { GeometryPart, TileModel } from "../../geometry/types";
import {
  bambuFilamentSequencePath,
  bambuModelSettingsPath,
  bambuSliceInfoPath,
  contentTypesPath,
  defaultObjectName,
  modelPath,
  modelRelationshipsPath,
  packageRelationshipsPath,
} from "./constants";
import { createMesh, maxModelSize } from "./mesh";
import { createPlatePlacement } from "./placement";
import {
  createContentTypesXml,
  createModelRelationshipsXml,
  createModelXml,
  createPackageRelationshipsXml,
} from "./coreXml";
import { createBambuFilamentSequenceJson, createBambuModelSettingsXml, createBambuSliceInfoXml } from "./bambuMetadata";
import type { ThreeMfObject, ThreeMfObjectInput, ThreeMfPackageOptions } from "./types";

export async function createThreeMfPackage(source: GeometryPart[], options?: ThreeMfPackageOptions): Promise<Blob>;
export async function createThreeMfPackage(source: TileModel[], options?: ThreeMfPackageOptions): Promise<Blob>;
export async function createThreeMfPackage(
  source: GeometryPart[] | TileModel[],
  options: ThreeMfPackageOptions = {},
): Promise<Blob> {
  if (source.length === 0) {
    throw new Error("Cannot create a 3MF package without geometry.");
  }

  if (isTileModelArray(source)) {
    return createThreeMfPackageFromTileModels(source, options);
  }

  return createThreeMfPackageFromParts(source, options);
}

export async function createThreeMfPackageFromParts(
  parts: GeometryPart[],
  options: ThreeMfPackageOptions = {},
): Promise<Blob> {
  const name = options.objectName?.trim() || options.title?.trim() || defaultObjectName;
  return createThreeMfPackageFromObjects([{ name, parts }], options);
}

export async function createThreeMfPackageFromTileModels(
  models: TileModel[],
  options: ThreeMfPackageOptions = {},
): Promise<Blob> {
  const plateWidthMm = options.plateWidthMm ?? maxModelSize(models, "width");
  const plateDepthMm = options.plateDepthMm ?? maxModelSize(models, "depth");

  return createThreeMfPackageFromObjects(
    [
      ...models.map((model, index) => ({
        name: model.tile.id,
        parts: model.parts,
        rotationDeg: model.tile.rotationDeg,
        plateIndex: index,
        plateName: model.tile.id,
        ...createPlatePlacement(model.parts, plateWidthMm, plateDepthMm, undefined, index),
      })),
      ...(options.additionalObjects ?? []).map((object, index) => {
        const plateIndex = object.plateIndex ?? models.length + index;

        return {
          name: object.name,
          parts: object.parts,
          rotationDeg: object.rotationDeg ?? 0,
          plateIndex,
          plateName: object.plateName ?? object.name,
          ...createPlatePlacement(object.parts, plateWidthMm, plateDepthMm, object.translationMm, plateIndex),
        };
      }),
    ],
    options,
  );
}

async function createThreeMfPackageFromObjects(
  objectInputs: ThreeMfObjectInput[],
  options: ThreeMfPackageOptions,
): Promise<Blob> {
  if (objectInputs.length === 0) {
    throw new Error("Cannot create a 3MF package without objects.");
  }

  const objects = objectInputs.map((input, index) => createObject(input, index, options));

  const zip = new JSZip();
  zip.file(contentTypesPath, createContentTypesXml());
  zip.file(packageRelationshipsPath, createPackageRelationshipsXml());
  zip.file(modelPath, createModelXml(objects, options));
  zip.file(modelRelationshipsPath, createModelRelationshipsXml());
  zip.file(bambuModelSettingsPath, createBambuModelSettingsXml(objects));
  zip.file(bambuSliceInfoPath, createBambuSliceInfoXml());
  zip.file(bambuFilamentSequencePath, createBambuFilamentSequenceJson(objects));

  return zip.generateAsync({ type: "blob", mimeType: "model/3mf" });
}

function createObject(input: ThreeMfObjectInput, index: number, options: ThreeMfPackageOptions): ThreeMfObject {
  if (input.parts.length === 0) {
    throw new Error(`Cannot create 3MF object "${input.name}" without geometry parts.`);
  }

  const placement =
    input.meshTranslationMm && input.buildTranslationMm
      ? {
          meshTranslationMm: input.meshTranslationMm,
          buildTranslationMm: input.buildTranslationMm,
        }
      : createPlatePlacement(
          input.parts,
          options.plateWidthMm,
          options.plateDepthMm,
          undefined,
          input.plateIndex ?? index,
        );
  const mesh = createMesh(input.parts, placement.meshTranslationMm, input.rotationDeg ?? 0);

  if (mesh.triangles.length === 0) {
    throw new Error(`Cannot create 3MF object "${input.name}" without triangles.`);
  }

  return {
    id: index + 1,
    meshObjectId: index * 2 + 1,
    componentObjectId: index * 2 + 2,
    name: input.name,
    mesh,
    buildTranslationMm: placement.buildTranslationMm,
    plateIndex: input.plateIndex ?? index,
    plateName: input.plateName ?? input.name,
  };
}

function isTileModelArray(source: GeometryPart[] | TileModel[]): source is TileModel[] {
  return "tile" in source[0];
}
