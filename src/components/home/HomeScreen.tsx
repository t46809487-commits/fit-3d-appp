import React from 'react';
import { UserProfile, WorkoutRoutine, Exercise, FitnessGoal } from '../../types';
import { Human3DModel } from '../3d/Human3DModel';
import { Flame, Play, Clock, Sparkles, ChevronRight, Zap, Target } from 'lucide-react';

interface HomeScreenProps {
  userProfile: UserProfile;
  todayWorkout: WorkoutRoutine;
  recommendedExercises: Exercise[];
  onStartWorkout: (routine: WorkoutRoutine) => void;
  onSelectExercise: (exercise: Exercise) => void;
  onFilterByBodyPart: (part: string) => void;
  onChangeGoal: (goal: FitnessGoal) => void;
  onOpenBoxing: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  todayWorkout,
  recommendedExercises,
  onStartWorkout,
  onSelectExercise,
  onFilterByBodyPart,
  onChangeGoal,
  onOpenBoxing,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      
      {/* User Greeting & Streak Bar */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {getGreeting()}, <span className="text-orange-500">{userProfile.displayName}</span>
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-0.5">
            Ready for today's biomechanics training?
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-sm">
            <Flame className="w-4 h-4 fill-orange-500" />
            <span className="text-xs font-black font-mono">{userProfile.streak}D STREAK</span>
          </div>
        </div>
      </div>

      {/* Hero: Today's Workout Card (PRD page 5) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 p-6 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40">
                TODAY'S WORKOUT
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                {todayWorkout.level} • {todayWorkout.category}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {todayWorkout.title}
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm mt-1">
                {todayWorkout.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-neutral-300">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>{todayWorkout.durationMinutes} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>{todayWorkout.caloriesEstimate} kcal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{todayWorkout.exercises.length} Exercises</span>
              </div>
            </div>

            <button
              onClick={() => onStartWorkout(todayWorkout)}
              className="mt-2 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm tracking-wider shadow-lg shadow-orange-500/30 transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              START WORKOUT
            </button>
          </div>

          {/* Mini 3D Preview Widget */}
          <div className="w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-inner flex-shrink-0">
            <Human3DModel
              primaryMuscles={todayWorkout.exercises[0]?.primaryMuscles || ['mid_chest_l', 'mid_chest_r']}
              secondaryMuscles={todayWorkout.exercises[0]?.secondaryMuscles || ['triceps_l', 'triceps_r']}
              animationType={todayWorkout.exercises[0]?.animationType || 'pushup'}
              equipment={todayWorkout.exercises[0]?.equipment}
              characterId={userProfile.preferredCharacter || 'CHAR-M-01'}
              avatarConfig={userProfile.avatarConfig}
              height="100%"
              showControls={false}
              interactive={false}
            />
          </div>
        </div>
      </div>

      {/* Your Goal Bar (PRD page 5) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-400">
            <Target className="w-4 h-4 text-orange-500" />
            Your Current Goal
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            'Fat Loss',
            'Build Muscle',
            'Build Abs',
            'Arms',
            'Chest',
            'Back',
            'Shoulders',
            'Legs',
            'Boxing',
            'Mobility',
          ].map((g) => (
            <button
              key={g}
              onClick={() => onChangeGoal(g as FitnessGoal)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                userProfile.goal === g
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Exercises by Body Area (PRD page 5) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
            Quick Body Area Focus
          </h3>
          <span className="text-xs text-neutral-500">Tap to explore</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {['Abs', 'Arms', 'Chest', 'Legs', 'Back', 'Shoulders', 'Boxing', 'Mobility'].map((part) => (
            <button
              key={part}
              onClick={() => {
                if (part === 'Boxing') onOpenBoxing();
                else onFilterByBodyPart(part);
              }}
              className="py-2.5 px-2 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-800/80 text-center transition group active:scale-95"
            >
              <div className="text-xs font-black text-neutral-200 group-hover:text-orange-400">
                {part}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended For You - 3D Exercise Cards Carousel (PRD page 5) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
            Recommended 3D Exercises
          </h3>
          <span className="text-xs text-orange-400 font-semibold">Live 3D Biomechanics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recommendedExercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => onSelectExercise(exercise)}
              className="group cursor-pointer rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 overflow-hidden shadow-lg hover:shadow-orange-500/10 transition flex flex-col"
            >
              {/* 3D Model viewport */}
              <div className="h-44 bg-neutral-950 relative">
                <Human3DModel
                  primaryMuscles={exercise.primaryMuscles}
                  secondaryMuscles={exercise.secondaryMuscles}
                  animationType={exercise.animationType}
                  equipment={exercise.equipment}
                  height="100%"
                  showControls={false}
                  interactive={false}
                />
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-neutral-300 border border-neutral-800">
                  {exercise.difficulty}
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition">
                    {exercise.name}
                  </h4>
                  <div className="text-[11px] text-neutral-400 capitalize">
                    {exercise.primaryMuscles.map(m => m.replace('_', ' ')).join(', ')}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                  <span>{exercise.equipment[0]}</span>
                  <span className="text-orange-400 font-semibold flex items-center gap-1">
                    Inspect 3D Form <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
