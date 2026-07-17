/** In-memory Storage fallback used when real browser storage is unavailable. */
class MemoryStorage implements Storage {
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

const PROBE_KEY = "bisect:storage-probe";

/**
 * Resolves a working Storage, falling back to an in-memory store when
 * accessing `access()` itself throws — some browsers (private-browsing
 * Safari, cookies/storage disabled) throw on the `localStorage` getter
 * itself, not just on get/set, which would otherwise crash the app before
 * any of progress.ts's or sfx.ts's own try/catch guards ever run.
 */
export function getSafeStorage(access: () => Storage): Storage {
  try {
    const storage = access();
    storage.setItem(PROBE_KEY, "1");
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return new MemoryStorage();
  }
}
