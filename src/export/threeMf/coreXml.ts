import {
  bambuFilamentSequencePath,
  bambuModelSettingsPath,
  bambuNamespace,
  bambuSliceInfoPath,
  bambuStudioApplication,
  configContentType,
  coreNamespace,
  generatorApplication,
  jsonContentType,
  modelContentType,
  modelPath,
  modelRelationshipType,
  relationshipsContentType,
  relationshipsNamespace,
} from "./constants";
import { escapeXml, formatTranslationTransform } from "./format";
import type { ThreeMfObject, ThreeMfPackageOptions } from "./types";

export function createContentTypesXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`,
    `  <Default Extension="rels" ContentType="${relationshipsContentType}"/>`,
    `  <Default Extension="model" ContentType="${modelContentType}"/>`,
    `  <Default Extension="png" ContentType="image/png"/>`,
    `  <Default Extension="gcode" ContentType="text/x.gcode"/>`,
    `  <Override PartName="/${bambuModelSettingsPath}" ContentType="${configContentType}"/>`,
    `  <Override PartName="/${bambuSliceInfoPath}" ContentType="${configContentType}"/>`,
    `  <Override PartName="/${bambuFilamentSequencePath}" ContentType="${jsonContentType}"/>`,
    `</Types>`,
    "",
  ].join("\n");
}

export function createPackageRelationshipsXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<Relationships xmlns="${relationshipsNamespace}">`,
    `  <Relationship Id="rel0" Type="${modelRelationshipType}" Target="/${modelPath}"/>`,
    `</Relationships>`,
    "",
  ].join("\n");
}

export function createModelRelationshipsXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<Relationships xmlns="${relationshipsNamespace}"/>`,
    "",
  ].join("\n");
}

export function createModelXml(objects: ThreeMfObject[], options: ThreeMfPackageOptions): string {
  const title = options.title?.trim();
  const date = new Date().toISOString().slice(0, 10);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<model unit="millimeter" xmlns="${coreNamespace}" xml:lang="en-US" xmlns:BambuStudio="${bambuNamespace}">`,
    title ? `  <metadata name="Title">${escapeXml(title)}</metadata>` : undefined,
    `  <metadata name="Application">${bambuStudioApplication}</metadata>`,
    `  <metadata name="BambuStudio:3mfVersion">1</metadata>`,
    `  <metadata name="Generator">${generatorApplication}</metadata>`,
    `  <metadata name="Origin">${generatorApplication}</metadata>`,
    `  <metadata name="CreationDate">${date}</metadata>`,
    `  <metadata name="ModificationDate">${date}</metadata>`,
    `  <resources>`,
    ...objects.flatMap((object) => createResourceObjectXml(object)),
    `  </resources>`,
    `  <build>`,
    ...objects.map(
      (object) =>
        `    <item objectid="${object.componentObjectId}" transform="${formatTranslationTransform(object.buildTranslationMm)}" printable="1"/>`,
    ),
    `  </build>`,
    `</model>`,
    "",
  ].filter((line): line is string => line !== undefined).join("\n");
}

function createResourceObjectXml(object: ThreeMfObject): string[] {
  return [
    `    <object id="${object.meshObjectId}" type="model">`,
    `      <mesh>`,
    `        <vertices>`,
    ...object.mesh.vertices.map((vertex) => `          <vertex x="${vertex.x}" y="${vertex.y}" z="${vertex.z}"/>`),
    `        </vertices>`,
    `        <triangles>`,
    ...object.mesh.triangles.map(
      (triangle) => `          <triangle v1="${triangle.v1}" v2="${triangle.v2}" v3="${triangle.v3}"/>`,
    ),
    `        </triangles>`,
    `      </mesh>`,
    `    </object>`,
    `    <object id="${object.componentObjectId}" type="model" name="${escapeXml(object.name)}">`,
    `      <components>`,
    `        <component objectid="${object.meshObjectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>`,
    `      </components>`,
    `    </object>`,
  ];
}
