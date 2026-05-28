import { Matrix4, Vector3 } from "three";
import type { BufferAttribute, BufferGeometry, InterleavedBufferAttribute } from "three";
import type { GeometryPart, TileModel } from "../../geometry/types";
import { formatNumber } from "./format";
import type { GeometryBounds, ThreeMfMesh, VectorLike } from "./types";

type PositionAttribute = BufferAttribute | InterleavedBufferAttribute;

const areaEpsilon = 0.000001;

export function createMesh(
  parts: GeometryPart[],
  meshTranslationMm: VectorLike = { x: 0, y: 0, z: 0 },
  rotationDeg = 0,
): ThreeMfMesh {
  const mesh: ThreeMfMesh = {
    vertices: [],
    triangles: [],
  };
  const vertexIndexes = new Map<string, number>();
  const transform = createVertexTransform(meshTranslationMm, rotationDeg);

  parts.forEach((part) => appendGeometry(mesh, vertexIndexes, part.geometry, transform, part.name));
  return mesh;
}

export function geometryBounds(parts: GeometryPart[]): GeometryBounds {
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    minZ: Number.POSITIVE_INFINITY,
  };

  parts.forEach((part) => {
    const position = part.geometry.getAttribute("position") as PositionAttribute | undefined;

    if (!position || position.itemSize < 3) {
      throw new Error(`Geometry part "${part.name}" does not have a usable position attribute.`);
    }

    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const y = position.getY(index);
      const z = position.getZ(index);
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
      bounds.minZ = Math.min(bounds.minZ, z);
    }
  });

  if (!Number.isFinite(bounds.minX)) {
    throw new Error("Cannot create a 3MF package without usable vertices.");
  }

  return bounds;
}

export function maxModelSize(models: TileModel[], axis: "width" | "depth"): number | undefined {
  if (models.length === 0) {
    return undefined;
  }

  return Math.max(...models.map((model) => (axis === "width" ? model.tile.widthMm : model.tile.depthMm)));
}

function appendGeometry(
  mesh: ThreeMfMesh,
  vertexIndexes: Map<string, number>,
  geometry: BufferGeometry,
  transform: Matrix4,
  partName: string,
): void {
  const position = geometry.getAttribute("position");

  if (!position || position.itemSize < 3) {
    throw new Error(`Geometry part "${partName}" does not have a usable position attribute.`);
  }

  const index = geometry.getIndex();
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const ab = new Vector3();
  const ac = new Vector3();

  const addTriangle = (ia: number, ib: number, ic: number) => {
    a.fromBufferAttribute(position, ia).applyMatrix4(transform);
    b.fromBufferAttribute(position, ib).applyMatrix4(transform);
    c.fromBufferAttribute(position, ic).applyMatrix4(transform);

    if (ab.subVectors(b, a).cross(ac.subVectors(c, a)).lengthSq() <= areaEpsilon) {
      return;
    }

    const v1 = addVertex(mesh, vertexIndexes, a);
    const v2 = addVertex(mesh, vertexIndexes, b);
    const v3 = addVertex(mesh, vertexIndexes, c);

    if (v1 !== v2 && v1 !== v3 && v2 !== v3) {
      mesh.triangles.push({ v1, v2, v3 });
    }
  };

  if (index) {
    for (let i = 0; i + 2 < index.count; i += 3) {
      addTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
    return;
  }

  for (let i = 0; i + 2 < position.count; i += 3) {
    addTriangle(i, i + 1, i + 2);
  }
}

function addVertex(mesh: ThreeMfMesh, vertexIndexes: Map<string, number>, vector: Vector3): number {
  const vertex = {
    x: formatNumber(vector.x),
    y: formatNumber(vector.y),
    z: formatNumber(vector.z),
  };
  const key = `${vertex.x},${vertex.y},${vertex.z}`;
  const existing = vertexIndexes.get(key);

  if (existing !== undefined) {
    return existing;
  }

  const index = mesh.vertices.length;
  mesh.vertices.push(vertex);
  vertexIndexes.set(key, index);
  return index;
}

function createVertexTransform(meshTranslationMm: VectorLike, rotationDeg: number): Matrix4 {
  const radians = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const transformedOriginX = meshTranslationMm.x * cos - meshTranslationMm.y * sin;
  const transformedOriginY = meshTranslationMm.x * sin + meshTranslationMm.y * cos;

  return new Matrix4().set(
    cos,
    -sin,
    0,
    transformedOriginX,
    sin,
    cos,
    0,
    transformedOriginY,
    0,
    0,
    1,
    meshTranslationMm.z,
    0,
    0,
    0,
    1,
  );
}
