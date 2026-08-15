function tone(mm: number, ceiling: number): number {
  const t = Math.min(1, Math.max(0, mm / ceiling));
  return t * t * (3 - 2 * t);
}

/** Translucent gold wash. Anatomy stays visible underneath. */
export function motionFill(mm: number, ceiling = 14): string {
  const eased = tone(mm, ceiling);
  const h = 36 - eased * 4;
  const s = 40 + eased * 40;
  const l = 42 + eased * 24;
  const a = 0.06 + eased * 0.5;
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

/** Soft halo around a moving region. */
export function motionGlow(mm: number, ceiling = 14): string {
  const eased = tone(mm, ceiling);
  return `hsla(38, 64%, ${56 + eased * 18}%, ${0.1 + eased * 0.58})`;
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
