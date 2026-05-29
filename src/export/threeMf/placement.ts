import type { GeometryPart } from "../../geometry/types";
import { FALLBACK_PLATE_COLUMNS, FALLBACK_PLATE_GAP_MM } from "./constants";
import { geometryBounds } from "./mesh";
import type { VectorLike } from "./types";

export function createPlatePlacement(
  parts: GeometryPart[],
  plateWidthMm: number | undefined,
  plateDepthMm: number | undefined,
  buildTranslationMm?: VectorLike,
  plateIndex = 0,
): { meshTranslationMm: VectorLike; buildTranslationMm: VectorLike } {
  const bounds = geometryBounds(parts);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const plateOrigin = createPlateOrigin(plateIndex, plateWidthMm, plateDepthMm);
  const baseTranslation = buildTranslationMm ?? {
    x: Number.isFinite(plateWidthMm) ? (plateWidthMm ?? 0) / 2 : 0,
    y: Number.isFinite(plateDepthMm) ? (plateDepthMm ?? 0) / 2 : 0,
    z: 0,
  };

  return {
    meshTranslationMm: {
      x: -centerX,
      y: -centerY,
      z: -bounds.minZ,
    },
    buildTranslationMm: {
      x: plateOrigin.x + baseTranslation.x,
      y: plateOrigin.y + baseTranslation.y,
      z: baseTranslation.z,
    },
  };
}

function createPlateOrigin(
  plateIndex: number,
  plateWidthMm: number | undefined,
  plateDepthMm: number | undefined,
): { x: number; y: number } {
  const plateWidth = Number.isFinite(plateWidthMm) ? (plateWidthMm ?? 0) : 0;
  const plateDepth = Number.isFinite(plateDepthMm) ? (plateDepthMm ?? 0) : 0;
  const column = plateIndex % FALLBACK_PLATE_COLUMNS;
  const row = Math.floor(plateIndex / FALLBACK_PLATE_COLUMNS);

  return {
    x: column * (plateWidth + FALLBACK_PLATE_GAP_MM),
    y: -row * (plateDepth + FALLBACK_PLATE_GAP_MM),
  };
}
