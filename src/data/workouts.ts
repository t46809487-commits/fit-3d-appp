import { WorkoutRoutine, Exercise, FitnessGoal, FitnessLevel } from '../types';
import { EXERCISES_DATABASE } from './exercises';

export const PRESET_WORKOUTS: WorkoutRoutine[] = [
  {
    id: 'WOD_FAT_LOSS',
    title: 'Full Body Burn',
    subtitle: 'High-intensity calorie burning circuit',
    durationMinutes: 20,
    level: 'Beginner',
    goal: 'Fat Loss',
    category: 'Full Body',
    caloriesEstimate: 210,
    bannerGradient: 'from-amber-500/20 via-orange-600/30 to-red-600/20',
    exercises: [
      EXERCISES_DATABASE.find(e => e.id === 'EX018')!, // Jumping Jacks (warmup)
      EXERCISES_DATABASE.find(e => e.id === 'EX007')!, // Squat
      EXERCISES_DATABASE.find(e => e.id === 'EX017')!, // Mountain Climbers
      EXERCISES_DATABASE.find(e => e.id === 'EX001')!, // Push Up
      EXERCISES_DATABASE.find(e => e.id === 'EX019')!, // High Knees
      EXERCISES_DATABASE.find(e => e.id === 'EX066')!, // Cat-Cow (cooldown)
    ].filter(Boolean)
  },
  {
    id: 'WOD_ABS_CORE',
    title: 'Core Steel & Obliques',
    subtitle: 'Direct rectus abdominis & lower core definition',
    durationMinutes: 18,
    level: 'Intermediate',
    goal: 'Build Abs',
    category: 'Abs',
    caloriesEstimate: 160,
    bannerGradient: 'from-cyan-500/20 via-blue-600/30 to-indigo-600/20',
    exercises: [
      EXERCISES_DATABASE.find(e => e.id === 'EX014')!, // Abdominal Crunch
      EXERCISES_DATABASE.find(e => e.id === 'EX015')!, // Reverse Crunch
      EXERCISES_DATABASE.find(e => e.id === 'EX017')!, // Mountain Climbers
      EXERCISES_DATABASE.find(e => e.id === 'EX016')!, // Plank Hold
    ].filter(Boolean)
  },
  {
    id: 'WOD_ARMS_CHEST',
    title: 'Chest & Arms Hypertrophy',
    subtitle: 'Upper body pushing & arm building volume',
    durationMinutes: 25,
    level: 'Intermediate',
    goal: 'Build Muscle',
    category: 'Upper Body',
    caloriesEstimate: 230,
    bannerGradient: 'from-violet-500/20 via-purple-600/30 to-pink-600/20',
    exercises: [
      EXERCISES_DATABASE.find(e => e.id === 'EX001')!, // Standard Push-Up
      EXERCISES_DATABASE.find(e => e.id === 'EX004')!, // Standing Bicep Curl
      EXERCISES_DATABASE.find(e => e.id === 'EX005')!, // Diamond Push-Up
      EXERCISES_DATABASE.find(e => e.id === 'EX006')!, // Tricep Dips
      EXERCISES_DATABASE.find(e => e.id === 'EX013')!, // Lateral Raise
    ].filter(Boolean)
  },
  {
    id: 'WOD_BOXING_CAMP',
    title: 'Combat Conditioning',
    subtitle: 'Kinetic strike combinations & high output conditioning',
    durationMinutes: 22,
    level: 'Beginner',
    goal: 'Boxing',
    category: 'Boxing',
    caloriesEstimate: 280,
    bannerGradient: 'from-red-500/20 via-rose-600/30 to-orange-600/20',
    exercises: [
      EXERCISES_DATABASE.find(e => e.id === 'BX001')!, // Jab
      EXERCISES_DATABASE.find(e => e.id === 'BX002')!, // Cross
      EXERCISES_DATABASE.find(e => e.id === 'BX003')!, // Left Hook
      EXERCISES_DATABASE.find(e => e.id === 'BX004')!, // Right Uppercut
      EXERCISES_DATABASE.find(e => e.id === 'EX018')!, // Jumping Jacks
    ].filter(Boolean)
  },
  {
    id: 'WOD_MOBILITY_FLOW',
    title: 'Joint Freedom & Recovery',
    subtitle: 'Spinal decompression and shoulder mobility',
    durationMinutes: 15,
    level: 'Beginner',
    goal: 'Mobility',
    category: 'Mobility',
    caloriesEstimate: 95,
    bannerGradient: 'from-emerald-500/20 via-teal-600/30 to-cyan-600/20',
    exercises: [
      EXERCISES_DATABASE.find(e => e.id === 'EX066')!, // Cat-Cow
      EXERCISES_DATABASE.find(e => e.id === 'EX071')!, // Arm Circles (shoulder mobility)
      EXERCISES_DATABASE.find(e => e.id === 'EX007')!, // Gentle bodyweight squat
    ].filter(Boolean)
  }
];

