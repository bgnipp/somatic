import type { Session } from "../types";

const KEY = "somatic.sessions.v1";

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Session[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function downloadSession(session: Session): void {
  const blob = new Blob([JSON.stringify(session, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `somatic-${session.scenario ?? session.protocol}-${session.id.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseSession(raw: unknown): Session | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Session;
  if (typeof s.id !== "string" || !s.id) return null;
  if (!Array.isArray(s.samples) || s.samples.length === 0) return null;
  if (typeof s.durationMs !== "number" || !Number.isFinite(s.durationMs)) return null;
  return {
    id: s.id,
    startedAt: typeof s.startedAt === "string" ? s.startedAt : new Date().toISOString(),
    durationMs: s.durationMs,
    protocol: s.protocol ?? "quiet_standing",
    scenario: s.scenario,
    samples: s.samples,
    notes: typeof s.notes === "string" ? s.notes : "",
    audio: s.audio,
  };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
