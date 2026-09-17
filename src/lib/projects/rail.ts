export const RAIL_DEFAULT = 320;
export const RAIL_MIN = 200;
export const RAIL_COLLAPSED = 48;

const TWO_THIRDS = 2 / 3;
const PRESET_TOLERANCE = 16;

/** Верхняя граница ширины левой колонки: ⅔ текущего рабочего экрана. */
export function railMaxForWorkspace(workspaceWidth: number) {
  if (workspaceWidth <= 0) return RAIL_DEFAULT;
  return Math.max(RAIL_MIN, Math.floor(workspaceWidth * TWO_THIRDS));
}

export function clampRailWidth(next: number, max: number, min = RAIL_MIN) {
  return Math.min(max, Math.max(min, next));
}

/** Фиксированная узкая колонка — не больше доступных ⅔. */
export function fixedRailWidth(workspaceWidth: number) {
  return Math.min(RAIL_DEFAULT, railMaxForWorkspace(workspaceWidth));
}

export function twoThirdsRailWidth(workspaceWidth: number) {
  return railMaxForWorkspace(workspaceWidth);
}

export type RailLayoutPreset = "fixed" | "wide" | "custom";

export function railLayoutPreset(width: number, workspaceWidth: number): RailLayoutPreset {
  if (workspaceWidth <= 0) return "fixed";
  const wide = twoThirdsRailWidth(workspaceWidth);
  const fixed = fixedRailWidth(workspaceWidth);
  if (Math.abs(width - wide) <= PRESET_TOLERANCE) return "wide";
  if (Math.abs(width - fixed) <= PRESET_TOLERANCE) return "fixed";
  return "custom";
}
