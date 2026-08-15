import type { FigureAspect } from "../anatomy/catalog";

export const GUIDE_ASPECT_KEY = "somatic.guideAspect.v1";

export function loadStoredAspect(): FigureAspect {
  try {
    const raw = localStorage.getItem(GUIDE_ASPECT_KEY);
    return raw === "back" ? "back" : "front";
  } catch {
    return "front";
  }
}

export function saveStoredAspect(aspect: FigureAspect): void {
  try {
    localStorage.setItem(GUIDE_ASPECT_KEY, aspect);
  } catch {
    /* ignore quota / private mode */
  }
}
