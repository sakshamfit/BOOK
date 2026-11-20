/** Shared geometry for a complete rack: never a cropped three-item viewport. */
export const GARMENT_ASPECT = 200 / 310;
export const RAIL_REST_ANGLE = -64;
export const RAIL_GAP = 0.035;
const FRONT_WIDTH = 1;

export interface ClothingRailLayout {
  width: number;
  h: number;
  compact: boolean;
  restAngle: number;
  sideWidths: number[];
  sideScale: number;
  padding: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** The spring runs from restAngle to zero; allocate width linearly so turning
 * one piece closed while another opens never needs two front-facing slots. */
export function footprint(h: number, turn: number, sideWidth = 0.46, restAngle = RAIL_REST_ANGLE) {
  const progress = clamp(1 - turn / restAngle, 0, 1);
  return h * GARMENT_ASPECT * (sideWidth + (FRONT_WIDTH - sideWidth) * progress);
}

/** Match the visible 3-D projection to that width budget, including mid-turn.
 * Interpolating degrees directly makes two half-turned fronts wider than one
 * front plus one edge-on piece, which can clip end hangers on small screens. */
export function railTurnAngle(turn: number, restAngle = RAIL_REST_ANGLE) {
  const progress = clamp(1 - turn / restAngle, 0, 1);
  const restCos = Math.cos(restAngle * Math.PI / 180);
  return -Math.acos(clamp(restCos + (1 - restCos) * progress, 0, 1)) * 180 / Math.PI;
}

/** Reserve room for one front-facing piece plus EVERY other hanger. */
export function fitClothingRail(width: number, baseSideWidths: readonly number[]): ClothingRailLayout {
  const count = baseSideWidths.length;
  const safeWidth = Math.max(0, width);
  const padding = clamp(safeWidth * 0.03, 8, 24);
  if (!count || !safeWidth) {
    return { width: safeWidth, h: 200, compact: false, restAngle: RAIL_REST_ANGLE, sideWidths: [...baseSideWidths], sideScale: 1, padding };
  }
  const sum = baseSideWidths.reduce((total, value) => total + value, 0);
  const remainingSides = sum - Math.min(...baseSideWidths);
  const capacity = Math.max(1, safeWidth - padding * 2);
  const wideUnit = GARMENT_ASPECT * (FRONT_WIDTH + remainingSides) + count * RAIL_GAP;
  const wideFit = capacity / wideUnit;
  // Keep mobile garments readable; turn the other hangers more edge-on instead
  // of pushing seven of them outside a clipped carousel.
  const minHeight = Math.min(200, safeWidth * 0.6);
  const tightestUnit = GARMENT_ASPECT * (FRONT_WIDTH + remainingSides * 0.01) + count * RAIL_GAP;
  const h = Math.max(1, Math.floor(Math.min(400, Math.max(minHeight, wideFit), capacity / tightestUnit)));
  const availableSides = (capacity / h - count * RAIL_GAP) / GARMENT_ASPECT - FRONT_WIDTH;
  const sideScale = remainingSides > 0 ? clamp(availableSides / remainingSides, 0.01, 1) : 1;
  const restAngle = -Math.acos(Math.cos(RAIL_REST_ANGLE * Math.PI / 180) * sideScale) * 180 / Math.PI;
  return {
    width: safeWidth,
    h,
    compact: sideScale < 0.999,
    restAngle,
    sideWidths: baseSideWidths.map((value) => value * sideScale),
    sideScale,
    padding,
  };
}

/** Same ordered, centred row for mouse, touch, keyboard and autoplay. */
export function railTargets(layout: ClothingRailLayout, front: number | null) {
  const { h, width, sideWidths, restAngle } = layout;
  const feet = sideWidths.map((side, i) => footprint(h, i === front ? 0 : restAngle, side, restAngle) + h * RAIL_GAP);
  const total = feet.reduce((sum, value) => sum + value, 0);
  let cursor = (width - total) / 2;
  return feet.map((foot) => {
    const x = cursor + foot / 2;
    cursor += foot;
    return x;
  });
}
