import { useEffect, useMemo, useState } from "react";
import { PlateControls } from "./components/PlateControls";
import { SettingsDialog } from "./components/SettingsDialog";
import { WorkspacePanel } from "./components/WorkspacePanel";
import { createConnectorKeyObjects } from "./export/connectorKeyObjects";
import { createExportBlob, exportFileExtension, exportStatusLabel, type ExportFormat } from "./export/createExportBlob";
import { triggerDownload, type DownloadInfo } from "./export/download";
import { buildExportFilename } from "./export/filenames";
import { createConnectorKeyPart, createPlateModels } from "./geometry/model";
import { deriveLayout } from "./geometry/layout";
import type { PlateInput } from "./geometry/types";
import { CUSTOM_PRINTER_ID, findPrinterPreset, groupPrintersByBrand } from "./printers";
import { FACTORY_DEFAULTS, loadSavedDefaults, saveDefaults, type AppDefaults } from "./settings";
import { validateExport } from "./validation";

export function App() {
  const initialDefaults = useMemo(() => loadSavedDefaults(), []);
  const [savedDefaults, setSavedDefaults] = useState<AppDefaults>(initialDefaults);
  const [draftDefaults, setDraftDefaults] = useState<AppDefaults>(initialDefaults);
  const [input, setInput] = useState<PlateInput>(initialDefaults.input);
  const [selectedPrinterId, setSelectedPrinterId] = useState(initialDefaults.selectedPrinterId);
  const [exploded, setExploded] = useState(initialDefaults.exploded);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [downloadInfo, setDownloadInfo] = useState<DownloadInfo | null>(null);

  const layout = useMemo(() => deriveLayout(input), [input]);
  const models = useMemo(() => (layout.errors.length > 0 ? [] : createPlateModels(layout, input)), [input, layout]);
  const validation = useMemo(() => validateExport(input, layout), [input, layout]);
  const connectorKey = useMemo(() => createConnectorKeyPart(), []);
  const printerGroups = useMemo(() => groupPrintersByBrand(), []);
  const canExport = validation.isValid && models.length > 0 && !exporting;
  const isCustomPrinter = selectedPrinterId === CUSTOM_PRINTER_ID;

  useEffect(() => {
    return () => {
      if (downloadInfo) {
        URL.revokeObjectURL(downloadInfo.url);
      }
    };
  }, [downloadInfo]);

  const updateInput = (patch: Partial<PlateInput>) => {
    setInput((current) => ({ ...current, ...patch }));
    setStatus(null);
    setDownloadInfo(null);
  };

  const updatePrinter = (printerId: string) => {
    setSelectedPrinterId(printerId);
    setStatus(null);
    setDownloadInfo(null);

    const preset = findPrinterPreset(printerId);

    if (preset) {
      setInput((current) => ({
        ...current,
        bedWidth: preset.bedWidth,
        bedDepth: preset.bedDepth,
        bedUnit: preset.unit,
      }));
    }
  };

  const reset = () => {
    applyDefaults(savedDefaults);
    setStatus(null);
    setDownloadInfo(null);
  };

  const openSettings = () => {
    setDraftDefaults(savedDefaults);
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  const applyDefaults = (defaults: AppDefaults) => {
    setSelectedPrinterId(defaults.selectedPrinterId);
    setInput(defaults.input);
    setExploded(defaults.exploded);
  };

  const saveDefaultSettings = () => {
    const saved = saveDefaults(draftDefaults);
    setSavedDefaults(saved);
    applyDefaults(saved);
    setSettingsOpen(false);
    setStatus("Defaults saved.");
    setDownloadInfo(null);
  };

  const useCurrentAsDefaults = () => {
    setDraftDefaults({
      input,
      selectedPrinterId,
      exploded,
    });
  };

  const restoreFactoryDefaults = () => {
    setDraftDefaults(FACTORY_DEFAULTS);
  };

  const exportFiles = async (format: ExportFormat) => {
    if (!canExport) {
      setStatus("Resolve validation errors before export.");
      return;
    }

    setExporting(true);
    setStatus(null);

    try {
      const exportFilename = buildExportFilename(input.projectName, layout.cols, layout.rows, exportFileExtension(format, models));
      const blob = await createExportBlob({
        format,
        input,
        layout,
        models,
        connectorKey,
        additionalObjects: createConnectorKeyObjects(input, layout, connectorKey),
      });

      const url = URL.createObjectURL(blob);
      setDownloadInfo({
        filename: exportFilename,
        url,
        size: blob.size,
      });
      triggerDownload(url, exportFilename);
      setStatus(`${exportStatusLabel(format, models)} ready.`);
    } catch (error) {
      setDownloadInfo(null);
      setStatus(`Export failed: ${error instanceof Error ? error.message : "Unknown error."}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-shell">
      <main className="app-shell">
        <PlateControls
          input={input}
          layout={layout}
          printerGroups={printerGroups}
          selectedPrinterId={selectedPrinterId}
          isCustomPrinter={isCustomPrinter}
          exploded={exploded}
          canExport={canExport}
          validationErrors={validation.errors}
          warnings={layout.warnings}
          modelCount={models.length}
          downloadInfo={downloadInfo}
          status={status}
          onInputChange={updateInput}
          onPrinterChange={updatePrinter}
          onExplodedChange={setExploded}
          onOpenSettings={openSettings}
          onReset={reset}
          onExport={exportFiles}
        />

        <WorkspacePanel input={input} layout={layout} models={models} exploded={exploded} />
      </main>
      <footer className="app-footer">
        <span>Benchfinity</span>
        <span>
          <a href="https://www.benchfinity.com" target="_blank" rel="noreferrer">
            benchfinity.com
          </a>
        </span>
      </footer>
      <SettingsDialog
        open={settingsOpen}
        draft={draftDefaults}
        printerGroups={printerGroups}
        onClose={closeSettings}
        onDraftChange={setDraftDefaults}
        onFactoryDefaults={restoreFactoryDefaults}
        onSave={saveDefaultSettings}
        onUseCurrent={useCurrentAsDefaults}
      />
    </div>
  );
}
