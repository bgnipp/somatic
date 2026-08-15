import { useEffect, useState } from "react";
import { AnatomyPlaceholder } from "./placeholders";
import {
  ANATOMY_LAYERS,
  layerHref,
  layerOpacity,
  type AnatomyDepth,
  type AnatomyLayer,
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
}: {
  layer: AnatomyLayer;
  depth: AnatomyDepth;
  flatten: number;
}) {
  const href = layerHref(layer.filename);
  const hasImage = useLayerImage(href);
  const opacity = layerOpacity(layer.id, depth);
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
        <AnatomyPlaceholder id={layer.id} flatten={flatten} />
      )}
    </g>
  );
}

type Props = {
  depth: AnatomyDepth;
  /** 0 = rest dome, 1 = flattened on inhale. */
  flatten?: number;
};

export function AnatomyStack({ depth, flatten = 0 }: Props) {
  return (
    <g className="anatomy-stack" clipPath="url(#torso-clip)">
      {ANATOMY_LAYERS.map((layer) => (
        <AnatomyLayerView
          key={layer.id}
          layer={layer}
          depth={depth}
          flatten={flatten}
        />
      ))}
    </g>
  );
}
