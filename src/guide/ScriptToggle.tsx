import { GUIDE_SCRIPTS, type GuideScriptId } from "./script";

type Props = {
  scriptId: GuideScriptId;
  onChange: (id: GuideScriptId) => void;
};

export function ScriptToggle({ scriptId, onChange }: Props) {
  return (
    <div className="script-toggle" role="group" aria-label="Guide breath">
      {GUIDE_SCRIPTS.map((script) => (
        <button
          key={script.id}
          type="button"
          className={scriptId === script.id ? "active" : undefined}
          aria-pressed={scriptId === script.id}
          onClick={() => onChange(script.id)}
        >
          {script.label}
        </button>
      ))}
      <button
        type="button"
        className={scriptId === "custom" ? "active" : undefined}
        aria-pressed={scriptId === "custom"}
        onClick={() => onChange("custom")}
      >
        Compose
      </button>
    </div>
  );
}
