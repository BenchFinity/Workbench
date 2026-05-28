import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  InterleavedBufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
} from "three";
import { socketCountForEdge } from "./connectors";
import { GRIDFINITY_PROFILE } from "./profile";
import { circlePath, rectangleShape, roundedRectanglePath } from "./shapes";
import type { GeometryPart, PlateInput, PlateLayout, TileModel, TileSpec } from "./types";

type ConnectorSlot = { x: number; y: number; width: number; depth: number };
type PositionAttribute = BufferAttribute | InterleavedBufferAttribute;

const COORDINATE_EPSILON = 0.0001;
const AREA_EPSILON = 0.000001;

export function createPlateModels(layout: PlateLayout, input: PlateInput): TileModel[] {
  return layout.tiles.map((tile) => createTileModel(tile, input.cellSizeMm, input.includeMagnets, input.openBottom));
}

export function createConnectorKeyPart(): GeometryPart {
  const geometry = new BoxGeometry(
    GRIDFINITY_PROFILE.connectorKeyWidthMm,
    GRIDFINITY_PROFILE.connectorKeyDepthMm,
    GRIDFINITY_PROFILE.connectorKeyHeightMm,
  );
  geometry.translate(
    GRIDFINITY_PROFILE.connectorKeyWidthMm / 2,
    GRIDFINITY_PROFILE.connectorKeyDepthMm / 2,
    GRIDFINITY_PROFILE.connectorKeyHeightMm / 2,
  );
  geometry.computeVertexNormals();

  return {
    name: "connector-key",
    geometry,
  };
}

function createTileModel(tile: TileSpec, cellSizeMm: number, includeMagnets: boolean, openBottom: boolean): TileModel {
  const connectorSlots = createConnectorSlots(tile, cellSizeMm);

  return {
    tile,
    parts: openBottom
      ? createOpenBottomParts(tile, cellSizeMm, connectorSlots)
      : [
          ...createBaseParts(tile, cellSizeMm, includeMagnets, connectorSlots),
          {
            name: `${tile.id}-socket-shell`,
            geometry: createSocketShellGeometry(tile, cellSizeMm, connectorSlots),
          },
          ...createSocketFloorParts(tile, cellSizeMm, includeMagnets),
        ],
  };
}

function createOpenBottomParts(tile: TileSpec, cellSizeMm: number, connectorSlots: ConnectorSlot[]): GeometryPart[] {
  if (connectorSlots.length === 0) {
    return [
      {
        name: `${tile.id}-open-bottom-frame`,
        geometry: createOpenBottomFrameGeometry(tile, cellSizeMm),
      },
    ];
  }

  return [
    {
      name: `${tile.id}-open-bottom-notch-layer`,
      geometry: createOpenBottomBottomGeometry(tile, cellSizeMm, connectorSlots),
    },
    ...createConnectorCeilingParts(tile, connectorSlots),
    ...createConnectorPadFloorParts(tile, cellSizeMm, connectorSlots),
    {
      name: `${tile.id}-open-bottom-frame-upper`,
      geometry: createOpenBottomUpperGeometry(tile, cellSizeMm, connectorSlots),
    },
  ];
}

function createBaseParts(tile: TileSpec, cellSizeMm: number, includeMagnets: boolean, connectorSlots: ConnectorSlot[]): GeometryPart[] {
  if (connectorSlots.length === 0) {
    return [
      {
        name: `${tile.id}-base-shell`,
        geometry: createBaseShellGeometry(tile, cellSizeMm, includeMagnets),
      },
    ];
  }

  return [
    {
      name: `${tile.id}-base-bottom-shell`,
      geometry: createBaseBottomShellGeometry(tile, cellSizeMm, includeMagnets, connectorSlots),
    },
    ...createConnectorCeilingParts(tile, connectorSlots),
    {
      name: `${tile.id}-base-upper-shell`,
      geometry: createBaseUpperShellGeometry(tile, cellSizeMm, includeMagnets, connectorSlots),
    },
  ];
}

function createBaseShape(tile: TileSpec, cellSizeMm: number, includeMagnets: boolean, connectorSlots: ConnectorSlot[] = []): Shape {
  const shape = connectorSlots.length > 0
    ? createSegmentedRectangleShape(tile.widthMm, tile.depthMm, connectorSlots)
    : rectangleShape(tile.widthMm, tile.depthMm);
  addMagnetHoles(shape, tile, cellSizeMm, includeMagnets);
  return shape;
}

