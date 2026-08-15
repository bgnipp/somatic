import { motionGlow } from "../lib/color";
import { FIELD_CEILING_MM } from "./tunables";
import type { FieldSite } from "./sites";

type Props = {
  sites: FieldSite[];
};

/** Flat overlapping gold blobs. F1 scaffolding and reduced-motion fallback. */
export function BlobField({ sites }: Props) {
  return (
    <g className="motion-field motion-field-blobs" pointerEvents="none" aria-hidden="true">
      <defs>
        {sites.map((site, i) => (
          <radialGradient key={i} id={`field-blob-${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={motionGlow(site.mm, FIELD_CEILING_MM)} />
            <stop offset="100%" stopColor="rgba(228,184,106,0)" />
          </radialGradient>
        ))}
      </defs>
      {sites.map((site, i) => (
        <circle
          key={i}
          cx={site.x}
          cy={site.y}
          r={site.r * 1.35}
          fill={`url(#field-blob-${i})`}
          filter="url(#motion-glow)"
        />
      ))}
    </g>
  );
}
