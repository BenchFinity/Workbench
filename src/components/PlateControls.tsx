import { Download, Package, RotateCcw, Settings } from "lucide-react";
import { formatBytes, formatMm } from "../displayFormat";
import type { DownloadInfo } from "../export/download";
import type { ExportFormat } from "../export/createExportBlob";
import type { PlateInput, PlateLayout } from "../geometry/types";
import { CUSTOM_PRINTER_ID, type PrinterGroup } from "../printers";
import { NumberField, TextField, UnitSegment } from "./FormControls";

export function PlateControls({
  input,
  layout,
  printerGroups,
  selectedPrinterId,
  isCustomPrinter,
  exploded,
  canExport,
  validationErrors,
  warnings,
  modelCount,
  downloadInfo,
  status,
  onInputChange,
  onPrinterChange,
  onExplodedChange,
  onOpenSettings,
  onReset,
  onExport,
}: {
  input: PlateInput;
  layout: PlateLayout;
  printerGroups: PrinterGroup[];
  selectedPrinterId: string;
  isCustomPrinter: boolean;
  exploded: boolean;
  canExport: boolean;
  validationErrors: string[];
  warnings: string[];
  modelCount: number;
  downloadInfo: DownloadInfo | null;
  status: string | null;
  onInputChange: (patch: Partial<PlateInput>) => void;
  onPrinterChange: (printerId: string) => void;
  onExplodedChange: (exploded: boolean) => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onExport: (format: ExportFormat) => void;
}) {
  return (
    <section className="control-panel" aria-label="Plate controls">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Tracefinity preset</p>
          <h1>Benchfinity</h1>
        </div>
        <div className="header-actions">
          <button className="icon-button" type="button" onClick={onOpenSettings} aria-label="Open settings">
            <Settings size={17} />
          </button>
          <button className="icon-button" type="button" onClick={onReset} aria-label="Reset inputs">
            <RotateCcw size={17} />
          </button>
        </div>
      </div>

      <fieldset>
        <legend>Project</legend>
        <TextField label="Name" value={input.projectName} onChange={(projectName) => onInputChange({ projectName })} />
      </fieldset>

      <fieldset>
        <legend>Finished Size</legend>
        <div className="two-col">
          <NumberField
            label="Width"
            value={input.finishedWidth}
            onChange={(finishedWidth) => onInputChange({ finishedWidth })}
          />
          <NumberField
            label="Depth"
            value={input.finishedDepth}
            onChange={(finishedDepth) => onInputChange({ finishedDepth })}
          />
        </div>
        <UnitSegment value={input.finishedUnit} onChange={(finishedUnit) => onInputChange({ finishedUnit })} />
      </fieldset>

      <fieldset>
        <legend>Printer Bed</legend>
        <label className="field">
          <span>Printer</span>
          <select value={selectedPrinterId} onChange={(event) => onPrinterChange(event.target.value)}>
            {printerGroups.map((group) => (
              <optgroup key={group.brand} label={group.brand}>
                {group.presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={CUSTOM_PRINTER_ID}>Custom</option>
          </select>
        </label>
        <div className="two-col">
          <NumberField
            label="Width"
            value={input.bedWidth}
            disabled={!isCustomPrinter}
            onChange={(bedWidth) => onInputChange({ bedWidth })}
          />
          <NumberField
            label="Depth"
            value={input.bedDepth}
            disabled={!isCustomPrinter}
            onChange={(bedDepth) => onInputChange({ bedDepth })}
          />
        </div>
        <UnitSegment
          value={input.bedUnit}
          disabled={!isCustomPrinter}
          onChange={(bedUnit) => onInputChange({ bedUnit })}
        />
        <NumberField
          label="Print margin, mm"
          value={input.printMarginMm}
          step={0.5}
          onChange={(printMarginMm) => onInputChange({ printMarginMm })}
        />
      </fieldset>

      <fieldset>
        <legend>Gridfinity</legend>
        <NumberField
          label="Cell pitch, mm"
          value={input.cellSizeMm}
          step={0.5}
          onChange={(cellSizeMm) => onInputChange({ cellSizeMm })}
        />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={input.includeMagnets}
            onChange={(event) => onInputChange({ includeMagnets: event.target.checked })}
          />
          <span>6 x 2mm magnet pockets</span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={input.openBottom}
            onChange={(event) => onInputChange({ openBottom: event.target.checked })}
          />
          <span>Open-bottom lightweight grid</span>
        </label>
        <label className="toggle-row">
          <input type="checkbox" checked={exploded} onChange={(event) => onExplodedChange(event.target.checked)} />
          <span>Exploded tile view</span>
        </label>
      </fieldset>

      <section className="summary-panel" aria-label="Generated plate summary">
        <SummaryRow label="Grid" value={`${layout.cols} x ${layout.rows}`} />
        <SummaryRow label="Finished" value={`${formatMm(layout.targetWidthMm)} x ${formatMm(layout.targetDepthMm)}`} />
        <SummaryRow label="Grid area" value={`${formatMm(layout.gridWidthMm)} x ${formatMm(layout.gridDepthMm)}`} />
        <SummaryRow
          label="Padding"
          value={`${formatMm(layout.paddingMm.left)} / ${formatMm(layout.paddingMm.front)}`}
        />
        <SummaryRow label="Tiles" value={`${layout.tiles.length}`} />
      </section>

      <Messages className="message-list error-list" messages={validationErrors} />
      <Messages className="message-list warning-list" messages={warnings} />

      <div className="export-actions">
        <button
          className="primary-button"
          type="button"
          onClick={() => onExport("3mf")}
          disabled={!canExport}
          title={validationErrors[0] ?? undefined}
        >
          <Package size={18} />
          <span>Export 3MF</span>
        </button>
        <button
          className="secondary-button wide-button"
          type="button"
          onClick={() => onExport("mesh")}
          disabled={!canExport}
          title={validationErrors[0] ?? undefined}
        >
          {modelCount > 1 ? <Package size={18} /> : <Download size={18} />}
          <span>{modelCount > 1 ? "Export ZIP" : "Export STL"}</span>
        </button>
      </div>

      {downloadInfo && (
        <a className="download-link" href={downloadInfo.url} download={downloadInfo.filename}>
          <Download size={16} />
          <span>
            Download {downloadInfo.filename}
            <small>{formatBytes(downloadInfo.size)}</small>
          </span>
        </a>
      )}
      {status && <p className="status-text">{status}</p>}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Messages({ className, messages }: { className: string; messages: string[] }) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