function createNotchedBaseShape(tile: TileSpec, cellSizeMm: number, includeMagnets: boolean, connectorSlots: ConnectorSlot[]): Shape {
  const shape = createNotchedRectangleShape(tile.widthMm, tile.depthMm, connectorSlots);
  addMagnetHoles(shape, tile, cellSizeMm, includeMagnets);
  return shape;
}

function addMagnetHoles(shape: Shape, tile: TileSpec, cellSizeMm: number, includeMagnets: boolean): void {
  if (!includeMagnets) {
    return;
  }

  forEachCellCenter(tile, cellSizeMm, (centerX, centerY) => {
    const offset = GRIDFINITY_PROFILE.magnetOffsetMm;
    const radius = GRIDFINITY_PROFILE.magnetDiameterMm / 2;
    shape.holes.push(circlePath(centerX - offset, centerY - offset, radius));
    shape.holes.push(circlePath(centerX + offset, centerY - offset, radius));
    shape.holes.push(circlePath(centerX - offset, centerY + offset, radius));
    shape.holes.push(circlePath(centerX + offset, centerY + offset, radius));
  });
}

function createBaseShellGeometry(tile: TileSpec, cellSizeMm: number, includeMagnets: boolean): BufferGeometry {
  const shape = createBaseShape(tile, cellSizeMm, includeMagnets);
  return extrudeShell(shape, GRIDFINITY_PROFILE.baseHeightMm, 0, { removeTop: true });
}

function createBaseBottomShellGeometry(
  tile: TileSpec,
  cellSizeMm: number,
  includeMagnets: boolean,
  connectorSlots: ConnectorSlot[],
): BufferGeometry {
  const shape = createNotchedBaseShape(tile, cellSizeMm, includeMagnets, connectorSlots);
  return extrudeShell(shape, GRIDFINITY_PROFILE.connectorKeyHeightMm, 0, { removeTop: true });
}

function createBaseUpperShellGeometry(
  tile: TileSpec,
  cellSizeMm: number,
  includeMagnets: boolean,
  connectorSlots: ConnectorSlot[],
): BufferGeometry {
  const shape = createBaseShape(tile, cellSizeMm, includeMagnets, connectorSlots);
  return extrudeShell(
    shape,
    GRIDFINITY_PROFILE.baseHeightMm - GRIDFINITY_PROFILE.connectorKeyHeightMm,
    GRIDFINITY_PROFILE.connectorKeyHeightMm,
    { removeBottom: true, removeTop: true },
  );
}

function createConnectorCeilingParts(tile: TileSpec, connectorSlots: ConnectorSlot[]): GeometryPart[] {
  return connectorSlots.map((slot, index) => ({
    name: `${tile.id}-connector-ceiling-${index + 1}`,
    geometry: createPlanarGeometry(createShapeFromPath(createConnectorSlotPath(slot)), GRIDFINITY_PROFILE.connectorKeyHeightMm, "down"),
  }));
}

function createSocketShellGeometry(tile: TileSpec, cellSizeMm: number, connectorSlots: ConnectorSlot[]): BufferGeometry {
  const shape = connectorSlots.length > 0
    ? createSegmentedRectangleShape(tile.widthMm, tile.depthMm, connectorSlots)
    : rectangleShape(tile.widthMm, tile.depthMm);

  addSocketOpenings(shape, tile, cellSizeMm);

  return extrudeShell(
    shape,
    GRIDFINITY_PROFILE.totalHeightMm - GRIDFINITY_PROFILE.baseHeightMm,
    GRIDFINITY_PROFILE.baseHeightMm,
    { removeBottom: true },
  );
}

function createOpenBottomFrameGeometry(tile: TileSpec, cellSizeMm: number): BufferGeometry {
  const shape = createOpenBottomShape(tile, cellSizeMm);
  return extrudeShell(shape, GRIDFINITY_PROFILE.totalHeightMm, 0, {});
}

function createOpenBottomBottomGeometry(tile: TileSpec, cellSizeMm: number, connectorSlots: ConnectorSlot[]): BufferGeometry {
  const shape = createOpenBottomShape(tile, cellSizeMm, connectorSlots, true, true);
  return extrudeShell(shape, GRIDFINITY_PROFILE.connectorKeyHeightMm, 0, { removeTop: true });
}

function createOpenBottomUpperGeometry(tile: TileSpec, cellSizeMm: number, connectorSlots: ConnectorSlot[]): BufferGeometry {
  const shape = createOpenBottomShape(tile, cellSizeMm, connectorSlots);
  return extrudeShell(
    shape,
    GRIDFINITY_PROFILE.totalHeightMm - GRIDFINITY_PROFILE.connectorKeyHeightMm,
    GRIDFINITY_PROFILE.connectorKeyHeightMm,
    { removeBottom: true },
  );
}

