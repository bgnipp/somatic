import type { FigureAspect } from "../anatomy/catalog";

type Props = {
  aspect: FigureAspect;
  onChange: (aspect: FigureAspect) => void;
};

const OPTIONS: { id: FigureAspect; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
];

export function AspectToggle({ aspect, onChange }: Props) {
  return (
    <div className="aspect-toggle" role="group" aria-label="Figure aspect">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={aspect === opt.id ? "active" : undefined}
          aria-pressed={aspect === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
