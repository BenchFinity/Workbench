import { connectorKeyCount, planConnectorKeyLayout } from "../geometry/connectors";
import { toMillimeters } from "../geometry/layout";
import { GRIDFINITY_PROFILE } from "../geometry/profile";
import type { GeometryPart, PlateInput, PlateLayout } from "../geometry/types";
import type { ThreeMfAdditionalObject } from "./threeMf";

export function createConnectorKeyObjects(
  input: PlateInput,
  layout: PlateLayout,
  connectorKey: GeometryPart,
): ThreeMfAdditionalObject[] {
  const keyCount = connectorKeyCount(layout);

  if (keyCount === 0) {
    return [];
  }

  const keyPlateIndex = layout.tiles.length;
  const keyLayout = planConnectorKeyLayout({
    count: keyCount,
    keyWidthMm: GRIDFINITY_PROFILE.connectorKeyWidthMm,
    keyDepthMm: GRIDFINITY_PROFILE.connectorKeyDepthMm,
    bedWidthMm: toMillimeters(input.bedWidth, input.bedUnit),
    bedDepthMm: toMillimeters(input.bedDepth, input.bedUnit),
  });

  return keyLayout.placements.map((placement, index) => ({
    name: `${connectorKey.name}-${index + 1}`,
    parts: [connectorKey],
    plateIndex: keyPlateIndex,
    plateName: "connector keys",
    translationMm: placement,
  }));
}
