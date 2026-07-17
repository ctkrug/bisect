const MUTE_KEY = "bisect:muted";

export function loadMuted(storage: Storage): boolean {
  try {
    return storage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(storage: Storage, muted: boolean): void {
  try {
    storage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Storage unavailable — mute preference just won't persist this session.
  }
}

function getAudioContextCtor(): (new () => AudioContext) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { AudioContext?: new () => AudioContext; webkitAudioContext?: new () => AudioContext };
  return w.AudioContext ?? w.webkitAudioContext;
}

/**
 * Synthesized WebAudio SFX per docs/DESIGN.md §5: tick / narrow / success /
 * error, each generated with oscillators/noise (no audio files). The
 * AudioContext is created lazily on first sound (autoplay policy) and every
 * call is a safe no-op in environments without WebAudio or while muted.
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private muted: boolean;

  constructor(private storage: Storage) {
    this.muted = loadMuted(storage);
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    saveMuted(this.storage, this.muted);
    return this.muted;
  }

  private context(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const Ctor = getAudioContextCtor();
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(frequency: number, durationSec: number, type: OscillatorType, gainPeak: number): void {
    const ctx = this.context();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationSec);
  }

  /** Short blip on every guess submit. */
  tick(): void {
    this.tone(880, 0.03, "sine", 0.15);
  }

  /** Filtered noise "whoosh" on the split animation. */
  narrow(): void {
    const ctx = this.context();
    if (!ctx) return;
    const duration = 0.08;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  }

  /** Two-note ascending chime on level win. */
  success(): void {
    this.tone(660, 0.1, "sine", 0.18);
    const ctx = this.context();
    if (!ctx) return;
    setTimeout(() => this.tone(990, 0.12, "sine", 0.18), 90);
  }

  /** Low buzz on invalid input. */
  error(): void {
    this.tone(140, 0.12, "square", 0.1);
  }
}
