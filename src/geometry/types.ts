import type { BufferGeometry } from "three";

export type Unit = "in" | "mm";
export type SplitEdge = "left" | "right" | "front" | "back";

export type PlateInput = {
  projectName: string;
  finishedWidth: number;
  finishedDepth: number;
  finishedUnit: Unit;
  bedWidth: number;
  bedDepth: number;
  bedUnit: Unit;
  cellSizeMm: number;
  printMarginMm: number;
  includeMagnets: boolean;
  openBottom: boolean;
};

export type EdgePadding = {
  left: number;
  right: number;
  front: number;
  back: number;
};

export type TileSpec = {
  id: string;
  rowIndex: number;
  colIndex: number;
  rowStart: number;
  colStart: number;
  rowCount: number;
  colCount: number;
  widthMm: number;
  depthMm: number;
  originMm: {
    x: number;
    y: number;
  };
  paddingMm: EdgePadding;
  splitEdges: SplitEdge[];
  rotationDeg: 0 | 90;
};

export type PlateLayout = {
  targetWidthMm: number;
  targetDepthMm: number;
  printableWidthMm: number;
  printableDepthMm: number;
  cellSizeMm: number;
  cols: number;
  rows: number;
  gridWidthMm: number;
  gridDepthMm: number;
  paddingMm: EdgePadding;
  tiles: TileSpec[];
  errors: string[];
  warnings: string[];
};

export type GeometryPart = {
  name: string;
  geometry: BufferGeometry;
};

export type TileModel = {
  tile: TileSpec;
  parts: GeometryPart[];
};
