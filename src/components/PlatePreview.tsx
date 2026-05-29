import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { PlateLayout, TileModel } from "../geometry/types";

type PlatePreviewProps = {
  layout: PlateLayout;
  models: TileModel[];
  exploded: boolean;
};

const TILE_COLORS = ["#88b9a6", "#d8a269", "#8ea8c8", "#c9898a"];

export function PlatePreview({ layout, models, exploded }: PlatePreviewProps) {
  if (layout.errors.length > 0) {
    return (
      <div className="preview-empty">
        <span>Preview unavailable</span>
      </div>
    );
  }

  return (
    <Canvas className="preview-canvas" camera={{ fov: 42, near: 1, far: 5000 }}>
      <SceneCamera layout={layout} />
      <color attach="background" args={["#f4f6f2"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[220, -180, 320]} intensity={1.3} />
      <directionalLight position={[-160, 180, 180]} intensity={0.6} />
      <PlateScene layout={layout} models={models} exploded={exploded} />
      <OrbitControls makeDefault enablePan enableZoom enableRotate />
    </Canvas>
  );
}

function SceneCamera({ layout }: { layout: PlateLayout }) {
  const { camera } = useThree();

  useEffect(() => {
    const maxDimension = Math.max(
      layout.targetWidthMm,
      layout.targetDepthMm,
      layout.printableWidthMm,
      layout.printableDepthMm,
    );
    camera.up.set(0, 0, 1);
    camera.position.set(maxDimension * 0.65, -maxDimension * 0.95, maxDimension * 0.62);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, layout.printableDepthMm, layout.printableWidthMm, layout.targetDepthMm, layout.targetWidthMm]);

  return null;
}

function PlateScene({ layout, models, exploded }: PlatePreviewProps) {
  const maxColIndex = Math.max(...layout.tiles.map((tile) => tile.colIndex), 0);
  const maxRowIndex = Math.max(...layout.tiles.map((tile) => tile.rowIndex), 0);
  const explodeGap = exploded ? Math.max(8, layout.cellSizeMm * 0.22) : 0;

  return (
    <group position={[-layout.targetWidthMm / 2, -layout.targetDepthMm / 2, 0]}>
      <BedOutline layout={layout} />
      {models.map((model, index) => {
        const tile = model.tile;
        const explodeX = (tile.colIndex - maxColIndex / 2) * explodeGap;
        const explodeY = (tile.rowIndex - maxRowIndex / 2) * explodeGap;
        const color = TILE_COLORS[index % TILE_COLORS.length];

        return (
          <group key={tile.id} position={[tile.originMm.x + explodeX, tile.originMm.y + explodeY, 0]}>
            {model.parts.map((part) => (
              <mesh key={part.name} geometry={part.geometry} castShadow receiveShadow>
                <meshStandardMaterial color={color} roughness={0.62} metalness={0.03} />
              </mesh>
            ))}
            <Html position={[tile.widthMm / 2, tile.depthMm / 2, 7]} center className="tile-label">
              {tile.id}
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function BedOutline({ layout }: { layout: PlateLayout }) {
  const x0 = (layout.targetWidthMm - layout.printableWidthMm) / 2;
  const y0 = (layout.targetDepthMm - layout.printableDepthMm) / 2;
  const x1 = x0 + layout.printableWidthMm;
  const y1 = y0 + layout.printableDepthMm;

  return (
    <Line
      points={[
        [x0, y0, 0.15],
        [x1, y0, 0.15],
        [x1, y1, 0.15],
        [x0, y1, 0.15],
        [x0, y0, 0.15],
      ]}
      color="#d15f54"
      lineWidth={1.4}
      dashed
      dashSize={8}
      gapSize={5}
    />
  );
}
