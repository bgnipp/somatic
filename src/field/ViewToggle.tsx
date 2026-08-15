import type { MapView } from "./view";

type Props = {
  view: MapView;
  onChange: (view: MapView) => void;
};

export function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="view-toggle" role="group" aria-label="Motion view">
      <button
        type="button"
        className={view === "regions" ? "active" : undefined}
        aria-pressed={view === "regions"}
        onClick={() => onChange("regions")}
      >
        Regions
      </button>
      <button
        type="button"
        className={view === "field" ? "active" : undefined}
        aria-pressed={view === "field"}
        onClick={() => onChange("field")}
      >
        Field
      </button>
    </div>
  );
}
