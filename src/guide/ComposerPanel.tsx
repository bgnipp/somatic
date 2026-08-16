import { useEffect, useMemo, useState } from "react";
import {
  MUSCLES,
  muscleById,
  type FigureAspect,
  type MuscleId,
  type MuscleRegion,
} from "../anatomy/catalog";
import type { Composition } from "./composer";

const REGION_ORDER: MuscleRegion[] = ["core", "abdomen", "rib_wall", "chest", "neck", "back"];

const REGION_LABELS: Record<MuscleRegion, string> = {
  core: "Core",
  abdomen: "Abdomen",
  rib_wall: "Rib wall",
  chest: "Chest & shoulder",
  neck: "Neck",
  back: "Back",
};

const COMPOSER_OPEN_KEY = "somatic.composerOpen.v1";

const HOLD_PRESETS = [
  { label: "Fast · 4 s", ms: 4000 },
  { label: "Medium · 6 s", ms: 6000 },
  { label: "Slow · 10 s", ms: 10000 },
] as const;

function defaultOpen(): Record<MuscleRegion, boolean> {
  return { core: true, abdomen: false, rib_wall: false, chest: false, neck: false, back: false };
}

function loadOpen(): Record<MuscleRegion, boolean> {
  try {
    const raw = localStorage.getItem(COMPOSER_OPEN_KEY);
    if (!raw) return defaultOpen();
    const parsed = JSON.parse(raw) as Partial<Record<MuscleRegion, boolean>>;
    const next = defaultOpen();
    for (const key of REGION_ORDER) {
      if (typeof parsed[key] === "boolean") next[key] = parsed[key];
    }
    return next;
  } catch {
    return defaultOpen();
  }
}

type Props = {
  composition: Composition;
  onChange: (next: Composition) => void;
  onAspectHint: (aspect: FigureAspect) => void;
  aspect: FigureAspect;
};

function moveItem(list: MuscleId[], index: number, dir: -1 | 1): MuscleId[] {
  const next = [...list];
  const j = index + dir;
  if (j < 0 || j >= next.length) return list;
  const tmp = next[index];
  next[index] = next[j];
  next[j] = tmp;
  return next;
}

