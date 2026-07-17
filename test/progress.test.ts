import { describe, expect, it } from "vitest";
import {
  loadProgress,
  markLevelComplete,
  nextUnplayedLevelId,
  saveProgress,
  type Progress,
} from "../src/storage/progress";

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
  length = 0;
  clear(): void {}
  getItem(): never {
    throw new Error("blocked");
  }
  key(): null {
    return null;
  }
  removeItem(): void {}
  setItem(): never {
    throw new Error("blocked");
  }
}

describe("loadProgress", () => {
  it("returns empty progress when nothing is stored", () => {
    expect(loadProgress(new FakeStorage())).toEqual({ completedLevelIds: [] });
  });

  it("round-trips progress saved via saveProgress", () => {
    const storage = new FakeStorage();
    const progress: Progress = { completedLevelIds: ["baseline", "rotated"] };
    saveProgress(storage, progress);
    expect(loadProgress(storage)).toEqual(progress);
  });

  it("falls back to empty progress on malformed JSON", () => {
    const storage = new FakeStorage();
    storage.setItem("bisect:progress", "{not json");
    expect(loadProgress(storage)).toEqual({ completedLevelIds: [] });
  });

  it("falls back to empty progress when the shape is wrong", () => {
    const storage = new FakeStorage();
    storage.setItem("bisect:progress", JSON.stringify({ completedLevelIds: "not-an-array" }));
    expect(loadProgress(storage)).toEqual({ completedLevelIds: [] });
  });

  it("does not throw when storage access is blocked", () => {
    expect(loadProgress(new ThrowingStorage())).toEqual({ completedLevelIds: [] });
    expect(() => saveProgress(new ThrowingStorage(), { completedLevelIds: [] })).not.toThrow();
  });
});

describe("markLevelComplete", () => {
  it("adds a new level id", () => {
    const result = markLevelComplete({ completedLevelIds: ["baseline"] }, "rotated");
    expect(result.completedLevelIds).toEqual(["baseline", "rotated"]);
  });

  it("is idempotent for an already-completed level", () => {
    const progress: Progress = { completedLevelIds: ["baseline"] };
    expect(markLevelComplete(progress, "baseline")).toEqual(progress);
  });
});

describe("nextUnplayedLevelId", () => {
  const order = ["baseline", "rotated", "duplicates"];

  it("returns the first level when nothing is completed", () => {
    expect(nextUnplayedLevelId(order, { completedLevelIds: [] })).toBe("baseline");
  });

  it("returns the first incomplete level after some are done", () => {
    expect(nextUnplayedLevelId(order, { completedLevelIds: ["baseline"] })).toBe("rotated");
  });

  it("returns the last level once everything is complete", () => {
    expect(nextUnplayedLevelId(order, { completedLevelIds: order })).toBe("duplicates");
  });
});
