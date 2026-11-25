import React, { useState, useMemo } from 'react';
import { Exercise, MuscleName, BodyPartCategory, FitnessGoal, EquipmentType, FitnessLevel } from '../../types';
import { Human3DModel } from '../3d/Human3DModel';
import { Search, Filter, Heart, Eye, ChevronRight, Layers, Sparkles } from 'lucide-react';

interface ExploreScreenProps {
  exercises: Exercise[];
  favorites: string[];
  onSelectExercise: (exercise: Exercise) => void;
  onToggleFavorite: (exerciseId: string) => void;
  initialCategory?: string;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  exercises,
  favorites,
  onSelectExercise,
  onToggleFavorite,
  initialCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('All');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>(initialCategory || 'All');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleName | null>(null);
  const [showInteractiveAnatomy, setShowInteractiveAnatomy] = useState<boolean>(false);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ex.name.toLowerCase().includes(q);
        const matchesMuscle = ex.primaryMuscles.some((m) => m.toLowerCase().includes(q));
        const matchesCategory = ex.category.toLowerCase().includes(q);
        if (!matchesName && !matchesMuscle && !matchesCategory) return false;
      }

      // Goal
      if (selectedGoal !== 'All') {
        if (!ex.goals.includes(selectedGoal as FitnessGoal)) return false;
      }

      // Body Part
      if (selectedBodyPart !== 'All') {
        if (ex.bodyPart !== selectedBodyPart && ex.category !== selectedBodyPart) return false;
      }

      // Equipment
      if (selectedEquipment !== 'All') {
        if (!ex.equipment.includes(selectedEquipment as EquipmentType)) return false;
      }

      // Difficulty
      if (selectedDifficulty !== 'All') {
        if (ex.difficulty !== selectedDifficulty) return false;
      }

      // Direct Muscle Filter
      if (selectedMuscle) {
        if (!ex.primaryMuscles.includes(selectedMuscle) && !ex.secondaryMuscles.includes(selectedMuscle)) {
          return false;
        }
      }

      return true;
    });
  }, [exercises, searchQuery, selectedGoal, selectedBodyPart, selectedEquipment, selectedDifficulty, selectedMuscle]);

  const bodyParts = ['All', 'Chest', 'Back', 'Arms', 'Shoulders', 'Abs', 'Legs', 'Full Body', 'Boxing', 'Mobility'];
  const goals = ['All', 'Fat Loss', 'Build Muscle', 'Build Abs', 'Boxing', 'Mobility'];
  const equipmentOptions = ['All', 'No Equipment', 'Dumbbells', 'Barbell', 'Resistance Band', 'Bench', 'Pull-Up Bar'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      
      {/* Title & Search bar (PRD page 7) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Exercise Encyclopedia
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm mt-0.5">
              3D anatomical movements, form checks & muscle targeting
            </p>
          </div>

          <button
            onClick={() => setShowInteractiveAnatomy(!showInteractiveAnatomy)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              showInteractiveAnatomy
                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D Body Selector</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises, biceps, push-up, squat, abs..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-orange-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Interactive 3D Anatomy Muscle Picker (Hero Feature from PRD section 9 & 12) */}
      {showInteractiveAnatomy && (
        <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-orange-400">
              Interactive 3D Muscle Targeter (Rotate & Tap Muscles)
            </span>
            {selectedMuscle && (
              <button
                onClick={() => setSelectedMuscle(null)}
                className="text-xs text-neutral-400 hover:text-white underline"
              >
                Reset muscle filter
              </button>
            )}
          </div>

          <div className="h-64 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800">
            <Human3DModel
              primaryMuscles={selectedMuscle ? [selectedMuscle] : []}
              animationType="idle"
              height="100%"
              interactive={true}
              onMuscleClick={(muscle) => {
                setSelectedMuscle(muscle);
              }}
            />
          </div>

          <div className="text-xs text-neutral-400 text-center">
            {selectedMuscle ? (
              <span>
                Filtering by: <strong className="text-orange-400 capitalize">{selectedMuscle.replace('_', ' ')}</strong>
              </span>
            ) : (
              <span>Tap any muscle group on the 3D model to filter corresponding exercises</span>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs: Body Parts (PRD page 7) */}
      <div className="space-y-2">
        <div className="text-xs uppercase font-black tracking-wider text-neutral-400">
          Body Parts
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {bodyParts.map((part) => (
            <button
              key={part}
              onClick={() => setSelectedBodyPart(part)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedBodyPart === part
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {part}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs: Goals (PRD page 7) */}
      <div className="space-y-2">
        <div className="text-xs uppercase font-black tracking-wider text-neutral-400">
          Goals
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {goals.map((goal) => (
            <button
              key={goal}
              onClick={() => setSelectedGoal(goal)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedGoal === goal
                  ? 'bg-neutral-200 text-neutral-900 font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs: Equipment & Difficulty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] uppercase font-bold text-neutral-500 block mb-1">
            Equipment
          </label>
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            {equipmentOptions.map((eq) => (
              <option key={eq} value={eq} className="bg-neutral-900 text-white">
                {eq}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] uppercase font-bold text-neutral-500 block mb-1">
            Difficulty
          </label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            {difficulties.map((diff) => (
              <option key={diff} value={diff} className="bg-neutral-900 text-white">
                {diff}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exercise Cards Grid (PRD page 8: Exercise Card) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Found {filteredExercises.length} Exercises</span>
          {selectedMuscle && (
            <span className="text-orange-400 font-bold">Filtered by {selectedMuscle}</span>
          )}
        </div>

        {filteredExercises.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 space-y-2">
            <p className="text-neutral-300 font-bold">No exercises matched your filters.</p>
            <p className="text-neutral-500 text-xs">Try clearing search or picking another muscle group.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise) => {
              const isFav = favorites.includes(exercise.id);

              return (
                <div
                  key={exercise.id}
                  className="group rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 overflow-hidden shadow-lg transition flex flex-col cursor-pointer"
                  onClick={() => onSelectExercise(exercise)}
                >
                  {/* 3D Model Visual Card Header */}
                  <div className="h-48 bg-neutral-950 relative overflow-hidden">
                    <Human3DModel
                      primaryMuscles={exercise.primaryMuscles}
                      secondaryMuscles={exercise.secondaryMuscles}
                      animationType={exercise.animationType}
                      equipment={exercise.equipment}
                      height="100%"
                      showControls={false}
                      interactive={false}
                    />

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(exercise.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md text-neutral-300 hover:text-red-500 hover:bg-black/80 transition z-10"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>

                    {/* Difficulty Badge */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-neutral-300 border border-neutral-800">
                      {exercise.difficulty}
                    </div>
                  </div>

                  {/* Exercise Card Info (PRD page 8) */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-orange-400 transition">
                        {exercise.name}
                      </h3>
                      
                      <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-red-400 font-semibold capitalize">
                          {exercise.primaryMuscles[0]?.replace('_', ' ')}
                        </span>
                        {exercise.secondaryMuscles.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{exercise.secondaryMuscles[0]?.replace('_', ' ')}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{exercise.equipment[0]}</span>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-mono">
                        {exercise.sets} sets × {exercise.reps} reps
                      </span>
                      <span className="text-orange-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        3D Form <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
