import React, { useState } from 'react';
import { Exercise, CharacterModelId, AvatarConfiguration } from '../../types';
import { Human3DModel } from '../3d/Human3DModel';
import { X, Heart, Play, Clock, Flame, Dumbbell, AlertTriangle, Wind, Info, Plus, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getExerciseInfo } from '../../data/exerciseInfo';
import { LEVEL_INFO, muscleLabels } from '../../utils/difficulty';
import { markExercisesCompleted, unmarkExercise, useWorkoutProgress } from '../../utils/workoutProgress';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
  onStartExercise: (exercise: Exercise) => void;
  onAddToCustomWorkout?: (exercise: Exercise) => void;
  characterId?: CharacterModelId;
  avatarConfig?: AvatarConfiguration;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onStartExercise,
  onAddToCustomWorkout,
  characterId,
  avatarConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'3d' | 'instructions' | 'mistakes'>('3d');
  const progress = useWorkoutProgress();

  if (!isOpen || !exercise) return null;

  const levelInfo = LEVEL_INFO[exercise.difficulty];
  const { description, safetyTips } = getExerciseInfo(exercise);
  const done = progress[exercise.id];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[94vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {exercise.category} • {exercise.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(exercise.id)}
              className="p-2 rounded-xl bg-neutral-800/80 text-neutral-300 hover:text-red-500 hover:bg-neutral-800 transition"
              title="Save to Favorites"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Model Hero Section (PRD Hero Feature, page 8 & 13) */}
        <div className="relative w-full h-72 sm:h-80 bg-neutral-950 flex-shrink-0">
          <Human3DModel
            primaryMuscles={exercise.primaryMuscles}
            secondaryMuscles={exercise.secondaryMuscles}
            animationType={exercise.animationType}
            equipment={exercise.equipment}
            characterId={characterId || exercise.characterId || 'CHAR-M-01'}
            avatarConfig={avatarConfig}
            height="100%"
            showControls={true}
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Title & Quick Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">{exercise.name}</h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-medium">
                  {exercise.equipment.join(', ')}
                </span>
                <span>•</span>
                <span className="text-orange-400 font-semibold">{exercise.movementPattern}</span>
                {exercise.tempo && (
                  <>
                    <span>•</span>
                    <span className="text-cyan-400 font-mono font-bold">Tempo {exercise.tempo}</span>
                  </>
                )}
                {exercise.animationId && (
                  <span className="text-[10px] font-mono text-neutral-500 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                    {exercise.animationId}
                  </span>
                )}
              </div>
            </div>

            {/* Reps, Sets, Calorie Pills */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-bold text-white">{exercise.sets} sets × {exercise.reps} reps</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-400 font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>{exercise.caloriesEstimate} kcal</span>
              </div>
            </div>
          </div>

          {/* Muscle Mapping Indicator (PRD section 12 & 13) */}
          <div className="p-3.5 rounded-2xl bg-neutral-800/50 border border-neutral-800 space-y-2">
            <div className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider">
              Anatomical Muscle Targets
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                <span className="text-xs text-neutral-300 font-semibold">
                  Primary:{' '}
                  <span className="text-white capitalize">
                    {exercise.primaryMuscles.map(m => m.replace('_', ' ')).join(', ')}
                  </span>
                </span>
              </div>

              {exercise.secondaryMuscles.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="text-xs text-neutral-400">
                    Secondary:{' '}
                    <span className="text-neutral-200 capitalize">
                      {exercise.secondaryMuscles.map(m => m.replace('_', ' ')).join(', ')}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Overview: description, difficulty, sets / reps / rest */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${levelInfo.chip}`}>
                {levelInfo.badge} • {exercise.difficulty}
              </span>
              {exercise.equipment.map((eq) => (
                <span key={eq} className="px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 text-[11px] font-semibold">{eq}</span>
              ))}
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">{description}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-neutral-800/70 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Sets</div>
                <div className="text-base font-black text-white">{exercise.sets}</div>
              </div>
              <div className="rounded-2xl bg-neutral-800/70 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">{exercise.durationSeconds ? 'Time' : 'Reps'}</div>
                <div className="text-base font-black text-white">{exercise.durationSeconds ? `${exercise.durationSeconds}s` : exercise.reps}</div>
              </div>
              <div className="rounded-2xl bg-neutral-800/70 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Rest</div>
                <div className="text-base font-black text-white">{exercise.restSeconds}s</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 mr-1">Target</span>
              {muscleLabels(exercise.primaryMuscles).map((m) => (
                <span key={m} className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-semibold">{m}</span>
              ))}
              {muscleLabels(exercise.secondaryMuscles).map((m) => (
                <span key={m} className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-semibold">{m}</span>
              ))}
            </div>
          </div>

          {/* Breathing Pattern Cue (PRD page 16) */}
          {exercise.breathingPattern && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-200 text-xs">
              <Wind className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-400 block">Breathing Cadence</span>
                {exercise.breathingPattern}
              </div>
            </div>
          )}

          {/* Step-by-Step Instructions */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-500" />
              Proper Execution & Form
            </h3>
            <div className="space-y-2">
              {exercise.instructions.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-300">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-orange-400 flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Common Mistakes to Avoid (PRD page 16) */}
          {exercise.commonMistakes.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Common Mistakes to Avoid
              </h3>
              <div className="space-y-2">
                {exercise.commonMistakes.map((mistake, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-400">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{mistake}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety tips */}
          {safetyTips.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Safety Tips
              </h3>
              <div className="space-y-2">
                {safetyTips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center gap-3">
          <button
            onClick={() => (done ? unmarkExercise(exercise.id) : markExercisesCompleted([exercise.id]))}
            className={`px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
              done ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
            }`}
            title={done ? 'Completed - tap to undo' : 'Mark as completed'}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">{done ? `Done ×${done.count}` : 'Mark done'}</span>
          </button>
          {onAddToCustomWorkout && (
            <button
              onClick={() => onAddToCustomWorkout(exercise)}
              className="px-4 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-bold flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add to Plan</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onStartExercise(exercise);
            }}
            className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            START THIS EXERCISE
          </button>
        </div>
      </div>
    </div>
  );
};
