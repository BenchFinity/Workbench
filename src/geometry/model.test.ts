import { Box3, BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { deriveLayout } from "./layout";
import { createConnectorKeyPart, createPlateModels } from "./model";
import { GRIDFINITY_PROFILE } from "./profile";
import type { GeometryPart, PlateInput } from "./types";

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

describe("createPlateModels", () => {
  it("generates manifold tile meshes for STL export", () => {
    const layout = deriveLayout(splitInput);
    const models = createPlateModels(layout, splitInput);

    models.forEach((model) => {
      expect(countNonManifoldEdges(model.parts), model.tile.id).toBe(0);
    });
  });

  it("generates manifold open-bottom tile meshes", () => {
    const input = {
      ...splitInput,
      openBottom: true,
    };
    const layout = deriveLayout(input);
    const models = createPlateModels(layout, input);

    models.forEach((model) => {
      expect(countNonManifoldEdges(model.parts), model.tile.id).toBe(0);
    });
  });

  it("keeps open-bottom connector notches backed by edge-cell pads", () => {
    const input = {
      ...splitInput,
      openBottom: true,
    };
    const layout = deriveLayout(input);
    const model = createPlateModels(layout, input).find((candidate) => candidate.tile.id === "r1-c1");

    expect(model).toBeDefined();

    const ceilingParts = model?.parts.filter((part) => part.name.includes("connector-ceiling")) ?? [];
    const padFloorParts = model?.parts.filter((part) => part.name.includes("connector-pad-floor")) ?? [];
    const padFloorBoxes = padFloorParts.map((part) => geometryBox(part.geometry));

    expect(ceilingParts).toHaveLength(2);
    expect(padFloorParts).toHaveLength(ceilingParts.length);
    expect(
      padFloorBoxes.some((box) => box.max.x > (model?.tile.widthMm ?? 0) - input.cellSizeMm),
    ).toBe(true);
    expect(
      padFloorBoxes.some((box) => box.max.y > (model?.tile.depthMm ?? 0) - input.cellSizeMm),
    ).toBe(true);

    padFloorBoxes.forEach((box) => {
      expect(box.min.z).toBeCloseTo(GRIDFINITY_PROFILE.connectorKeyHeightMm);
      expect(box.max.z).toBeCloseTo(GRIDFINITY_PROFILE.connectorKeyHeightMm);
    });
  });

  it("matches the connector key to the underside notch dimensions", () => {
    const box = geometryBox(createConnectorKeyPart().geometry);

    expect(box.max.x - box.min.x).toBeCloseTo(GRIDFINITY_PROFILE.connectorSlotWidthMm * 2);
    expect(box.max.y - box.min.y).toBeCloseTo(GRIDFINITY_PROFILE.connectorSlotLengthMm);
    expect(box.max.z - box.min.z).toBeCloseTo(GRIDFINITY_PROFILE.connectorKeyHeightMm);
  });
});

function geometryBox(geometry: BufferGeometry): Box3 {
  geometry.computeBoundingBox();

  if (!geometry.boundingBox) {
    throw new Error("Geometry did not produce a bounding box.");
  }

  return geometry.boundingBox.clone();
}

function countNonManifoldEdges(parts: GeometryPart[]): number {
  const edges = new Map<string, number>();

  parts.forEach((part) => {
    addGeometryEdges(part.geometry, edges);
  });

  return Array.from(edges.values()).filter((count) => count !== 2).length;
}

function addGeometryEdges(geometry: BufferGeometry, edges: Map<string, number>): void {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const addTriangle = (a: number, b: number, c: number) => {
    addEdge(
      edges,
      vertexKey(position.getX(a), position.getY(a), position.getZ(a)),
      vertexKey(position.getX(b), position.getY(b), position.getZ(b)),
    );
    addEdge(
      edges,
      vertexKey(position.getX(b), position.getY(b), position.getZ(b)),
      vertexKey(position.getX(c), position.getY(c), position.getZ(c)),
    );
    addEdge(
      edges,
      vertexKey(position.getX(c), position.getY(c), position.getZ(c)),
      vertexKey(position.getX(a), position.getY(a), position.getZ(a)),
    );
  };

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      addTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
    return;
  }

  for (let i = 0; i < position.count; i += 3) {
    addTriangle(i, i + 1, i + 2);
  }
}

function addEdge(edges: Map<string, number>, a: string, b: string): void {
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  edges.set(key, (edges.get(key) ?? 0) + 1);
}

function vertexKey(x: number, y: number, z: number): string {
  return [x, y, z].map((value) => value.toFixed(4)).join(",");
}
