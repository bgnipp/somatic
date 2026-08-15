export type MapView = "regions" | "field" | "guide";

export const MAP_VIEW_KEY = "somatic.mapView.v2";
export const DEFAULT_MAP_VIEW: MapView = "regions";

function parseView(raw: string | null): MapView {
  if (raw === "field" || raw === "guide" || raw === "regions") return raw;
  return DEFAULT_MAP_VIEW;
}

export function loadStoredView(): MapView {
  try {
    return parseView(localStorage.getItem(MAP_VIEW_KEY));
  } catch {
    return DEFAULT_MAP_VIEW;
  }
}

export function saveStoredView(view: MapView): void {
  try {
    localStorage.setItem(MAP_VIEW_KEY, view);
  } catch {
    /* ignore quota / private mode */
  }
}
