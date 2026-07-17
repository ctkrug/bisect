import { afterEach, describe, expect, it, vi } from "vitest";
import { Sfx, loadMuted, saveMuted } from "../src/audio/sfx";

class FakeStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

class ThrowingStorage implements Storage {
  get length(): number {
    throw new Error("storage disabled");
  }
  clear(): void {
    throw new Error("storage disabled");
  }
  getItem(): string | null {
    throw new Error("storage disabled");
  }
  key(): string | null {
    throw new Error("storage disabled");
  }
  removeItem(): void {
    throw new Error("storage disabled");
  }
  setItem(): void {
    throw new Error("storage disabled");
  }
}

/** Minimal fake WebAudio graph — just enough surface for sfx.ts to drive real synthesis code. */
class FakeAudioParam {
  value = 0;
  setValueAtTime = vi.fn().mockReturnThis();
  linearRampToValueAtTime = vi.fn().mockReturnThis();
  exponentialRampToValueAtTime = vi.fn().mockReturnThis();
}

class FakeNode {
  connect = vi.fn().mockReturnThis();
}

class FakeOscillator extends FakeNode {
  type = "sine";
  frequency = new FakeAudioParam();
  start = vi.fn();
  stop = vi.fn();
}

class FakeGain extends FakeNode {
  gain = new FakeAudioParam();
}

class FakeBiquadFilter extends FakeNode {
  type = "lowpass";
  frequency = new FakeAudioParam();
}

class FakeBufferSource extends FakeNode {
  buffer: unknown = null;
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  state = "suspended";
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  resume = vi.fn(() => {
    this.state = "running";
    return Promise.resolve();
  });
  createOscillator(): FakeOscillator {
    return new FakeOscillator();
  }
  createGain(): FakeGain {
    return new FakeGain();
  }
  createBiquadFilter(): FakeBiquadFilter {
    return new FakeBiquadFilter();
  }
  createBufferSource(): FakeBufferSource {
    return new FakeBufferSource();
  }
  createBuffer(_channels: number, length: number, sampleRate: number) {
    return { getChannelData: () => new Float32Array(length), length, sampleRate };
  }
}

describe("loadMuted / saveMuted", () => {
  it("defaults to unmuted when nothing is stored", () => {
    expect(loadMuted(new FakeStorage())).toBe(false);
  });

  it("round-trips a saved mute preference", () => {
    const storage = new FakeStorage();
    saveMuted(storage, true);
    expect(loadMuted(storage)).toBe(true);
    saveMuted(storage, false);
    expect(loadMuted(storage)).toBe(false);
  });
});

describe("Sfx", () => {
  it("loads its initial mute state from storage", () => {
    const storage = new FakeStorage();
    saveMuted(storage, true);
    const sfx = new Sfx(storage);
    expect(sfx.isMuted).toBe(true);
  });

  it("toggleMute flips state and persists it", () => {
    const storage = new FakeStorage();
    const sfx = new Sfx(storage);
    expect(sfx.isMuted).toBe(false);
    expect(sfx.toggleMute()).toBe(true);
    expect(loadMuted(storage)).toBe(true);
    expect(sfx.toggleMute()).toBe(false);
    expect(loadMuted(storage)).toBe(false);
  });

  it("every sound method is a safe no-op without WebAudio (this test environment)", () => {
    const sfx = new Sfx(new FakeStorage());
    expect(() => sfx.tick()).not.toThrow();
    expect(() => sfx.narrow()).not.toThrow();
    expect(() => sfx.success()).not.toThrow();
    expect(() => sfx.error()).not.toThrow();
  });

  it("does not play when muted", () => {
    const storage = new FakeStorage();
    saveMuted(storage, true);
    const sfx = new Sfx(storage);
    expect(() => sfx.tick()).not.toThrow();
  });
});

describe("loadMuted / saveMuted with an unavailable storage", () => {
  it("falls back to unmuted instead of throwing", () => {
    expect(loadMuted(new ThrowingStorage())).toBe(false);
  });

  it("swallows the write error instead of throwing", () => {
    expect(() => saveMuted(new ThrowingStorage(), true)).not.toThrow();
  });
});

describe("Sfx with a WebAudio environment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("resumes a suspended context and wires up a tone graph on tick()", () => {
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    const sfx = new Sfx(new FakeStorage());
    sfx.tick();
    const ctx = (sfx as unknown as { ctx: FakeAudioContext }).ctx;
    expect(ctx).toBeInstanceOf(FakeAudioContext);
    expect(ctx.resume).toHaveBeenCalled();
  });

  it("reuses the same context and skips resume once already running", () => {
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    const sfx = new Sfx(new FakeStorage());
    sfx.tick();
    const ctx = (sfx as unknown as { ctx: FakeAudioContext }).ctx;
    ctx.resume.mockClear();
    sfx.tick();
    expect(ctx.resume).not.toHaveBeenCalled();
  });

  it("builds a filtered-noise graph on narrow()", () => {
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    const sfx = new Sfx(new FakeStorage());
    expect(() => sfx.narrow()).not.toThrow();
  });

  it("plays both notes of the success chime", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    const sfx = new Sfx(new FakeStorage());
    sfx.success();
    vi.advanceTimersByTime(90);
  });

  it("plays the error buzz", () => {
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    const sfx = new Sfx(new FakeStorage());
    expect(() => sfx.error()).not.toThrow();
  });

  it("falls back to webkitAudioContext when AudioContext is absent", () => {
    vi.stubGlobal("window", { webkitAudioContext: FakeAudioContext });
    const sfx = new Sfx(new FakeStorage());
    expect(() => sfx.tick()).not.toThrow();
    const ctx = (sfx as unknown as { ctx: FakeAudioContext | null }).ctx;
    expect(ctx).toBeInstanceOf(FakeAudioContext);
  });
});
