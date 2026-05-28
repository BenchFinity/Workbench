export function formatMm(value: number): string {
  if (!Number.isFinite(value)) {
    return "0mm";
  }

  return `${Number(value.toFixed(2))}mm`;
}

export function formatBytes(value: number): string {
  if (value < 1024 * 1024) {
    return `${Math.ceil(value / 1024)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
