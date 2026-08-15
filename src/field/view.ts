export type MapView = "regions" | "field";

export const MAP_VIEW_KEY = "somatic.mapView.v1";
export const DEFAULT_MAP_VIEW: MapView = "regions";

export function loadStoredView(): MapView {
  try {
    const raw = localStorage.getItem(MAP_VIEW_KEY);
    return raw === "field" ? "field" : DEFAULT_MAP_VIEW;
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
