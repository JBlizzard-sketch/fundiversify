import { useState, useEffect } from "react";

const STORAGE_KEY = "fv_saved_jobs";

function readSaved(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function writeSaved(ids: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

export function useSavedJobs() {
  const [savedIds, setSavedIds] = useState<Set<number>>(() => readSaved());

  useEffect(() => {
    writeSaved(savedIds);
  }, [savedIds]);

  function toggle(id: number) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function isSaved(id: number) {
    return savedIds.has(id);
  }

  return { savedIds, toggle, isSaved };
}
