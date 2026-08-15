import { ANATOMY_LAYERS, type AnatomyDepth } from "./layers";

type Props = {
  depth: AnatomyDepth;
  onChange: (depth: AnatomyDepth) => void;
};

export function DepthRail({ depth, onChange }: Props) {
  return (
    <nav className="depth-rail" aria-label="Anatomy depth">
      {ANATOMY_LAYERS.map((layer) => {
        const active = depth === layer.depth;
        return (
          <button
            key={layer.id}
            type="button"
            className={active ? "depth-step active" : "depth-step"}
            aria-pressed={active}
            aria-label={layer.label}
            title={layer.label}
            onClick={() => onChange(layer.depth)}
          >
            <span className="depth-dot" aria-hidden="true" />
            <span className="depth-label">{layer.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
