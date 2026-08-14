import type { PresetId, Sample } from "../types";
import { synthesize } from "./synthesize";

export type Unsubscribe = () => void;

export interface BreathSource {
  start(): void;
  stop(): void;
  subscribe(cb: (sample: Sample) => void): Unsubscribe;
}

export class MockBreathSource implements BreathSource {
  private listeners = new Set<(sample: Sample) => void>();
  private raf = 0;
  private origin = 0;
  private running = false;
  private preset: PresetId;

  constructor(preset: PresetId = "abdominal") {
    this.preset = preset;
  }

  setPreset(preset: PresetId): void {
    this.preset = preset;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.origin = performance.now() - 1150;
    const tick = (now: number) => {
      if (!this.running) return;
      const sample = synthesize(now - this.origin, this.preset);
      this.listeners.forEach((cb) => cb(sample));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  subscribe(cb: (sample: Sample) => void): Unsubscribe {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}
