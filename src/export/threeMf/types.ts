import type { GeometryPart } from "../../geometry/types";

export type VectorLike = {
  x: number;
  y: number;
  z: number;
};

export type ThreeMfPackageOptions = {
  title?: string;
  objectName?: string;
  additionalObjects?: ThreeMfAdditionalObject[];
  plateWidthMm?: number;
  plateDepthMm?: number;
};

export type ThreeMfAdditionalObject = {
  name: string;
  parts: GeometryPart[];
  translationMm?: VectorLike;
  rotationDeg?: number;
  plateIndex?: number;
  plateName?: string;
};

export type ThreeMfObjectInput = {
  name: string;
  parts: GeometryPart[];
  buildTranslationMm?: VectorLike;
  meshTranslationMm?: VectorLike;
  rotationDeg?: number;
  plateIndex?: number;
  plateName?: string;
};

export type ThreeMfVertex = {
  x: string;
  y: string;
  z: string;
};

export type ThreeMfTriangle = {
  v1: number;
  v2: number;
  v3: number;
};

export type ThreeMfMesh = {
  vertices: ThreeMfVertex[];
  triangles: ThreeMfTriangle[];
};

export type ThreeMfObject = {
  id: number;
  meshObjectId: number;
  componentObjectId: number;
  name: string;
  mesh: ThreeMfMesh;
  buildTranslationMm: VectorLike;
  plateIndex: number;
  plateName: string;
};

export type GeometryBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
};
