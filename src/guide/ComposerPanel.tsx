import { useMemo, useState } from "react";
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

type Props = {
  composition: Composition;
  onChange: (next: Composition) => void;
  onAspectHint: (aspect: FigureAspect) => void;
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

export function ComposerPanel({ composition, onChange, onAspectHint }: Props) {
  const [open, setOpen] = useState<Record<MuscleRegion, boolean>>({
    core: true,
    abdomen: false,
    rib_wall: false,
    chest: false,
    neck: false,
    back: false,
  });

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
      <SequenceRow
        title="Engage — in order"
        ids={composition.engage}
        onRemove={remove}
        onMove={(i, dir) => onChange({ ...composition, engage: moveItem(composition.engage, i, dir) })}
      />
      <SequenceRow
        title="Release — in order"
        ids={composition.release}
        onRemove={remove}
        onMove={(i, dir) => onChange({ ...composition, release: moveItem(composition.release, i, dir) })}
      />
      <SequenceRow
        title="Stabilize — in order"
        ids={composition.stabilize}
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
  onRemove,
  onMove,
}: {
  title: string;
  ids: MuscleId[];
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
          {ids.map((id, i) => (
            <li key={id} className="composer-chip">
              <span>{muscleById(id).label}</span>
              <button type="button" aria-label={`Move ${muscleById(id).label} earlier`} onClick={() => onMove(i, -1)} disabled={i === 0}>
                ◂
              </button>
              <button
                type="button"
                aria-label={`Move ${muscleById(id).label} later`}
                onClick={() => onMove(i, 1)}
                disabled={i === ids.length - 1}
              >
                ▸
              </button>
              <button type="button" aria-label={`Remove ${muscleById(id).label}`} onClick={() => onRemove(id)}>
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
