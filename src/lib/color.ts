function tone(mm: number, ceiling: number): number {
  const t = Math.min(1, Math.max(0, mm / ceiling));
  return t * t * (3 - 2 * t);
}

/** Translucent gold wash. Nearly invisible at rest so anatomy reads through. */
export function motionFill(mm: number, ceiling = 14): string {
  const eased = tone(mm, ceiling);
  const h = 38 - eased * 4;
  const s = 55 + eased * 25;
  const l = 48 + eased * 18;
  const a = 0.03 + eased * 0.3;
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

/** Blurred bloom fill. Zero at rest; only moving regions light up. */
export function motionGlow(mm: number, ceiling = 14): string {
  const eased = tone(mm, ceiling);
  return `hsla(40, 72%, ${58 + eased * 14}%, ${eased * 0.5})`;
}

export function motionStroke(mm: number, ceiling = 14): string {
  const t = Math.min(1, Math.max(0, mm / ceiling));
  return `hsla(38, 50%, ${58 + t * 16}%, ${0.35 + t * 0.4})`;
}

/** Opaque gold for bars and the cross-section, where wash would disappear. */
export function motionSolid(mm: number, ceiling = 14): string {
  const eased = tone(mm, ceiling);
  const h = 36 - eased * 4;
  const s = 28 + eased * 42;
  const l = 26 + eased * 32;
  return `hsl(${h} ${s}% ${l}%)`;
}
