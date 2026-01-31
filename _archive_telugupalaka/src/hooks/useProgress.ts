import { useCallback, useState, useEffect } from 'react';

const STORAGE_KEY = 'telugupalaka-progress';

export interface ProgressData {
  practicedIds: string[];
  practicedCounts: Record<string, number>;
}

function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { practicedIds: [], practicedCounts: {} };
    const data = JSON.parse(raw) as ProgressData;
    return {
      practicedIds: Array.isArray(data.practicedIds) ? data.practicedIds : [],
      practicedCounts: data.practicedCounts && typeof data.practicedCounts === 'object' ? data.practicedCounts : {},
    };
  } catch {
    return { practicedIds: [], practicedCounts: {} };
  }
}

function saveProgress(data: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function useProgress() {
  const [data, setData] = useState<ProgressData>(loadProgress);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setData(JSON.parse(e.newValue) as ProgressData);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const markPracticed = useCallback((letterId: string) => {
    setData((prev) => {
      const practicedIds = prev.practicedIds.includes(letterId)
        ? prev.practicedIds
        : [...prev.practicedIds, letterId];
      const practicedCounts = {
        ...prev.practicedCounts,
        [letterId]: (prev.practicedCounts[letterId] ?? 0) + 1,
      };
      const next = { practicedIds, practicedCounts };
      saveProgress(next);
      return next;
    });
  }, []);

  const practicedCount = data.practicedIds.length;
  const getPracticeCount = useCallback(
    (letterId: string) => data.practicedCounts[letterId] ?? 0,
    [data.practicedCounts]
  );

  return {
    practicedIds: data.practicedIds,
    practicedCounts: data.practicedCounts,
    practicedCount,
    getPracticeCount,
    markPracticed,
  };
}
