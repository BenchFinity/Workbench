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

const connectorEdgeIntervalMm = 96;
const connectorKeyMarginMm = 20;
const connectorKeySpacingMm = 24;

export function socketCountForEdge(edgeLengthMm: number): number {
  return Math.max(1, Math.floor(edgeLengthMm / connectorEdgeIntervalMm));
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
    Math.floor((bedWidthMm - connectorKeyMarginMm * 2 - keyWidthMm) / connectorKeySpacingMm) + 1,
  );
  const rows = Math.ceil(count / columns);
  const placements = Array.from({ length: count }, (_, index) => ({
    x: connectorKeyMarginMm + (index % columns) * connectorKeySpacingMm,
    y: connectorKeyMarginMm + Math.floor(index / columns) * connectorKeySpacingMm,
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