function createOpenBottomShape(
  tile: TileSpec,
  cellSizeMm: number,
  connectorSlots: ConnectorSlot[] = [],
  notchConnectors = false,
  keepConnectorCellsSolid = false,
): Shape {
  const shape =
    connectorSlots.length === 0
      ? rectangleShape(tile.widthMm, tile.depthMm)
      : notchConnectors
        ? createNotchedRectangleShape(tile.widthMm, tile.depthMm, connectorSlots)
        : createSegmentedRectangleShape(tile.widthMm, tile.depthMm, connectorSlots);
  addSocketOpenings(
    shape,
    tile,
    cellSizeMm,
    keepConnectorCellsSolid ? connectorSlots : [],
    cellSizeMm,
  );
  return shape;
}

function addSocketOpenings(
  shape: Shape,
  tile: TileSpec,
  cellSizeMm: number,
  solidConnectorCells: ConnectorSlot[] = [],
  connectorCellSizeMm = cellSizeMm,
): void {
  forEachCellCenter(tile, cellSizeMm, (centerX, centerY) => {
    if (isConnectorCell(centerX, centerY, solidConnectorCells, connectorCellSizeMm)) {
      return;
    }

    shape.holes.push(createSocketOpeningPath(centerX, centerY));
  });
}

function createConnectorPadFloorParts(tile: TileSpec, cellSizeMm: number, connectorSlots: ConnectorSlot[]): GeometryPart[] {
  const parts: GeometryPart[] = [];

  forEachCellCenter(tile, cellSizeMm, (centerX, centerY) => {
    if (!isConnectorCell(centerX, centerY, connectorSlots, cellSizeMm)) {
      return;
    }

    parts.push({
      name: `${tile.id}-connector-pad-floor-${parts.length + 1}`,
      geometry: createPlanarGeometry(
        createShapeFromPath(createSocketOpeningPath(centerX, centerY)),
        GRIDFINITY_PROFILE.connectorKeyHeightMm,
      ),
    });
  });

  return parts;
}

function isConnectorCell(centerX: number, centerY: number, connectorSlots: ConnectorSlot[], cellSizeMm: number): boolean {
  return connectorSlots.some((slot) => {
    const verticalSlot = slot.width < slot.depth;

    if (verticalSlot) {
      const onLeftEdge = isSameCoordinate(slot.x, 0);
      return (
        centerY >= slot.y &&
        centerY <= slot.y + slot.depth &&
        (onLeftEdge ? centerX <= slot.x + cellSizeMm : centerX >= slot.x - cellSizeMm)
      );
    }

    const onFrontEdge = isSameCoordinate(slot.y, 0);
    return (
      centerX >= slot.x &&
      centerX <= slot.x + slot.width &&
      (onFrontEdge ? centerY <= slot.y + cellSizeMm : centerY >= slot.y - cellSizeMm)
    );
  });
}

function createSocketFloorParts(tile: TileSpec, cellSizeMm: number, includeMagnets: boolean): GeometryPart[] {
  const parts: GeometryPart[] = [];

  forEachCellCenter(tile, cellSizeMm, (centerX, centerY) => {
    const shape = createShapeFromPath(createSocketOpeningPath(centerX, centerY));

    if (includeMagnets) {
      const offset = GRIDFINITY_PROFILE.magnetOffsetMm;
      const radius = GRIDFINITY_PROFILE.magnetDiameterMm / 2;
      shape.holes.push(circlePath(centerX - offset, centerY - offset, radius));
      shape.holes.push(circlePath(centerX + offset, centerY - offset, radius));
      shape.holes.push(circlePath(centerX - offset, centerY + offset, radius));
      shape.holes.push(circlePath(centerX + offset, centerY + offset, radius));
    }

    parts.push({
      name: `${tile.id}-socket-floor-${parts.length + 1}`,
      geometry: createPlanarGeometry(shape, GRIDFINITY_PROFILE.baseHeightMm),
    });
  });

  return parts;
}

