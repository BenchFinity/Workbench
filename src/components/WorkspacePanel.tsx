import { formatMm } from "../displayFormat";
import type { PlateInput, PlateLayout, TileModel } from "../geometry/types";
import { PlatePreview } from "./PlatePreview";

export function WorkspacePanel({
  input,
  layout,
  models,
  exploded,
}: {
  input: PlateInput;
  layout: PlateLayout;
  models: TileModel[];
  exploded: boolean;
}) {
  return (
    <section className="workspace-panel" aria-label="3D preview">
      <div className="preview-header">
        <div>
          <h2>3D Preview</h2>
          <p>{previewSubtitle(input, layout.tiles.length)}</p>
        </div>
        <div className="compatibility-pill">Tracefinity compatible</div>
      </div>
      <div className="preview-frame">
        <PlatePreview layout={layout} models={models} exploded={exploded} />
      </div>
      <TileTable layout={layout} />
    </section>
  );
}

function previewSubtitle(input: PlateInput, tileCount: number): string {
  if (input.openBottom) {
    return tileCount > 1 ? "Split lightweight grid with underside connector notches" : "Open-bottom lightweight grid";
  }

  return tileCount > 1 ? "Split plate with underside connector notches" : "Single printable plate";
}

function TileTable({ layout }: { layout: PlateLayout }) {
  if (layout.errors.length > 0 || layout.tiles.length === 0) {
    return null;
  }

  return (
    <div className="tile-table">
      <div className="tile-table-head">
        <span>Tile</span>
        <span>Cells</span>
        <span>Size</span>
        <span>Edges</span>
      </div>
      {layout.tiles.map((tile) => (
        <div className="tile-table-row" key={tile.id}>
          <span>{tile.id}</span>
          <span>
            {tile.colCount} x {tile.rowCount}
          </span>
          <span>
            {formatMm(tile.widthMm)} x {formatMm(tile.depthMm)}
          </span>
          <span>{tile.splitEdges.length > 0 ? tile.splitEdges.join(", ") : "none"}</span>
        </div>
      ))}
    </div>
  );
}
