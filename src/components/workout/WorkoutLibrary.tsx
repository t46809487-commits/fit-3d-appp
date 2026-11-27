import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock, Dumbbell, Play, RotateCcw } from 'lucide-react';
import { BodyPartCategory, Exercise, FitnessLevel, WorkoutRoutine } from '../../types';
import { EXERCISES_DATABASE } from '../../data/exercises';
import { LEVELS, LEVEL_INFO, muscleLabels } from '../../utils/difficulty';
import { markExercisesCompleted, unmarkExercise, useWorkoutProgress } from '../../utils/workoutProgress';

const CATEGORIES: Array<{ id: BodyPartCategory; emoji: string }> = [
  { id: 'Chest', emoji: '💪' },
  { id: 'Back', emoji: '🦍' },
  { id: 'Arms', emoji: '🦾' },
  { id: 'Shoulders', emoji: '🏋️' },
  { id: 'Abs', emoji: '🎯' },
  { id: 'Legs', emoji: '🦵' },
  { id: 'Full Body', emoji: '⚡' },
  { id: 'Boxing', emoji: '🥊' },
  { id: 'Mobility', emoji: '🧘' },
];

const exerciseSeconds = (e: Exercise) => (e.durationSeconds || Math.max(30, e.reps * 3)) * Math.max(1, e.sets) + (e.restSeconds || 30) * Math.max(0, e.sets - 1);

interface WorkoutLibraryProps {
  onStartRoutine: (routine: WorkoutRoutine) => void;
  onSelectExercise: (exercise: Exercise) => void;
}

export const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({ onStartRoutine, onSelectExercise }) => {
  const [category, setCategory] = useState<BodyPartCategory>('Chest');
  const [level, setLevel] = useState<FitnessLevel>('Beginner');
  const progress = useWorkoutProgress();

  // Every category, split by level (only exercises of the chosen level are shown)
  const byCategory = useMemo(() => {
    const map: Record<string, Record<FitnessLevel, Exercise[]>> = {};
    CATEGORIES.forEach((c) => { map[c.id] = { Beginner: [], Intermediate: [], Advanced: [] }; });
    EXERCISES_DATABASE.forEach((e) => {
      if (map[e.category]) map[e.category][e.difficulty].push(e);
    });
    return map;
  }, []);

  const levelList = byCategory[category][level];
  const allInCategory = LEVELS.flatMap((l) => byCategory[category][l]);
  const doneInLevel = levelList.filter((e) => progress[e.id]).length;
  const doneInCategory = allInCategory.filter((e) => progress[e.id]).length;
  const info = LEVEL_INFO[level];

  const startLevelWorkout = () => {
    if (!levelList.length) return;
    const seconds = levelList.reduce((acc, e) => acc + exerciseSeconds(e), 0);
    onStartRoutine({
      id: `LIB_${category.replace(/\s/g, '').toUpperCase()}_${level.toUpperCase()}`,
      title: `${category} • ${level}`,
      subtitle: `${levelList.length} ${info.badge.toLowerCase()} moves`,
      durationMinutes: Math.max(1, Math.round(seconds / 60)),
      level,
      goal: levelList[0].goals[0] || 'Build Muscle',
      category,
      caloriesEstimate: levelList.reduce((acc, e) => acc + e.caloriesEstimate * e.sets, 0),
      bannerGradient: info.gradient,
      exercises: levelList.map((e) => ({ ...e })),
    });
  };

  return (
    <section className="space-y-4" aria-label="Exercise library">
      <div className="space-y-1">
        <h2 className="text-sm font-black uppercase tracking-wider text-orange-400">Exercise Library</h2>
        <p className="text-neutral-400 text-xs sm:text-sm">
          Pick a muscle group, then choose your level. Each exercise has a 3D demo, steps and safety tips.
        </p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Exercise categories">
        {CATEGORIES.map((c) => {
          const total = LEVELS.reduce((n, l) => n + byCategory[c.id][l].length, 0);
          const selected = c.id === category;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setCategory(c.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                selected
                  ? 'bg-orange-500 text-white border-orange-400'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <span className="mr-1.5">{c.emoji}</span>
              {c.id}
              <span className={`ml-1.5 font-mono ${selected ? 'text-orange-100' : 'text-neutral-500'}`}>{total}</span>
            </button>
          );
        })}
      </div>

      {/* Levels */}
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Difficulty level">
        {LEVELS.map((l) => {
          const li = LEVEL_INFO[l];
          const selected = l === level;
          return (
            <button
              key={l}
              role="tab"
              aria-selected={selected}
              onClick={() => setLevel(l)}
              className={`py-2.5 px-2 rounded-2xl border text-center transition active:scale-95 ${
                selected ? li.active : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <span className="block text-xs sm:text-sm font-black">{l}</span>
              <span className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${selected ? 'text-white/90' : 'text-neutral-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${li.dot}`} />
                {li.badge} • {byCategory[category][l].length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-200">{level} progress</span>
          <span className="font-mono text-neutral-400">{doneInLevel} / {levelList.length} done</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${info.bar}`}
            style={{ width: `${levelList.length ? (doneInLevel / levelList.length) * 100 : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-500">
          <span>{category} overall</span>
          <span className="font-mono">{doneInCategory} / {allInCategory.length}</span>
        </div>
      </div>

      {/* Exercise list (only the selected level) */}
      {levelList.length === 0 ? (
        <div className="rounded-2xl bg-neutral-900 border border-dashed border-neutral-700 p-5 text-center text-xs text-neutral-400">
          No {info.badge.toLowerCase()} {category.toLowerCase()} exercises yet. More are being added.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {levelList.map((e, idx) => {
              const done = !!progress[e.id];
              return (
                <div
                  key={e.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectExercise(e)}
                  onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelectExercise(e); } }}
                  className="text-left rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 p-3.5 flex items-start gap-3 cursor-pointer transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5 ${
                    done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-orange-400'
                  }`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </span>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black text-white leading-tight">{e.name}</h3>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${info.chip}`}>
                        {info.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">{muscleLabels(e.primaryMuscles).join(' • ')}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-300 font-mono">
                      <span className="inline-flex items-center gap-1"><Dumbbell className="w-3 h-3 text-orange-400" />{e.sets} × {e.durationSeconds ? `${e.durationSeconds}s` : e.reps}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-cyan-400" />Rest {e.restSeconds}s</span>
                      {progress[e.id] && <span className="text-emerald-400">Done ×{progress[e.id].count}</span>}
                    </div>
                  </div>

                  <button
                    onClick={(ev) => { ev.stopPropagation(); if (done) unmarkExercise(e.id); else markExercisesCompleted([e.id]); }}
                    className="flex-shrink-0 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition"
                    title={done ? 'Mark as not done' : 'Mark as done'}
                    aria-label={done ? `Mark ${e.name} as not done` : `Mark ${e.name} as done`}
                  >
                    {done ? <RotateCcw className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={startLevelWorkout}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-black tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            START {level.toUpperCase()} {category.toUpperCase()} WORKOUT
          </button>
        </>
      )}
    </section>
  );
};
