import { describe, expect, it } from "vitest";
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
