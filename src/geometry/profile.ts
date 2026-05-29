export const GRIDFINITY_PROFILE = {
  name: "Benchfinity standard Gridfinity baseplate",
  // Tracefinity is the external Gridfinity-compatibility reference Benchfinity
  // validates against; this profile is Benchfinity's own, not Tracefinity's.
  compatibilityStandard: "Tracefinity",
  compatibilityRelease: "0.4.0",
  compatibilityReleaseDate: "2026-05-26",
  defaultCellSizeMm: 42,
  totalHeightMm: 5,
  baseHeightMm: 2.2,
  socketOpeningMm: 37.8,
  socketCornerRadiusMm: 4,
  magnetDiameterMm: 6.2,
  magnetOffsetMm: 13.5,
  connectorSlotWidthMm: 2,
  connectorSlotLengthMm: 18,
  connectorKeyWidthMm: 4,
  connectorKeyDepthMm: 18,
  connectorKeyHeightMm: 1.8,
} as const;

export type GridfinityProfile = typeof GRIDFINITY_PROFILE;
