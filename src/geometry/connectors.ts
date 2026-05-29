import type { PlateLayout } from "./types";

export type ConnectorKeyPlacement = {
  x: number;
  y: number;
  z: number;
};

export type ConnectorKeyLayout = {
  placements: ConnectorKeyPlacement[];
  fits: boolean;
  columns: number;
  rows: number;
};

// At most one connector key per ~96mm of split edge: a cadence chosen for key
// strength and print economy, not tied to the 42mm Gridfinity cell pitch.
const CONNECTOR_EDGE_INTERVAL_MM = 96;
const CONNECTOR_KEY_MARGIN_MM = 20;
const CONNECTOR_KEY_SPACING_MM = 24;

export function socketCountForEdge(edgeLengthMm: number): number {
  return Math.max(1, Math.floor(edgeLengthMm / CONNECTOR_EDGE_INTERVAL_MM));
}

export function connectorKeyCount(layout: PlateLayout): number {
  return layout.tiles.reduce((count, tile) => {
    const rightEdgeKeys = tile.splitEdges.includes("right") ? socketCountForEdge(tile.depthMm) : 0;
    const backEdgeKeys = tile.splitEdges.includes("back") ? socketCountForEdge(tile.widthMm) : 0;
    return count + rightEdgeKeys + backEdgeKeys;
  }, 0);
}

export function planConnectorKeyLayout({
  count,
  keyWidthMm,
  keyDepthMm,
  bedWidthMm,
  bedDepthMm,
}: {
  count: number;
  keyWidthMm: number;
  keyDepthMm: number;
  bedWidthMm: number;
  bedDepthMm: number;
}): ConnectorKeyLayout {
  if (count === 0) {
    return {
      placements: [],
      fits: true,
      columns: 0,
      rows: 0,
    };
  }

  const columns = Math.max(
    1,
    Math.floor((bedWidthMm - CONNECTOR_KEY_MARGIN_MM * 2 - keyWidthMm) / CONNECTOR_KEY_SPACING_MM) + 1,
  );
  const rows = Math.ceil(count / columns);
  const placements = Array.from({ length: count }, (_, index) => ({
    x: CONNECTOR_KEY_MARGIN_MM + (index % columns) * CONNECTOR_KEY_SPACING_MM,
    y: CONNECTOR_KEY_MARGIN_MM + Math.floor(index / columns) * CONNECTOR_KEY_SPACING_MM,
    z: 0,
  }));
  const fits = placements.every(
    (placement) => placement.x + keyWidthMm <= bedWidthMm && placement.y + keyDepthMm <= bedDepthMm,
  );

  return {
    placements,
    fits,
    columns,
    rows,
  };
}
