import { bambuStudioApplication } from "./constants";
import { escapeXmlAttribute, formatTranslationTransform } from "./format";
import type { ThreeMfObject } from "./types";

export function createBambuModelSettingsXml(objects: ThreeMfObject[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<config>",
    ...objects.flatMap((object) => [
      `  <object id="${object.componentObjectId}">`,
      `    <metadata key="name" value="${escapeXmlAttribute(object.name)}"/>`,
      `    <metadata key="extruder" value="1"/>`,
      `    <metadata face_count="${object.mesh.triangles.length}"/>`,
      `    <part id="${object.meshObjectId}" subtype="normal_part">`,
      `      <metadata key="name" value="${escapeXmlAttribute(object.name)}"/>`,
      `      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>`,
      `      <metadata key="source_object_id" value="0"/>`,
      `      <metadata key="source_volume_id" value="0"/>`,
      `      <metadata key="source_offset_x" value="0"/>`,
      `      <metadata key="source_offset_y" value="0"/>`,
      `      <metadata key="source_offset_z" value="0"/>`,
      `      <mesh_stat face_count="${object.mesh.triangles.length}" edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>`,
      `    </part>`,
      `  </object>`,
    ]),
    ...createBambuPlateXml(objects),
    ...createBambuAssembleXml(objects),
    "</config>",
    "",
  ].join("\n");
}

export function createBambuSliceInfoXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<config>",
    "  <header>",
    '    <header_item key="X-BBL-Client-Type" value="slicer"/>',
    `    <header_item key="X-BBL-Client-Version" value="${bambuStudioApplication.replace("BambuStudio-", "")}"/>`,
    "  </header>",
    "</config>",
    "",
  ].join("\n");
}

export function createBambuFilamentSequenceJson(objects: ThreeMfObject[]): string {
  return JSON.stringify(
    Object.fromEntries(Array.from(groupObjectsByPlate(objects).keys()).map((plateIndex) => [`plate_${plateIndex + 1}`, { sequence: [] }])),
  );
}

function createBambuPlateXml(objects: ThreeMfObject[]): string[] {
  return Array.from(groupObjectsByPlate(objects).entries()).flatMap(([plateIndex, plateObjects]) => [
    `  <plate>`,
    `    <metadata key="plater_id" value="${plateIndex + 1}"/>`,
    `    <metadata key="plater_name" value="${escapeXmlAttribute(plateObjects[0].plateName)}"/>`,
    `    <metadata key="locked" value="false"/>`,
    `    <metadata key="filament_map_mode" value="Auto For Flush"/>`,
    `    <metadata key="filament_maps" value="1 1 1 1"/>`,
    `    <metadata key="filament_volume_maps" value="0 0 0 0"/>`,
    ...plateObjects.flatMap((object) => [
      `    <model_instance>`,
      `      <metadata key="object_id" value="${object.componentObjectId}"/>`,
      `      <metadata key="instance_id" value="0"/>`,
      `      <metadata key="identify_id" value="${1000 + object.id}"/>`,
      `    </model_instance>`,
    ]),
    `  </plate>`,
  ]);
}

function createBambuAssembleXml(objects: ThreeMfObject[]): string[] {
  return [
    "  <assemble>",
    ...objects.map(
      (object) =>
        `   <assemble_item object_id="${object.componentObjectId}" instance_id="0" transform="${formatTranslationTransform(object.buildTranslationMm)}" offset="0 0 0" />`,
    ),
    "  </assemble>",
  ];
}

function groupObjectsByPlate(objects: ThreeMfObject[]): Map<number, ThreeMfObject[]> {
  return objects.reduce((groups, object) => {
    const group = groups.get(object.plateIndex);

    if (group) {
      group.push(object);
    } else {
      groups.set(object.plateIndex, [object]);
    }

    return groups;
  }, new Map<number, ThreeMfObject[]>());
}
