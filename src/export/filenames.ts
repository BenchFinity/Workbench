const FALLBACK_NAME = "benchfinity-baseplate";

export type ExportExtension = "stl" | "zip" | "3mf";

export function buildExportFilename(projectName: string, cols: number, rows: number, extension: ExportExtension): string {
  const baseName = sanitizeFilenamePart(projectName);

  if (!baseName) {
    return `${FALLBACK_NAME}-${cols}x${rows}.${extension}`;
  }

  return `${baseName}-gridfinity-${cols}x${rows}.${extension}`;
}

export function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