// Dynamic workout generator algorithm based on PRD section 14
export function generateWorkoutPlan(
  goal: FitnessGoal,
  level: FitnessLevel,
  timeMinutes: number,
  targetBodyPart?: string,
  preferredEquipment?: string
): WorkoutRoutine {
  let matched = EXERCISES_DATABASE.filter(e => {
    const matchesGoal = e.goals.includes(goal);
    const matchesBody = targetBodyPart && targetBodyPart !== 'Full Body' 
      ? (e.bodyPart === targetBodyPart || e.category === targetBodyPart) 
      : true;
    return matchesGoal || matchesBody;
  });

  if (matched.length < 3) {
    matched = EXERCISES_DATABASE.filter(e => e.difficulty === level || e.difficulty === 'Beginner');
  }

  // Slice exercise count according to time (e.g. 10m: 3 exercises, 20m: 4-5 exercises, 30m: 6-7 exercises)
  const targetCount = Math.max(3, Math.min(8, Math.floor(timeMinutes / 4)));
  const selectedExercises = matched.slice(0, targetCount);

  // If no warm-up, prepend jumping jacks or cat-cow
  const hasWarmup = selectedExercises.some(e => e.category === 'Mobility' || e.name.includes('Jumping') || e.name.includes('Cat-Cow'));
  if (!hasWarmup && selectedExercises.length > 0) {
    const warmup = goal === 'Mobility' 
      ? EXERCISES_DATABASE.find(e => e.id === 'EX066') 
      : EXERCISES_DATABASE.find(e => e.id === 'EX018');
    if (warmup && !selectedExercises.includes(warmup)) {
      selectedExercises.unshift(warmup);
    }
  }

  const estCalories = selectedExercises.reduce((acc, curr) => acc + (curr.caloriesEstimate * curr.sets), 0);

  return {
    id: `GEN_${Date.now()}`,
    title: `${goal} Routine`,
    subtitle: `Custom tailored for ${level} • ${timeMinutes} mins`,
    durationMinutes: timeMinutes,
    level,
    goal,
    category: targetBodyPart || 'Tailored Workout',
    caloriesEstimate: estCalories,
    bannerGradient: 'from-orange-500/20 via-amber-600/30 to-red-600/20',
    exercises: selectedExercises
  };
}


// ---------------------------------------------------------------------------
// Body-part workouts for the Workout tab: one workout per muscle group that
// contains EVERY exercise of that group, done as 2 rounds (the same exercises
// repeat once). New exercises added to a group appear here automatically.
// ---------------------------------------------------------------------------
const CARDIO_IDS = ['EX017', 'EX018', 'EX019', 'EX060', 'EX064', 'EX065', 'EX084', 'EX085', 'EX086', 'EX087'];

interface CategoryDef {
  id: string;
  title: string;
  emoji: string;
  goal: FitnessGoal;
  gradient: string;
  filter: (e: Exercise) => boolean;
}

const hasMuscle = (e: Exercise, name: string) => e.primaryMuscles.some(m => m.startsWith(name));

