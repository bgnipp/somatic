import type { MapView } from "./view";

type Props = {
  view: MapView;
  onChange: (view: MapView) => void;
};

const OPTIONS: { id: MapView; label: string }[] = [
  { id: "regions", label: "Regions" },
  { id: "field", label: "Field" },
  { id: "guide", label: "Guide" },
];

export function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="view-toggle" role="group" aria-label="Motion view">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={view === opt.id ? "active" : undefined}
          aria-pressed={view === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
