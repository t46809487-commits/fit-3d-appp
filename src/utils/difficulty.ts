import { FitnessLevel } from '../types';

// One place that defines how the three levels look (Easy / Medium / Hard).
export const LEVEL_INFO: Record<FitnessLevel, {
  badge: 'Easy' | 'Medium' | 'Hard';
  chip: string;      // badge classes
  dot: string;
  active: string;    // selected tab classes
  gradient: string;  // banner gradient used for generated workouts
  bar: string;
}> = {
  Beginner: {
    badge: 'Easy',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
    active: 'bg-emerald-500 text-white border-emerald-400',
    gradient: 'from-emerald-500/20 via-green-600/30 to-teal-600/20',
    bar: 'bg-emerald-400',
  },
  Intermediate: {
    badge: 'Medium',
    chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
    active: 'bg-amber-500 text-white border-amber-400',
    gradient: 'from-amber-500/20 via-orange-600/30 to-yellow-600/20',
    bar: 'bg-amber-400',
  },
  Advanced: {
    badge: 'Hard',
    chip: 'bg-red-500/15 text-red-300 border-red-500/30',
    dot: 'bg-red-400',
    active: 'bg-red-500 text-white border-red-400',
    gradient: 'from-red-500/20 via-rose-600/30 to-orange-600/20',
    bar: 'bg-red-400',
  },
};

export const LEVELS: FitnessLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

/** 'mid_chest_l' -> 'Mid Chest' (left/right merged, duplicates removed). */
export function muscleLabels(muscles: string[]): string[] {
  const out: string[] = [];
  muscles.forEach((m) => {
    const label = m
      .replace(/_(l|r)$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    if (!out.includes(label)) out.push(label);
  });
  return out;
}
