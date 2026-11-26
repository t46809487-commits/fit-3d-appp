import React, { useState } from 'react';
import { Exercise, FitnessLevel, WorkoutRoutine } from '../../types';
import { LEVEL_PROGRAMS, Intensity } from '../../data/levelWorkouts';

interface LevelProgramsProps {
  onStart: (routine: WorkoutRoutine) => void;
  recommendedLevel?: FitnessLevel;
}

// Full class names on purpose (Tailwind needs them written out)
const STYLE: Record<
  FitnessLevel,
  { tabOn: string; chip: string; bar: string; text: string; btn: string }
> = {
  Beginner: {
    tabOn: 'bg-emerald-500 text-white border-emerald-400',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    bar: 'bg-emerald-400',
    text: 'text-emerald-300',
    btn: 'bg-emerald-600 hover:bg-emerald-500',
  },
  Intermediate: {
    tabOn: 'bg-amber-500 text-white border-amber-400',
    chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    bar: 'bg-amber-400',
    text: 'text-amber-300',
    btn: 'bg-amber-600 hover:bg-amber-500',
  },
  Advanced: {
    tabOn: 'bg-red-500 text-white border-red-400',
    chip: 'bg-red-500/15 text-red-300 border-red-500/30',
    bar: 'bg-red-400',
    text: 'text-red-300',
    btn: 'bg-red-600 hover:bg-red-500',
  },
};

const HOW_HARD: Record<FitnessLevel, string> = {
  Beginner: '2 sets • lighter reps • longer rests',
  Intermediate: '3 sets • normal reps • steady rests',
  Advanced: '3–4 sets • heavy & explosive • short pushes',
};

const fmtMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`);

const prescription = (e: Exercise) =>
  e.durationSeconds ? `${e.sets} × ${e.durationSeconds}s` : `${e.sets} × ${e.reps} reps`;

const DifficultyMeter: React.FC<{ level: FitnessLevel; bars: number; label: Intensity }> = ({ level, bars, label }) => (
  <div className="flex items-center gap-2">
    <div className="flex items-end gap-1" aria-hidden>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`w-1.5 rounded-sm ${n <= bars ? STYLE[level].bar : 'bg-neutral-700'}`}
          style={{ height: 6 + n * 5 }}
        />
      ))}
    </div>
    <span className={`text-xs font-black uppercase tracking-wider ${STYLE[level].text}`}>{label}</span>
  </div>
);

export const LevelPrograms: React.FC<LevelProgramsProps> = ({ onStart, recommendedLevel }) => {
  const [level, setLevel] = useState<FitnessLevel>(recommendedLevel ?? 'Beginner');
  const program = LEVEL_PROGRAMS.find((p) => p.level === level) ?? LEVEL_PROGRAMS[0];
  const st = STYLE[program.level];

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-orange-400">Level Programs</h2>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          3 levels • {program.totalExercises} different exercises in each • 4 days per level
        </p>
      </div>

      {/* Level selector */}
      <div className="grid grid-cols-3 gap-2">
        {LEVEL_PROGRAMS.map((p) => {
          const on = p.level === level;
          return (
            <button
              key={p.level}
              onClick={() => setLevel(p.level)}
              className={`relative rounded-2xl border px-2 py-3 text-center transition active:scale-95 ${
                on ? STYLE[p.level].tabOn : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div className="text-xl">{p.emoji}</div>
              <div className="text-[11px] font-black uppercase tracking-wide mt-0.5">{p.level}</div>
              <div className={`text-[10px] font-bold ${on ? 'text-white/80' : 'text-neutral-500'}`}>{p.intensity}</div>
              {recommendedLevel === p.level && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-orange-500 text-[8px] font-black uppercase text-white whitespace-nowrap">
                  For you
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected level */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        <div className={`bg-gradient-to-br ${program.gradient} p-5 space-y-3`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-white">{program.title}</h3>
              <p className="text-xs text-neutral-300 mt-0.5">{program.tagline}</p>
            </div>
            <span className="text-3xl">{program.emoji}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-black uppercase ${st.chip}`}>
              Level: {program.level}
            </span>
            <DifficultyMeter level={program.level} bars={program.bars} label={program.intensity} />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-200 font-mono">
            <span>🏋️ {program.totalExercises} exercises</span>
            <span>📅 {program.days.length} days</span>
            <span>⏱️ ~{fmtMinutes(program.avgDayMinutes)}/day</span>
          </div>
          <p className="text-[11px] text-neutral-300">{HOW_HARD[program.level]}</p>
        </div>

        <div className="p-4 space-y-3">
          {program.days.map((day, dayIdx) => (
            <div key={day.id} className="rounded-2xl bg-neutral-950/60 border border-neutral-800 p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">
                    {day.title} <span className="text-neutral-500 font-bold">•</span> {day.focus}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    ⏱️ {fmtMinutes(day.routine.durationMinutes)} • 🔥 {day.routine.caloriesEstimate} kcal • {day.exercises.length} exercises
                  </div>
                </div>
                <button
                  onClick={() => onStart(day.routine)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wider transition active:scale-95 ${st.btn}`}
                >
                  Start
                </button>
              </div>

              <details>
                <summary className="cursor-pointer text-[11px] font-bold text-neutral-400 hover:text-white select-none">
                  View exercises
                </summary>
                <ol className="mt-2 space-y-1.5">
                  {day.exercises.map((ex, i) => (
                    <li
                      key={ex.id}
                      className="flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 px-2.5 py-2"
                    >
                      <span className="w-6 shrink-0 text-center text-[11px] font-black text-neutral-500">
                        {dayIdx * 7 + i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{ex.name}</div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {ex.equipment.join(', ')} • rest {ex.restSeconds}s
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-neutral-300">{prescription(ex)}</span>
                        <div className="flex gap-1">
                          <span className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase ${st.chip}`}>
                            {ex.difficulty}
                          </span>
                          <span className="px-1.5 py-0.5 rounded border border-neutral-700 text-[9px] font-black uppercase text-neutral-300">
                            {program.intensity}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            </div>
          ))}

          <button
            onClick={() => onStart(program.fullRoutine)}
            className="w-full py-2.5 rounded-xl border border-neutral-700 text-[11px] font-bold text-neutral-300 hover:text-white hover:border-neutral-500 transition"
          >
            Start all {program.totalExercises} exercises in one go (~{fmtMinutes(program.fullRoutine.durationMinutes)})
          </button>
        </div>
      </div>
    </div>
  );
};
