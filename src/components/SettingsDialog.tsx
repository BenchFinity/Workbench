import { X } from "lucide-react";
import type { PlateInput } from "../geometry/types";
import { CUSTOM_PRINTER_ID, findPrinterPreset, type PrinterGroup } from "../printers";
import type { AppDefaults } from "../settings";
import { NumberField, TextField, UnitSegment } from "./FormControls";

export function SettingsDialog({
  open,
  draft,
  printerGroups,
  onClose,
  onDraftChange,
  onFactoryDefaults,
  onSave,
  onUseCurrent,
}: {
  open: boolean;
  draft: AppDefaults;
  printerGroups: PrinterGroup[];
  onClose: () => void;
  onDraftChange: (defaults: AppDefaults) => void;
  onFactoryDefaults: () => void;
  onSave: () => void;
  onUseCurrent: () => void;
}) {
  if (!open) {
    return null;
  }

  const isCustomPrinter = draft.selectedPrinterId === CUSTOM_PRINTER_ID;
  const updateDraftInput = (patch: Partial<PlateInput>) => {
    onDraftChange({
      ...draft,
      input: {
        ...draft.input,
        ...patch,
      },
    });
  };
  const updateDraftPrinter = (printerId: string) => {
    const preset = findPrinterPreset(printerId);

    onDraftChange({
      ...draft,
      selectedPrinterId: printerId,
      input: preset
        ? {
            ...draft.input,
            bedWidth: preset.bedWidth,
            bedDepth: preset.bedDepth,
            bedUnit: preset.unit,
          }
        : draft.input,
    });
  };

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="dialog-header">
          <h2 id="settings-title">Default Settings</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close settings">
            <X size={17} />
          </button>
        </div>

        <div className="settings-body">
          <fieldset>
            <legend>Project</legend>
            <TextField label="Default name" value={draft.input.projectName} onChange={(projectName) => updateDraftInput({ projectName })} />
          </fieldset>

          <fieldset>
            <legend>Finished Size</legend>
            <div className="two-col">
              <NumberField label="Width" value={draft.input.finishedWidth} onChange={(finishedWidth) => updateDraftInput({ finishedWidth })} />
              <NumberField label="Depth" value={draft.input.finishedDepth} onChange={(finishedDepth) => updateDraftInput({ finishedDepth })} />
            </div>
            <UnitSegment value={draft.input.finishedUnit} onChange={(finishedUnit) => updateDraftInput({ finishedUnit })} />
          </fieldset>

          <fieldset>
            <legend>Printer Bed</legend>
            <label className="field">
              <span>Printer</span>
              <select value={draft.selectedPrinterId} onChange={(event) => updateDraftPrinter(event.target.value)}>
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
              <NumberField label="Width" value={draft.input.bedWidth} disabled={!isCustomPrinter} onChange={(bedWidth) => updateDraftInput({ bedWidth })} />
              <NumberField label="Depth" value={draft.input.bedDepth} disabled={!isCustomPrinter} onChange={(bedDepth) => updateDraftInput({ bedDepth })} />
            </div>
            <UnitSegment value={draft.input.bedUnit} disabled={!isCustomPrinter} onChange={(bedUnit) => updateDraftInput({ bedUnit })} />
            <NumberField label="Print margin, mm" value={draft.input.printMarginMm} step={0.5} onChange={(printMarginMm) => updateDraftInput({ printMarginMm })} />
          </fieldset>

          <fieldset>
            <legend>Gridfinity</legend>
            <NumberField label="Cell pitch, mm" value={draft.input.cellSizeMm} step={0.5} onChange={(cellSizeMm) => updateDraftInput({ cellSizeMm })} />
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={draft.input.includeMagnets}
                onChange={(event) => updateDraftInput({ includeMagnets: event.target.checked })}
              />
              <span>6 x 2mm magnet pockets</span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={draft.input.openBottom}
                onChange={(event) => updateDraftInput({ openBottom: event.target.checked })}
              />
              <span>Open-bottom lightweight grid</span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={draft.exploded}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    exploded: event.target.checked,
                  })
                }
              />
              <span>Exploded tile view</span>
            </label>
          </fieldset>
        </div>

        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onUseCurrent}>
            Use Current
          </button>
          <button className="secondary-button" type="button" onClick={onFactoryDefaults}>
            Factory
          </button>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button compact" type="button" onClick={onSave}>
            Save Defaults
          </button>
        </div>
      </section>
    </div>
  );
}
