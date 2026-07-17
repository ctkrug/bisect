import { describe, expect, it } from "vitest";
import { getSafeStorage } from "../src/storage/safeStorage";

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

describe("getSafeStorage", () => {
  it("returns the real storage when it works", () => {
    const real = new FakeStorage();
    const storage = getSafeStorage(() => real);
    storage.setItem("k", "v");
    expect(real.getItem("k")).toBe("v");
  });

  it("cleans up its probe key on the real storage", () => {
    const real = new FakeStorage();
    getSafeStorage(() => real);
    expect(real.getItem("bisect:storage-probe")).toBeNull();
  });

  it("falls back to an in-memory store when the accessor throws", () => {
    const storage = getSafeStorage(() => {
      throw new Error("SecurityError: storage disabled");
    });
    expect(() => storage.setItem("k", "v")).not.toThrow();
    expect(storage.getItem("k")).toBe("v");
  });

  it("falls back to an in-memory store when set/remove on the resolved storage throws", () => {
    const broken: Storage = {
      length: 0,
      clear() {},
      getItem: () => null,
      key: () => null,
      removeItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    const storage = getSafeStorage(() => broken);
    expect(() => storage.setItem("k", "v")).not.toThrow();
    expect(storage.getItem("k")).toBe("v");
  });

  it("implements the full Storage surface on the in-memory fallback", () => {
    const storage = getSafeStorage(() => {
      throw new Error("blocked");
    });
    expect(storage.length).toBe(0);
    storage.setItem("a", "1");
    storage.setItem("b", "2");
    expect(storage.length).toBe(2);
    expect(storage.key(0)).toBe("a");
    expect(storage.key(99)).toBeNull();
    storage.removeItem("a");
    expect(storage.getItem("a")).toBeNull();
    expect(storage.length).toBe(1);
    storage.clear();
    expect(storage.length).toBe(0);
    expect(storage.getItem("b")).toBeNull();
  });

  it("gives each call to the fallback its own independent store", () => {
    const a = getSafeStorage(() => {
      throw new Error("blocked");
    });
    const b = getSafeStorage(() => {
      throw new Error("blocked");
    });
    a.setItem("k", "from-a");
    expect(b.getItem("k")).toBeNull();
  });
});
