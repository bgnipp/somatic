import { useEffect, useMemo, useRef, useState } from "react";
import { CrossSection } from "./components/CrossSection";
import { KonnoMead } from "./components/KonnoMead";
import { LiveLevels } from "./components/LiveLevels";
import { Metrics } from "./components/Metrics";
import { TorsoMap } from "./components/TorsoMap";
import { TracePanel } from "./components/TracePanel";
import { loadStoredView, saveStoredView, type MapView } from "./field/view";
import { readSearchParam, writeSearchParams } from "./lib/urlState";
import { MockBreathSource } from "./mock/MockBreathSource";
import { meanAbdomen, meanRibCage, sampleAt } from "./mock/synthesize";
import {
  downloadSession,
  loadSessions,
  newId,
  parseSession,
  saveSessions,
} from "./storage/sessions";
import type { PresetId, Sample, Session } from "./types";
import { PRESET_IDS, PRESETS } from "./types";

type Mode = "live" | "recording" | "replay";

const HISTORY_MS = 8000;
const METRICS_MS = 16000;

function formatTime(ms: number): string {
  const s = Math.max(0, ms) / 1000;
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(1).padStart(4, "0")}`;
}

function scenarioLabel(session: Session): string {
  return session.label?.trim()
    || PRESETS.find((p) => p.id === session.scenario)?.label
    || session.scenario
    || session.protocol;
}

function takeLabel(session: Session): string {
  return `${scenarioLabel(session)} · ${new Date(session.startedAt).toLocaleTimeString()}`;
}

type Phase = "inhale" | "exhale" | "still";

function breathPhase(history: Sample[]): Phase {
  if (history.length < 4) return "still";
  const latest = history[history.length - 1];
  const windowStart = latest.t - 400;
  let earlier = history[0];
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].t <= windowStart) {
      earlier = history[i];
      break;
    }
  }
  const total = (s: Sample) => meanRibCage(s) + meanAbdomen(s);
  const delta = total(latest) - total(earlier);
  if (delta > 0.35) return "inhale";
  if (delta < -0.35) return "exhale";
  return "still";
}

function initialPreset(): PresetId {
  const q = readSearchParam("scenario");
  if (q && (PRESET_IDS as readonly string[]).includes(q)) return q as PresetId;
  return "abdominal";
}

function initialView(): MapView {
  const q = readSearchParam("view");
  if (q === "field" || q === "guide" || q === "regions") return q;
  return loadStoredView();
}

export default function App() {
  const [preset, setPreset] = useState<PresetId>(initialPreset);
  const [mode, setMode] = useState<Mode>("live");
  const [sample, setSample] = useState<Sample | null>(null);
  const [history, setHistory] = useState<Sample[]>([]);
  const [metricsBuf, setMetricsBuf] = useState<Sample[]>([]);
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [active, setActive] = useState<Session | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [scrub, setScrub] = useState(0);
  const [landmarks, setLandmarks] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const [view, setView] = useState<MapView>(initialView);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  useEffect(() => {
    saveStoredView(view);
  }, [view]);

  const source = useRef(new MockBreathSource(preset));
  const bufferRef = useRef<Sample[]>([]);
  const importRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    source.current.setPreset(preset);
    writeSearchParams({ scenario: preset, view });
  }, [preset, view]);

  useEffect(() => {
    if (mode === "replay") {
      source.current.stop();
      return;
    }
    setHistory([]);
    setMetricsBuf([]);
    const unsub = source.current.subscribe((next) => {
      setSample(next);
      setHistory((prev) => {
        const kept = prev.filter((s) => next.t - s.t <= HISTORY_MS && s.t <= next.t);
        return [...kept, next];
      });
      setMetricsBuf((prev) => {
        const kept = prev.filter((s) => next.t - s.t <= METRICS_MS && s.t <= next.t);
        return [...kept, next];
      });
      if (mode === "recording") {
        bufferRef.current = [...bufferRef.current, next];
      }
    });
    source.current.start();
    return () => {
      unsub();
      source.current.stop();
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "replay" || !active || !playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) * speed;
      last = now;
      setScrub((t) => {
        const next = t + dt;
        if (next >= active.durationMs) return loop ? 0 : active.durationMs;
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, active, playing, loop, speed]);

  useEffect(() => {
    if (mode !== "replay" || !active) return;
    const s = sampleAt(active.samples, scrub);
    if (!s) return;
    setSample(s);
    setHistory(active.samples.filter((x) => x.t <= scrub && scrub - x.t <= HISTORY_MS));
    if (playing && scrub >= active.durationMs && !loop) setPlaying(false);
  }, [mode, active, scrub, playing, loop]);

  const currentPreset = useMemo(
    () => PRESETS.find((p) => p.id === preset) ?? PRESETS[0],
    [preset],
  );
  const phase = breathPhase(history);
  const compareSession = sessions.find((s) => s.id === compareId) ?? null;
  const compareHistory = useMemo(() => {
    if (!compareSession || history.length === 0) return [];
    const t0 = history[0].t;
    const t1 = history[history.length - 1].t;
    return compareSession.samples.filter((s) => s.t >= t0 && s.t <= t1);
  }, [compareSession, history]);
  const metricsSamples = mode === "replay" && active ? active.samples : metricsBuf;

  function startRecording() {
    bufferRef.current = [];
    setActive(null);
    setCompareId(null);
    setPlaying(false);
    setMode("recording");
  }

  function stopRecording() {
    const samples = bufferRef.current;
    if (samples.length < 8) {
      setMode("live");
      return;
    }
    const session: Session = {
      id: newId(),
      startedAt: new Date().toISOString(),
      durationMs: samples[samples.length - 1].t - samples[0].t,
      protocol: currentPreset.family === "singing" ? "sustained_phrase" : "quiet_standing",
      scenario: preset,
      samples: samples.map((s) => ({
        ...s,
        t: s.t - samples[0].t,
      })),
      notes,
    };
    const next = [session, ...sessions].slice(0, 24);
    setSessions(next);
    saveSessions(next);
    setActive(session);
    setScrub(0);
    setPlaying(false);
    setMode("replay");
  }

  function openSession(session: Session) {
    setActive(session);
    setNotes(session.notes);
    setScrub(0);
    setPlaying(false);
    setCompareId(null);
    setMode("replay");
    if (session.scenario && PRESETS.some((p) => p.id === session.scenario)) {
      setPreset(session.scenario as PresetId);
    }
  }

  function backToLive() {
    setPlaying(false);
    setActive(null);
    setCompareId(null);
    setMode("live");
    source.current = new MockBreathSource(preset);
  }

  function renameSession(id: string, label: string) {
    const trimmed = label.trim();
    const next = sessions.map((s) =>
      s.id === id ? { ...s, label: trimmed || undefined } : s,
    );
    setSessions(next);
    saveSessions(next);
    if (active?.id === id) {
      setActive(next.find((s) => s.id === id) ?? active);
    }
    setEditingId(null);
  }

  function deleteSession(id: string) {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    saveSessions(next);
    if (compareId === id) setCompareId(null);
    if (active?.id === id) backToLive();
  }

  function updateNotes(value: string) {
    setNotes(value);
    if (!active) return;
    const updated = { ...active, notes: value };
    setActive(updated);
    const next = sessions.map((s) => (s.id === updated.id ? updated : s));
    setSessions(next);
    saveSessions(next);
  }

  function importFiles(fileList: FileList | null) {
    if (!fileList) return;
    Promise.all([...fileList].map((f) => f.text())).then((texts) => {
      const found: Session[] = [];
      for (const text of texts) {
        try {
          const parsed = JSON.parse(text) as unknown;
          const items = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of items) {
            const session = parseSession(item);
            if (session) found.push(session);
          }
        } catch {
          /* skip unreadable files */
        }
      }
      if (found.length === 0) return;
      const seen = new Set(sessions.map((s) => s.id));
      const unique: Session[] = [];
      for (const session of found) {
        if (seen.has(session.id)) continue;
        seen.add(session.id);
        unique.push(session);
      }
      if (unique.length === 0) return;
      const next = [...unique, ...sessions].slice(0, 24);
      setSessions(next);
      saveSessions(next);
    });
    if (importRef.current) importRef.current.value = "";
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (modeRef.current === "recording") stopRecording();
        else if (modeRef.current === "replay") setPlaying((p) => !p);
        else startRecording();
        return;
      }
      if (modeRef.current !== "replay" || !active) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPlaying(false);
        setScrub((t) => Math.max(0, t - 500));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPlaying(false);
        setScrub((t) => Math.min(active.durationMs, t + 500));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, notes, sessions, preset, currentPreset.family]);

  return (
    <div className="app">
      <header className="top">
        <h1>Somatic</h1>
        <p className="lede">
          This is a prototype. The body map runs on mock breath data — there is no
          camera yet. A teaching mirror for quiet standing breath, and later for sung
          phrases. Brightness is motion, not a problem.{" "}
          <a
            href="https://github.com/bgnipp/somatic/blob/main/docs/mvp-plan.md"
            target="_blank"
            rel="noreferrer"
          >
            Design document
          </a>
        </p>
      </header>

      <aside className="notice">
        Prototype for education and teaching, not a medical device. It does not
        diagnose or treat breathing function. Sit down if you feel lightheaded from
        repeated deep breaths.
      </aside>

      <section className="studio">
        <div className="stage" data-mode={mode}>
          <div className="stage-status">
            {/* The pill reads the mock stream; in Guide view the figure plays
                its own scripted loop, so the pill would contradict it. */}
            {view !== "guide" && (
              <span className={`phase-pill ${phase}`} aria-live="polite">
                {phase === "inhale" ? "Inhale" : phase === "exhale" ? "Exhale" : "Still"}
              </span>
            )}
            {mode === "recording" && <span className="mode-pill rec">Recording</span>}
            {mode === "replay" && <span className="mode-pill">Replay</span>}
          </div>
          <TorsoMap
            sample={sample}
            showLandmarks={landmarks}
            view={view}
            onViewChange={setView}
          />
          {view !== "guide" && <CrossSection sample={sample} />}
        </div>

        <div className="console">
          <div className="preset-block">
            <label htmlFor="preset">Scenario</label>
            <select
              id="preset"
              value={preset}
              disabled={mode === "recording"}
              onChange={(e) => {
                const next = e.target.value as PresetId;
                setPreset(next);
                source.current.setPreset(next);
                if (mode === "replay") backToLive();
              }}
            >
              <optgroup label="Quiet standing">
                {PRESETS.filter((p) => p.family === "standing").map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Singing">
                {PRESETS.filter((p) => p.family === "singing").map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="blurb">{currentPreset.blurb}</p>
            <p className="look-for">{currentPreset.lookFor}</p>
            <label className="check" htmlFor="landmarks">
              <input
                id="landmarks"
                type="checkbox"
                checked={landmarks}
                onChange={(e) => setLandmarks(e.target.checked)}
              />
              Points of interest
            </label>
          </div>

          <Metrics samples={metricsSamples} />
          <TracePanel
            history={history}
            compare={compareHistory}
            labels={
              active && compareSession
                ? { a: takeLabel(active), b: takeLabel(compareSession) }
                : undefined
            }
          />
          <div className="console-row">
            <KonnoMead history={history} compare={compareHistory} />
            <LiveLevels sample={sample} />
          </div>
        </div>
      </section>

      <section className="transport">
        <div className="buttons">
          {mode !== "recording" ? (
            <button type="button" className="primary" onClick={startRecording}>
              Record
            </button>
          ) : (
            <button type="button" className="danger" onClick={stopRecording}>
              Stop & save
            </button>
          )}
          {mode === "replay" && active && (
            <>
              <button type="button" onClick={() => setPlaying((p) => !p)}>
                {playing ? "Pause" : "Play"}
              </button>
              <button type="button" className={loop ? "primary" : undefined} onClick={() => setLoop((v) => !v)}>
                Loop {loop ? "on" : "off"}
              </button>
              <button type="button" onClick={() => setSpeed((s) => (s === 1 ? 0.5 : 1))}>
                {speed === 1 ? "1×" : "0.5×"}
              </button>
              <button type="button" onClick={backToLive}>
                Live mock
              </button>
              <button type="button" onClick={() => downloadSession(active)}>
                Export JSON
              </button>
            </>
          )}
        </div>

        <div className="scrub">
          {mode === "recording" ? (
            <p className="status rec">Recording · {formatTime(sample?.t ?? 0)}</p>
          ) : mode === "replay" && active ? (
            <>
              <input
                type="range"
                min={0}
                max={active.durationMs}
                step={16}
                value={scrub}
                onChange={(e) => {
                  setPlaying(false);
                  setScrub(Number(e.target.value));
                }}
              />
              <span>
                {formatTime(scrub)} / {formatTime(active.durationMs)}
              </span>
              {sessions.filter((s) => s.id !== active.id).length > 0 && (
                <label className="compare-select">
                  Compare with
                  <select
                    value={compareId ?? ""}
                    onChange={(e) => setCompareId(e.target.value || null)}
                  >
                    <option value="">None</option>
                    {sessions
                      .filter((s) => s.id !== active.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {takeLabel(s)}
                        </option>
                      ))}
                  </select>
                </label>
              )}
            </>
          ) : (
            <p className="status">Live mock · no camera · {currentPreset.label} · space to record</p>
          )}
        </div>

        <label className="notes">
          Session notes
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => updateNotes(e.target.value)}
            placeholder="What changed after a touch, a cue, a phrase…"
          />
        </label>
      </section>

      <section className="takes">
        <h2>Saved takes</h2>
        <div className="takes-toolbar">
          <button type="button" onClick={() => importRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => importFiles(e.target.files)}
          />
        </div>
        {sessions.length === 0 ? (
          <p className="status">No takes yet. Record one, or import a JSON file.</p>
        ) : (
          <ul>
            {sessions.map((s) => (
              <li key={s.id} className="take-row">
                {editingId === s.id ? (
                  <form
                    className="take-rename-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      renameSession(s.id, editDraft);
                    }}
                  >
                    <input
                      autoFocus
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onBlur={() => renameSession(s.id, editDraft)}
                      aria-label="Take name"
                    />
                  </form>
                ) : (
                  <button type="button" className="take-open" onClick={() => openSession(s)}>
                    <strong>{scenarioLabel(s)}</strong>
                    <span>
                      {new Date(s.startedAt).toLocaleString()} · {(s.durationMs / 1000).toFixed(1)}s
                      {s.notes ? " · noted" : ""}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  className="take-rename"
                  aria-label="Rename take"
                  onClick={() => {
                    setEditingId(s.id);
                    setEditDraft(scenarioLabel(s));
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="take-delete"
                  aria-label="Delete take"
                  onClick={() => deleteSession(s.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="foot">
        Prototype. Data stays in this browser. Camera capture is a later swap behind
        the same sample contract.{" "}
        <a
          href="https://github.com/bgnipp/somatic/blob/main/docs/mvp-plan.md"
          target="_blank"
          rel="noreferrer"
        >
          Design document
        </a>
      </footer>
    </div>
  );
}