export const CATEGORY_DEFS: CategoryDef[] = [
  { id: 'chest', title: 'Chest', emoji: '💪', goal: 'Chest', gradient: 'from-rose-500/20 via-red-600/30 to-orange-600/20', filter: e => e.category === 'Chest' },
  { id: 'back', title: 'Back', emoji: '🦍', goal: 'Back', gradient: 'from-sky-500/20 via-blue-600/30 to-indigo-600/20', filter: e => e.category === 'Back' },
  { id: 'biceps', title: 'Biceps', emoji: '💪', goal: 'Arms', gradient: 'from-orange-500/20 via-amber-600/30 to-yellow-600/20', filter: e => e.category === 'Arms' && hasMuscle(e, 'biceps') },
  { id: 'triceps', title: 'Triceps', emoji: '🔥', goal: 'Arms', gradient: 'from-red-500/20 via-orange-600/30 to-amber-600/20', filter: e => e.category === 'Arms' && hasMuscle(e, 'triceps') },
  { id: 'abs', title: 'Abs', emoji: '🎯', goal: 'Build Abs', gradient: 'from-lime-500/20 via-green-600/30 to-emerald-600/20', filter: e => e.category === 'Abs' },
  { id: 'cardio', title: 'Cardio', emoji: '🏃', goal: 'Fat Loss', gradient: 'from-pink-500/20 via-rose-600/30 to-red-600/20', filter: e => CARDIO_IDS.includes(e.id) },
  { id: 'legs', title: 'Legs', emoji: '🦵', goal: 'Legs', gradient: 'from-violet-500/20 via-purple-600/30 to-fuchsia-600/20', filter: e => e.category === 'Legs' },
  { id: 'shoulders', title: 'Shoulders', emoji: '🏋️', goal: 'Shoulders', gradient: 'from-cyan-500/20 via-teal-600/30 to-emerald-600/20', filter: e => e.category === 'Shoulders' },
  { id: 'mobility', title: 'Mobility', emoji: '🧘', goal: 'Mobility', gradient: 'from-teal-500/20 via-emerald-600/30 to-green-600/20', filter: e => e.category === 'Mobility' },
];

const DIFFICULTY_RANK: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };
const LEVELS: FitnessLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

function buildCategoryWorkout(def: CategoryDef, rounds = 2): WorkoutRoutine {
  const base = EXERCISES_DATABASE.filter(def.filter);
  // Each exercise is done once per round; the whole list then repeats.
  const oneRound: Exercise[] = base.map(e => ({ ...e, sets: 1 }));
  const exercises: Exercise[] = [];
  for (let r = 0; r < rounds; r++) oneRound.forEach(e => exercises.push({ ...e }));

  const seconds = exercises.reduce(
    (acc, e) => acc + (e.durationSeconds || Math.max(30, e.reps * 3)) + (e.restSeconds || 30),
    0
  );
  const calories = exercises.reduce((acc, e) => acc + e.caloriesEstimate, 0);
  const sorted = [...base].sort((a, b) => (DIFFICULTY_RANK[a.difficulty] ?? 0) - (DIFFICULTY_RANK[b.difficulty] ?? 0));
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : undefined;
  const level = LEVELS[median ? (DIFFICULTY_RANK[median.difficulty] ?? 0) : 0];

  return {
    id: `CAT_${def.id.toUpperCase()}`,
    title: `${def.title} Workout`,
    subtitle: `${base.length} exercises × ${rounds} rounds = ${exercises.length} moves`,
    durationMinutes: Math.max(1, Math.round(seconds / 60)),
    level,
    goal: def.goal,
    category: def.title,
    caloriesEstimate: calories,
    bannerGradient: def.gradient,
    exercises,
  };
}

export const CATEGORY_WORKOUTS: Array<WorkoutRoutine & { emoji: string; uniqueNames: string[] }> = CATEGORY_DEFS.map(def => {
  const routine = buildCategoryWorkout(def);
  const uniqueNames = EXERCISES_DATABASE.filter(def.filter).map(e => e.name);
  return { ...routine, emoji: def.emoji, uniqueNames };
});