export function ComposerPanel({ composition, onChange, onAspectHint, aspect }: Props) {
  const [open, setOpen] = useState<Record<MuscleRegion, boolean>>(loadOpen);

  useEffect(() => {
    try {
      localStorage.setItem(COMPOSER_OPEN_KEY, JSON.stringify(open));
    } catch {
      /* ignore quota / private mode */
    }
  }, [open]);

  const grouped = useMemo(() => {
    const map = {} as Record<MuscleRegion, typeof MUSCLES>;
    for (const region of REGION_ORDER) map[region] = [];
    for (const m of MUSCLES) map[m.region].push(m);
    return map;
  }, []);

  const empty =
    composition.engage.length === 0 &&
    composition.release.length === 0 &&
    composition.stabilize.length === 0;

  function hintAspect(id: MuscleId) {
    const def = muscleById(id);
    if (def.aspects.length === 1) onAspectHint(def.aspects[0]);
  }

  function addEngage(id: MuscleId) {
    hintAspect(id);
    onChange({
      ...composition,
      engage: composition.engage.includes(id) ? composition.engage : [...composition.engage, id],
      release: composition.release.filter((x) => x !== id),
      stabilize: composition.stabilize.filter((x) => x !== id),
    });
  }

  function addRelease(id: MuscleId) {
    hintAspect(id);
    onChange({
      ...composition,
      release: composition.release.includes(id) ? composition.release : [...composition.release, id],
      engage: composition.engage.filter((x) => x !== id),
      stabilize: composition.stabilize.filter((x) => x !== id),
    });
  }

  function addStabilize(id: MuscleId) {
    hintAspect(id);
    onChange({
      ...composition,
      stabilize: composition.stabilize.includes(id)
        ? composition.stabilize
        : [...composition.stabilize, id],
      engage: composition.engage.filter((x) => x !== id),
      release: composition.release.filter((x) => x !== id),
    });
  }

  function remove(id: MuscleId) {
    onChange({
      ...composition,
      engage: composition.engage.filter((x) => x !== id),
      release: composition.release.filter((x) => x !== id),
      stabilize: composition.stabilize.filter((x) => x !== id),
    });
  }

  return (
    <div className="composer">
      {empty && <p className="composer-empty">Add muscles to build a sequence.</p>}
      <div className="composer-hold" role="group" aria-label="Loop speed">
        {HOLD_PRESETS.map((opt) => (
          <button
            key={opt.ms}
            type="button"
            className={composition.holdMs === opt.ms ? "active" : undefined}
            aria-pressed={composition.holdMs === opt.ms}
            onClick={() => onChange({ ...composition, holdMs: opt.ms })}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <SequenceRow
        title="Engage — in order"
        ids={composition.engage}
        aspect={aspect}
        onRemove={remove}
        onMove={(i, dir) => onChange({ ...composition, engage: moveItem(composition.engage, i, dir) })}
      />
      <SequenceRow
        title="Release — in order"
        ids={composition.release}
        aspect={aspect}
        onRemove={remove}
        onMove={(i, dir) => onChange({ ...composition, release: moveItem(composition.release, i, dir) })}
      />
      <SequenceRow
        title="Stabilize — in order"
        ids={composition.stabilize}
        aspect={aspect}
        onRemove={remove}
        onMove={(i, dir) =>
          onChange({ ...composition, stabilize: moveItem(composition.stabilize, i, dir) })
        }
      />
      <div className="composer-picker">
        {REGION_ORDER.map((region) => (
          <details
            key={region}
            className="composer-region"
            open={open[region]}
            onToggle={(e) =>
              setOpen((prev) => ({ ...prev, [region]: (e.target as HTMLDetailsElement).open }))
            }
          >
            <summary>{REGION_LABELS[region]}</summary>
            <ul>
              {grouped[region].map((m) => {
                const inEngage = composition.engage.includes(m.id);
                const inRelease = composition.release.includes(m.id);
                const inStabilize = composition.stabilize.includes(m.id);
                return (
                  <li key={m.id} className="composer-row">
                    <div>
                      <strong>{m.label}</strong>
                      <span>{m.action}</span>
                    </div>
                    <div className="composer-adds">
                      <button
                        type="button"
                        className={inEngage ? "active" : undefined}
                        aria-pressed={inEngage}
                        onClick={() => addEngage(m.id)}
                      >
                        engage
                      </button>
                      <button
                        type="button"
                        className={inRelease ? "active" : undefined}
                        aria-pressed={inRelease}
                        onClick={() => addRelease(m.id)}
                      >
                        release
                      </button>
                      <button
                        type="button"
                        className={inStabilize ? "active" : undefined}
                        aria-pressed={inStabilize}
                        onClick={() => addStabilize(m.id)}
                      >
                        stabilize
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}

function SequenceRow({
  title,
  ids,
  aspect,
  onRemove,
  onMove,
}: {
  title: string;
  ids: MuscleId[];
  aspect: FigureAspect;
  onRemove: (id: MuscleId) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}) {
  return (
    <div className="composer-seq">
      <p>{title}</p>
      {ids.length === 0 ? (
        <p className="composer-seq-empty">None yet</p>
      ) : (
        <ol>
          {ids.map((id, i) => {
            const def = muscleById(id);
            const hiddenSide = def.aspects.includes(aspect) ? null : def.aspects[0];
            return (
            <li key={id} className="composer-chip">
              <span>{def.label}</span>
              {hiddenSide && (
                <em className="composer-aspect" title={`Visible on the ${hiddenSide}`}>
                  {hiddenSide}
                </em>
              )}
              <button type="button" aria-label={`Move ${def.label} earlier`} onClick={() => onMove(i, -1)} disabled={i === 0}>
                ◂
              </button>
              <button
                type="button"
                aria-label={`Move ${def.label} later`}
                onClick={() => onMove(i, 1)}
                disabled={i === ids.length - 1}
              >
                ▸
              </button>
              <button type="button" aria-label={`Remove ${def.label}`} onClick={() => onRemove(id)}>
                ✕
              </button>
            </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
