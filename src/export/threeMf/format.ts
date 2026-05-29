import type { VectorLike } from "./types";

export function formatTranslationTransform(translation: VectorLike): string {
  return `1 0 0 0 1 0 0 0 1 ${formatNumber(translation.x)} ${formatNumber(translation.y)} ${formatNumber(translation.z)}`;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot write non-finite coordinate ${value} to 3MF.`);
  }

  // Values below half the 6-decimal rounding step snap to 0, so coordinates that
  // would print as "-0" or rounding noise emit a clean 0 in the 3MF.
  const normalized = Math.abs(value) < 0.0000005 ? 0 : value;
  return Number(normalized.toFixed(6)).toString();
}

export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    switch (character) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return character;
    }
  });
}