function createConnectorSlots(tile: TileSpec, cellSizeMm: number): ConnectorSlot[] {
  const slots: ConnectorSlot[] = [];

  tile.splitEdges.forEach((edge) => {
    const isVertical = edge === "left" || edge === "right";
    const cellCount = isVertical ? tile.rowCount : tile.colCount;
    const count = socketCountForEdge(isVertical ? tile.depthMm : tile.widthMm);
    const positions = distributeCellIndexes(cellCount, count).map((index) => {
      const padding = isVertical ? tile.paddingMm.front : tile.paddingMm.left;
      return padding + index * cellSizeMm + cellSizeMm / 2;
    });

    positions.forEach((position) => {
      if (isVertical) {
        const x =
          edge === "left"
            ? 0
            : tile.widthMm - GRIDFINITY_PROFILE.connectorSlotWidthMm;
        slots.push({
          x,
          y: position - GRIDFINITY_PROFILE.connectorSlotLengthMm / 2,
          width: GRIDFINITY_PROFILE.connectorSlotWidthMm,
          depth: GRIDFINITY_PROFILE.connectorSlotLengthMm,
        });
      } else {
        const y =
          edge === "front"
            ? 0
            : tile.depthMm - GRIDFINITY_PROFILE.connectorSlotWidthMm;
        slots.push({
          x: position - GRIDFINITY_PROFILE.connectorSlotLengthMm / 2,
          y,
          width: GRIDFINITY_PROFILE.connectorSlotLengthMm,
          depth: GRIDFINITY_PROFILE.connectorSlotWidthMm,
        });
      }
    });
  });

  return slots.filter(
    (slot) =>
      slot.x >= 0 &&
      slot.y >= 0 &&
      slot.x + slot.width <= tile.widthMm &&
      slot.y + slot.depth <= tile.depthMm,
  );
}

function distributeCellIndexes(cellCount: number, count: number): number[] {
  if (count === 1) {
    return [Math.floor((cellCount - 1) / 2)];
  }

  return Array.from(
    new Set(
      Array.from({ length: count }, (_, index) => Math.round((index + 0.5) * (cellCount / count) - 0.5)),
    ),
  );
}

function createNotchedRectangleShape(width: number, depth: number, slots: ConnectorSlot[]): Shape {
  const frontSlots = slots.filter((slot) => isSameCoordinate(slot.y, 0)).sort((a, b) => a.x - b.x);
  const rightSlots = slots.filter((slot) => isSameCoordinate(slot.x + slot.width, width)).sort((a, b) => a.y - b.y);
  const backSlots = slots.filter((slot) => isSameCoordinate(slot.y + slot.depth, depth)).sort((a, b) => b.x - a.x);
  const leftSlots = slots.filter((slot) => isSameCoordinate(slot.x, 0)).sort((a, b) => b.y - a.y);
  const shape = new Shape();

  shape.moveTo(0, 0);
  frontSlots.forEach((slot) => {
    shape.lineTo(slot.x, 0);
    shape.lineTo(slot.x, slot.depth);
    shape.lineTo(slot.x + slot.width, slot.depth);
    shape.lineTo(slot.x + slot.width, 0);
  });

  shape.lineTo(width, 0);
  rightSlots.forEach((slot) => {
    shape.lineTo(width, slot.y);
    shape.lineTo(slot.x, slot.y);
    shape.lineTo(slot.x, slot.y + slot.depth);
    shape.lineTo(width, slot.y + slot.depth);
  });

  shape.lineTo(width, depth);
  backSlots.forEach((slot) => {
    shape.lineTo(slot.x + slot.width, depth);
    shape.lineTo(slot.x + slot.width, slot.y);
    shape.lineTo(slot.x, slot.y);
    shape.lineTo(slot.x, depth);
  });

  shape.lineTo(0, depth);
  leftSlots.forEach((slot) => {
    shape.lineTo(0, slot.y + slot.depth);
    shape.lineTo(slot.width, slot.y + slot.depth);
    shape.lineTo(slot.width, slot.y);
    shape.lineTo(0, slot.y);
  });

  shape.lineTo(0, 0);
  return shape;
}

function createSegmentedRectangleShape(width: number, depth: number, slots: ConnectorSlot[]): Shape {
  const frontSlots = slots.filter((slot) => isSameCoordinate(slot.y, 0)).sort((a, b) => a.x - b.x);
  const rightSlots = slots.filter((slot) => isSameCoordinate(slot.x + slot.width, width)).sort((a, b) => a.y - b.y);
  const backSlots = slots.filter((slot) => isSameCoordinate(slot.y + slot.depth, depth)).sort((a, b) => b.x - a.x);
  const leftSlots = slots.filter((slot) => isSameCoordinate(slot.x, 0)).sort((a, b) => b.y - a.y);
  const shape = new Shape();

  shape.moveTo(0, 0);
  frontSlots.forEach((slot) => {
    shape.lineTo(slot.x, 0);
    shape.lineTo(slot.x + slot.width, 0);
  });

  shape.lineTo(width, 0);
  rightSlots.forEach((slot) => {
    shape.lineTo(width, slot.y);
    shape.lineTo(width, slot.y + slot.depth);
  });

  shape.lineTo(width, depth);
  backSlots.forEach((slot) => {
    shape.lineTo(slot.x + slot.width, depth);
    shape.lineTo(slot.x, depth);
  });

  shape.lineTo(0, depth);
  leftSlots.forEach((slot) => {
    shape.lineTo(0, slot.y + slot.depth);
    shape.lineTo(0, slot.y);
  });

  shape.lineTo(0, 0);
  return shape;
}

