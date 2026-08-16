import { useEffect, useState } from "react";
import type { MuscleId } from "./catalog";
import { AnatomyPlaceholder } from "./placeholders";
import {
  ANATOMY_LAYERS,
  layerHref,
  layerOpacity,
  REVEAL_OPACITY_FLOOR,
  type AnatomyDepth,
  type AnatomyLayer,
  type AnatomyLayerId,
} from "./layers";

function useLayerImage(href: string): boolean {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setLoaded(true);
    };
    img.onerror = () => {
      if (!cancelled) setLoaded(false);
    };
    img.src = href;
    return () => {
      cancelled = true;
    };
  }, [href]);
  return loaded;
}

function AnatomyLayerView({
  layer,
  depth,
  flatten,
  expand,
  ribLift,
  pelvicLift,
  activations,
  revealLayers,
}: {
  layer: AnatomyLayer;
  depth: AnatomyDepth;
  flatten: number;
  expand: number;
  ribLift: number;
  pelvicLift: number;
  activations?: Partial<Record<MuscleId, number>>;
  revealLayers?: ReadonlySet<AnatomyLayerId>;
}) {
  const href = layerHref(layer.filename);
  const hasImage = useLayerImage(href);
  const base = layerOpacity(layer.id, depth);
  const opacity = revealLayers?.has(layer.id) ? Math.max(base, REVEAL_OPACITY_FLOOR) : base;
  return (
    <g
      className={`anatomy-layer anatomy-layer-${layer.id}`}
      style={{ opacity }}
      pointerEvents="none"
      aria-hidden="true"
    >
      {hasImage ? (
        <image
          href={href}
          x="0"
          y="0"
          width="240"
          height="250"
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <AnatomyPlaceholder
          id={layer.id}
          flatten={flatten}
          expand={expand}
          ribLift={ribLift}
          pelvicLift={pelvicLift}
          activations={activations}
        />
      )}
    </g>
  );
}

type Props = {
  depth: AnatomyDepth;
  /** 0 = rest dome, 1 = flattened on inhale. */
  flatten?: number;
  /** 0–1 rib widening / rise. */
  expand?: number;
  /** 0–1 ribs rise away from the pelvis (cage lengthening). */
  ribLift?: number;
  /** −1 descended, 0 rest, +1 lifted. */
  pelvicLift?: number;
  /** Guide-view activation tints. Omit in measured views. */
  activations?: Partial<Record<MuscleId, number>>;
  /** Compose mode: layers holding picked muscles get a floor opacity. */
  revealLayers?: ReadonlySet<AnatomyLayerId>;
};

export function AnatomyStack({
  depth,
  flatten = 0,
  expand = 0,
  ribLift = 0,
  pelvicLift = 0,
  activations,
  revealLayers,
}: Props) {
  return (
    <g className="anatomy-stack" clipPath="url(#torso-clip)">
      {ANATOMY_LAYERS.map((layer) => (
        <AnatomyLayerView
          key={layer.id}
          layer={layer}
          depth={depth}
          flatten={flatten}
          expand={expand}
          ribLift={ribLift}
          pelvicLift={pelvicLift}
          activations={activations}
          revealLayers={revealLayers}
        />
      ))}
    </g>
  );
}
