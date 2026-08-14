export function motionFill(mm: number, ceiling = 14): string {
  const t = Math.min(1, Math.max(0, mm / ceiling));
  const eased = t * t * (3 - 2 * t);
  const h = 36 - eased * 4;
  const s = 28 + eased * 42;
  const l = 26 + eased * 32;
  return `hsl(${h} ${s}% ${l}%)`;
}

export function motionStroke(mm: number, ceiling = 14): string {
  const t = Math.min(1, Math.max(0, mm / ceiling));
  return `hsla(38, 50%, ${58 + t * 16}%, ${0.55 + t * 0.3})`;
}