function forEachCellCenter(tile: TileSpec, cellSizeMm: number, callback: (centerX: number, centerY: number) => void): void {
  for (let col = 0; col < tile.colCount; col += 1) {
    for (let row = 0; row < tile.rowCount; row += 1) {
      callback(
        tile.paddingMm.left + col * cellSizeMm + cellSizeMm / 2,
        tile.paddingMm.front + row * cellSizeMm + cellSizeMm / 2,
      );
    }
  }
}

function createSocketOpeningPath(centerX: number, centerY: number): Path {
  const size = GRIDFINITY_PROFILE.socketOpeningMm;
  return roundedRectanglePath(
    centerX - size / 2,
    centerY - size / 2,
    size,
    size,
    GRIDFINITY_PROFILE.socketCornerRadiusMm,
  );
}

function createConnectorSlotPath(slot: ConnectorSlot): Path {
  const path = new Path();
  path.moveTo(slot.x, slot.y);
  path.lineTo(slot.x + slot.width, slot.y);
  path.lineTo(slot.x + slot.width, slot.y + slot.depth);
  path.lineTo(slot.x, slot.y + slot.depth);
  path.closePath();
  return path;
}

function createShapeFromPath(path: Path): Shape {
  const points = path.getPoints(16);
  const first = points[0];
  const last = points[points.length - 1];

  if (first && last && first.distanceTo(last) < COORDINATE_EPSILON) {
    points.pop();
  }

  return new Shape(points);
}

function extrudeShell(
  shape: Shape,
  depth: number,
  zOffset: number,
  options: { removeBottom?: boolean; removeTop?: boolean },
): BufferGeometry {
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 16,
    steps: 1,
  });
  geometry.translate(0, 0, zOffset);
  return filterTriangles(geometry, (triangle) => {
    const allAtBottom = triangle.every((vertex) => isSameCoordinate(vertex.z, zOffset));
    const allAtTop = triangle.every((vertex) => isSameCoordinate(vertex.z, zOffset + depth));
    return !(options.removeBottom && allAtBottom) && !(options.removeTop && allAtTop);
  });
}

function createPlanarGeometry(shape: Shape, zOffset: number, normal: "up" | "down" = "up"): BufferGeometry {
  const geometry = new ShapeGeometry(shape, 16);
  geometry.translate(0, 0, zOffset);
  return filterTriangles(geometry, () => true, normal === "down");
}

function filterTriangles(
  geometry: BufferGeometry,
  keep: (triangle: Array<{ x: number; y: number; z: number }>) => boolean,
  reverse = false,
): BufferGeometry {
  const source = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const positions: number[] = [];

  const addTriangle = (a: number, b: number, c: number) => {
    const triangle = reverse
      ? [readVertex(source, a), readVertex(source, c), readVertex(source, b)]
      : [readVertex(source, a), readVertex(source, b), readVertex(source, c)];
    if (isDegenerateTriangle(triangle) || !keep(triangle)) {
      return;
    }

    triangle.forEach((vertex) => {
      positions.push(vertex.x, vertex.y, vertex.z);
    });
  };

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      addTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
  } else {
    for (let i = 0; i < source.count; i += 3) {
      addTriangle(i, i + 1, i + 2);
    }
  }

  const filtered = new BufferGeometry();
  filtered.setAttribute("position", new Float32BufferAttribute(positions, 3));
  filtered.computeVertexNormals();
  return filtered;
}

function readVertex(source: PositionAttribute, index: number): { x: number; y: number; z: number } {
  return {
    x: source.getX(index),
    y: source.getY(index),
    z: source.getZ(index),
  };
}

function isSameCoordinate(value: number, target: number): boolean {
  return Math.abs(value - target) < COORDINATE_EPSILON;
}

function isDegenerateTriangle(triangle: Array<{ x: number; y: number; z: number }>): boolean {
  const [a, b, c] = triangle;
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const uz = b.z - a.z;
  const vx = c.x - a.x;
  const vy = c.y - a.y;
  const vz = c.z - a.z;
  const cx = uy * vz - uz * vy;
  const cy = uz * vx - ux * vz;
  const cz = ux * vy - uy * vx;

  return cx * cx + cy * cy + cz * cz < AREA_EPSILON;
}
