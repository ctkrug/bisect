const STORAGE_KEY = "bisect:progress";

export interface Progress {
  completedLevelIds: string[];
}

const EMPTY_PROGRESS: Progress = { completedLevelIds: [] };

/** Reads progress from storage; corrupted or missing data safely falls back to empty. */
export function loadProgress(storage: Storage): Progress {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_PROGRESS;
  }
  if (!raw) return EMPTY_PROGRESS;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray((parsed as { completedLevelIds?: unknown }).completedLevelIds)
    ) {
      return EMPTY_PROGRESS;
    }
    const ids = (parsed as { completedLevelIds: unknown[] }).completedLevelIds.filter(
      (id): id is string => typeof id === "string",
    );
    return { completedLevelIds: ids };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(storage: Storage, progress: Progress): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (private browsing, quota) — progress just won't persist this session.
  }
}

export function markLevelComplete(progress: Progress, levelId: string): Progress {
  if (progress.completedLevelIds.includes(levelId)) return progress;
  return { completedLevelIds: [...progress.completedLevelIds, levelId] };
}

/** The first level id not yet completed, or the last level if everything is done. */
export function nextUnplayedLevelId(levelIds: string[], progress: Progress): string {
  const next = levelIds.find((id) => !progress.completedLevelIds.includes(id));
  return next ?? levelIds[levelIds.length - 1];
}
