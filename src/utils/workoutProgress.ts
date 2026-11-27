import { useSyncExternalStore } from 'react';

// Tracks which exercises the user has completed (saved on this device).
export interface ExerciseProgress { count: number; last: string }
export type ProgressStore = Record<string, ExerciseProgress>;

const KEY = 'fit3d_exercise_progress_v1';
const listeners = new Set<() => void>();

function load(): ProgressStore {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as ProgressStore;
    }
  } catch {
    // ignore corrupted data
  }
  return {};
}

let current: ProgressStore = load();

function commit(next: ProgressStore) {
  current = next; // new object so React notices the change
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // storage may be blocked; progress still works for this session
  }
  listeners.forEach((l) => l());
}

export function markExercisesCompleted(ids: string[]) {
  if (!ids.length) return;
  const next: ProgressStore = { ...current };
  const now = new Date().toISOString();
  ids.forEach((id) => {
    next[id] = { count: (next[id]?.count ?? 0) + 1, last: now };
  });
  commit(next);
}

export function unmarkExercise(id: string) {
  if (!current[id]) return;
  const next = { ...current };
  delete next[id];
  commit(next);
}

export function useWorkoutProgress(): ProgressStore {
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    () => current,
    () => current
  );
}
