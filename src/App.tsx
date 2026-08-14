import { useEffect, useMemo, useRef, useState } from "react";
import { CrossSection } from "./components/CrossSection";
import { KonnoMead } from "./components/KonnoMead";
import { LiveLevels } from "./components/LiveLevels";
import { TorsoMap } from "./components/TorsoMap";
import { TracePanel } from "./components/TracePanel";
import { MockBreathSource } from "./mock/MockBreathSource";
import { meanAbdomen, meanRibCage, sampleAt } from "./mock/synthesize";
import { downloadSession, loadSessions, newId, saveSessions } from "./storage/sessions";
import type { PresetId, Sample, Session } from "./types";
import { PRESETS } from "./types";

type Mode = "live" | "recording" | "replay";

const HISTORY_MS = 8000;

function formatTime(ms: number): string {
  const s = Math.max(0, ms) / 1000;
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(1).padStart(4, "0")}`;
}

type Phase = "inhale" | "exhale" | "still";

/** Rising total displacement reads as inhale, falling as exhale. */
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

export default function App() {
  const [preset, setPreset] = useState<PresetId>("abdominal");
  const [mode, setMode] = useState<Mode>("live");
  const [sample, setSample] = useState<Sample | null>(null);
  const [history, setHistory] = useState<Sample[]>([]);
  const [buffer, setBuffer] = useState<Sample[]>([]);
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [active, setActive] = useState<Session | null>(null);
  const [scrub, setScrub] = useState(0);
  const [landmarks, setLandmarks] = useState(true);
  const [playing, setPlaying] = useState(false);

  const source = useRef(new MockBreathSource(preset));
  const bufferRef = useRef<Sample[]>([]);

  useEffect(() => {
    source.current.setPreset(preset);
  }, [preset]);

  useEffect(() => {
    if (mode === "replay") {
      source.current.stop();
      return;
    }
    const unsub = source.current.subscribe((next) => {
      setSample(next);
      setHistory((prev) => {
        const kept = prev.filter((s) => next.t - s.t <= HISTORY_MS);
        return [...kept, next];
      });
      if (mode === "recording") {
        bufferRef.current = [...bufferRef.current, next];
        setBuffer(bufferRef.current);
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
      const dt = now - last;
      last = now;
      setScrub((t) => {
        const next = t + dt;
        return next >= active.durationMs ? active.durationMs : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, active, playing]);

  useEffect(() => {
    if (mode !== "replay" || !active) return;
    const s = sampleAt(active.samples, scrub);
    if (!s) return;
    setSample(s);
    setHistory(active.samples.filter((x) => x.t <= scrub && scrub - x.t <= HISTORY_MS));
    if (playing && scrub >= active.durationMs) setPlaying(false);
  }, [mode, active, scrub, playing]);

  const currentPreset = useMemo(
    () => PRESETS.find((p) => p.id === preset) ?? PRESETS[0],
    [preset],
  );
  const phase = breathPhase(history);

  function startRecording() {
    bufferRef.current = [];
    setBuffer([]);
    setActive(null);
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
    setMode("replay");
    if (session.scenario && PRESETS.some((p) => p.id === session.scenario)) {
      setPreset(session.scenario as PresetId);
    }
  }

  function backToLive() {
    setPlaying(false);
    setActive(null);
    setMode("live");
    source.current = new MockBreathSource(preset);
  }

  function deleteSession(id: string) {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    saveSessions(next);
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
            <span className={`phase-pill ${phase}`}>
              {phase === "inhale" ? "Inhale" : phase === "exhale" ? "Exhale" : "Still"}
            </span>
            {mode === "recording" && <span className="mode-pill rec">Recording</span>}
            {mode === "replay" && <span className="mode-pill">Replay</span>}
          </div>
          <TorsoMap sample={sample} showLandmarks={landmarks} />
          <CrossSection sample={sample} />
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
            <label className="check">
              <input
                type="checkbox"
                checked={landmarks}
                onChange={(e) => setLandmarks(e.target.checked)}
              />
              Points of interest
            </label>
          </div>

          <TracePanel history={history} />
          <div className="console-row">
            <KonnoMead history={history} />
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
            <p className="status rec">Recording · {formatTime(buffer.at(-1)?.t ?? 0)}</p>
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
            </>
          ) : (
            <p className="status">Live mock · no camera · {currentPreset.label}</p>
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

      {sessions.length > 0 && (
        <section className="takes">
          <h2>Saved takes</h2>
          <ul>
            {sessions.map((s) => (
              <li key={s.id} className="take-row">
                <button type="button" className="take-open" onClick={() => openSession(s)}>
                  <strong>
                    {PRESETS.find((p) => p.id === s.scenario)?.label ?? s.scenario ?? s.protocol}
                  </strong>
                  <span>
                    {new Date(s.startedAt).toLocaleString()} · {(s.durationMs / 1000).toFixed(1)}s
                    {s.notes ? " · noted" : ""}
                  </span>
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
        </section>
      )}

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
