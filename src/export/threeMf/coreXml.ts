import {
  BAMBU_FILAMENT_SEQUENCE_PATH,
  BAMBU_MODEL_SETTINGS_PATH,
  BAMBU_NAMESPACE,
  BAMBU_SLICE_INFO_PATH,
  BAMBU_STUDIO_APPLICATION,
  CONFIG_CONTENT_TYPE,
  CORE_NAMESPACE,
  GENERATOR_APPLICATION,
  JSON_CONTENT_TYPE,
  MODEL_CONTENT_TYPE,
  MODEL_PATH,
  MODEL_RELATIONSHIP_TYPE,
  RELATIONSHIPS_CONTENT_TYPE,
  RELATIONSHIPS_NAMESPACE,
} from "./constants";
import { escapeXml, formatTranslationTransform } from "./format";
import type { ThreeMfObject, ThreeMfPackageOptions } from "./types";

export function createContentTypesXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`,
    `  <Default Extension="rels" ContentType="${RELATIONSHIPS_CONTENT_TYPE}"/>`,
    `  <Default Extension="model" ContentType="${MODEL_CONTENT_TYPE}"/>`,
    `  <Default Extension="png" ContentType="image/png"/>`,
    `  <Default Extension="gcode" ContentType="text/x.gcode"/>`,
    `  <Override PartName="/${BAMBU_MODEL_SETTINGS_PATH}" ContentType="${CONFIG_CONTENT_TYPE}"/>`,
    `  <Override PartName="/${BAMBU_SLICE_INFO_PATH}" ContentType="${CONFIG_CONTENT_TYPE}"/>`,
    `  <Override PartName="/${BAMBU_FILAMENT_SEQUENCE_PATH}" ContentType="${JSON_CONTENT_TYPE}"/>`,
    `</Types>`,
    "",
  ].join("\n");
}

export function createPackageRelationshipsXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<Relationships xmlns="${RELATIONSHIPS_NAMESPACE}">`,
    `  <Relationship Id="rel0" Type="${MODEL_RELATIONSHIP_TYPE}" Target="/${MODEL_PATH}"/>`,
    `</Relationships>`,
    "",
  ].join("\n");
}

export function createModelRelationshipsXml(): string {
  return ['<?xml version="1.0" encoding="UTF-8"?>', `<Relationships xmlns="${RELATIONSHIPS_NAMESPACE}"/>`, ""].join(
    "\n",
  );
}

export function createModelXml(objects: ThreeMfObject[], options: ThreeMfPackageOptions): string {
  const title = options.title?.trim();
  const date = new Date().toISOString().slice(0, 10);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<model unit="millimeter" xmlns="${CORE_NAMESPACE}" xml:lang="en-US" xmlns:BambuStudio="${BAMBU_NAMESPACE}">`,
    title ? `  <metadata name="Title">${escapeXml(title)}</metadata>` : undefined,
    `  <metadata name="Application">${BAMBU_STUDIO_APPLICATION}</metadata>`,
    `  <metadata name="BambuStudio:3mfVersion">1</metadata>`,
    `  <metadata name="Generator">${GENERATOR_APPLICATION}</metadata>`,
    `  <metadata name="Origin">${GENERATOR_APPLICATION}</metadata>`,
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
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
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
