import {
  Exercise,
  FitnessGoal,
  FitnessLevel,
  WorkoutRoutine,
  BodyPartCategory,
  EquipmentType,
  MuscleName,
} from '../types';
import { EXERCISES_DATABASE } from './exercises';

// ---------------------------------------------------------------------------
// LEVEL PROGRAMS (Workout tab)
//
//   Beginner      -> 28 different exercises, EASY      (2 sets, lighter reps, longer rest)
//   Intermediate  -> 28 different exercises, MODERATE  (3 sets, normal reps and rest)
//   Advanced      -> 28 different exercises, HARD      (4 sets, heavy / explosive, short-ish rest)
//
// Every program is split into 4 "days" of 7 exercises, so one session is a normal
// length. No exercise appears in two levels.
//
// Existing exercises (EXxxx / BXxxx) are taken from the exercise database and only
// get new sets / reps / rest for their level. New exercises (LB / LA ids) are defined
// below. They use the nearest existing 3D motion (for example the Archer Push-Up
// plays the wide push-up motion), so no new animation is needed.
// ---------------------------------------------------------------------------

export type Intensity = 'Easy' | 'Moderate' | 'Hard';

const MUSCLES: Record<string, MuscleName[]> = {
  chest: ['mid_chest_l', 'mid_chest_r', 'lower_chest_l', 'lower_chest_r'],
  triceps: ['triceps_l', 'triceps_r'],
  biceps: ['biceps_l', 'biceps_r'],
  frontDelts: ['front_delts_l', 'front_delts_r'],
  sideDelts: ['side_delts_l', 'side_delts_r'],
  lats: ['lats_l', 'lats_r'],
  traps: ['traps_l', 'traps_r'],
  forearms: ['forearms_l', 'forearms_r'],
  quads: ['quads_l', 'quads_r'],
  glutes: ['glutes_l', 'glutes_r'],
  hamstrings: ['hamstrings_l', 'hamstrings_r'],
  calves: ['calves_l', 'calves_r'],
  abs: ['rectus_abdominis', 'lower_abs'],
  obliques: ['obliques_l', 'obliques_r'],
  core: ['deep_core'],
  lowerBack: ['lower_back'],
};

const GOALS: Record<BodyPartCategory, FitnessGoal[]> = {
  Chest: ['Build Muscle', 'Chest'],
  Back: ['Build Muscle', 'Back'],
  Arms: ['Arms', 'Build Muscle'],
  Shoulders: ['Shoulders', 'Build Muscle'],
  Abs: ['Build Abs'],
  Legs: ['Legs', 'Build Muscle'],
  'Full Body': ['Fat Loss', 'Build Muscle'],
  Boxing: ['Boxing', 'Fat Loss'],
  Mobility: ['Mobility'],
};

interface NewExerciseSpec {
  id: string;
  name: string;
  level: FitnessLevel;
  category: BodyPartCategory;
  equipment: EquipmentType[];
  primary: MuscleName[];
  secondary: MuscleName[];
  pattern: string;
  motion: string; // an existing 3D motion key
  steps: string[];
  mistakes: string[];
  breathing: string;
  reps: number;
  seconds?: number; // for timed exercises
  kcal: number; // calories per set
  tempo?: string;
}

function makeExercise(s: NewExerciseSpec): Exercise {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    goals: GOALS[s.category],
    bodyPart: s.category,
    difficulty: s.level,
    equipment: s.equipment,
    primaryMuscles: s.primary,
    secondaryMuscles: s.secondary,
    movementPattern: s.pattern,
    instructions: s.steps,
    commonMistakes: s.mistakes,
    breathingPattern: s.breathing,
    animationId: `ex_${s.motion}_rep`,
    animationType: s.motion,
    characterId: 'CHAR-M-01',
    tempo: s.tempo ?? '2-0-2',
    durationSeconds: s.seconds,
    reps: s.reps,
    sets: 3,
    restSeconds: 60,
    caloriesEstimate: s.kcal,
  };
}

// ----------------------------- NEW EXERCISES -----------------------------

const NEW_SPECS: NewExerciseSpec[] = [
  // ---- Beginner (1 new) ----
  {
    id: 'LB01', name: 'Step-Back Lunge', level: 'Beginner', category: 'Legs', equipment: ['No Equipment'],
    primary: [...MUSCLES.quads, ...MUSCLES.glutes], secondary: [...MUSCLES.hamstrings, ...MUSCLES.core],
    pattern: 'Lunge', motion: 'lunges', reps: 10, kcal: 24,
    steps: [
      'Stand tall with hands on your hips and feet hip-width apart.',
      'Step one foot back and lower until both knees are about 90 degrees.',
      'Push through the front heel to stand back up, then switch legs.',
    ],
    mistakes: ['Front knee caving inward.', 'Leaning the chest far forward.'],
    breathing: 'Inhale as you step back and lower; exhale as you stand up.',
  },

  // ---- Advanced: Power & Conditioning ----
  {
    id: 'LA01', name: 'Tuck-Jump Burpee', level: 'Advanced', category: 'Full Body', equipment: ['No Equipment'],
    primary: [...MUSCLES.quads, ...MUSCLES.chest, ...MUSCLES.glutes], secondary: [...MUSCLES.abs, ...MUSCLES.triceps, ...MUSCLES.calves],
    pattern: 'Explosive Full Body', motion: 'burpee', reps: 10, kcal: 60, tempo: '1-0-X',
    steps: [
      'Drop into a squat, kick both feet back and lower your chest to the floor.',
      'Push up, jump your feet to your hands and explode upward.',
      'At the top pull both knees to your chest in a tuck jump, then land softly.',
    ],
    mistakes: ['Landing stiff-legged.', 'Letting the hips sag in the floor position.'],
    breathing: 'Exhale on the jump; inhale as you drop back down.',
  },
  {
    id: 'LA02', name: 'Chest-to-Floor Burpee', level: 'Advanced', category: 'Full Body', equipment: ['No Equipment'],
    primary: [...MUSCLES.chest, ...MUSCLES.quads, ...MUSCLES.triceps], secondary: [...MUSCLES.abs, ...MUSCLES.frontDelts],
    pattern: 'Explosive Full Body', motion: 'burpee', reps: 12, kcal: 56, tempo: '1-1-X',
    steps: [
      'From standing, squat down and jump both feet back into a plank.',
      'Lower until the chest and thighs fully touch the floor, then press back up.',
      'Jump the feet in and finish with a jump and a clap overhead.',
    ],
    mistakes: ['Skipping the full chest touch.', 'Arching the lower back on the way up.'],
    breathing: 'Inhale going down; exhale as you press and jump.',
  },
  {
    id: 'LA03', name: 'Boxing - Right Hook (4)', level: 'Advanced', category: 'Boxing', equipment: ['No Equipment'],
    primary: [...MUSCLES.obliques, ...MUSCLES.frontDelts], secondary: [...MUSCLES.core, ...MUSCLES.triceps],
    pattern: 'Rotational Strike', motion: 'box_right_hook', reps: 20, kcal: 34, tempo: '1-0-1',
    steps: [
      'Stand in guard and pivot on the back foot as the hips rotate.',
      'Swing the right fist in a tight arc with the elbow at shoulder height.',
      'Snap back to guard immediately and repeat at full power.',
    ],
    mistakes: ['Winding up with a wide, slow swing.', 'Dropping the left hand.'],
    breathing: 'Sharp exhale on every strike.',
  },
  {
    id: 'LA04', name: 'Boxing - Left Uppercut (5)', level: 'Advanced', category: 'Boxing', equipment: ['No Equipment'],
    primary: [...MUSCLES.frontDelts, ...MUSCLES.biceps], secondary: [...MUSCLES.quads, ...MUSCLES.core],
    pattern: 'Rising Strike', motion: 'box_left_uppercut', reps: 20, kcal: 34, tempo: '1-0-1',
    steps: [
      'Bend the knees slightly and dip the left shoulder.',
      'Drive up through the legs and punch the left fist upward along the centre line.',
      'Return to guard fast and keep the chin down.',
    ],
    mistakes: ['Punching with the arm only, no leg drive.', 'Leaning back off balance.'],
    breathing: 'Sharp exhale on every strike.',
  },
  {
    id: 'LA05', name: 'Jump Lunges', level: 'Advanced', category: 'Legs', equipment: ['No Equipment'],
    primary: [...MUSCLES.quads, ...MUSCLES.glutes], secondary: [...MUSCLES.hamstrings, ...MUSCLES.calves],
    pattern: 'Plyometric Lunge', motion: 'lunges', reps: 20, kcal: 46, tempo: '1-0-X',
    steps: [
      'Start in a deep lunge with the back knee just above the floor.',
      'Jump explosively and switch legs in the air.',
      'Land softly in a deep lunge on the opposite side and repeat.',
    ],
    mistakes: ['Landing with a straight front leg.', 'Shallow lunge depth.'],
    breathing: 'Exhale on each jump; inhale on landing.',
  },
  {
    id: 'LA06', name: 'Cross-Body Mountain Climbers', level: 'Advanced', category: 'Full Body', equipment: ['No Equipment'],
    primary: [...MUSCLES.abs, ...MUSCLES.obliques, ...MUSCLES.quads], secondary: [...MUSCLES.frontDelts, ...MUSCLES.core],
    pattern: 'Dynamic Plank', motion: 'mountain_climber', reps: 40, seconds: 40, kcal: 42, tempo: '1-0-1',
    steps: [
      'Hold a strong high plank with hands under the shoulders.',
      'Drive one knee toward the opposite elbow, then switch quickly.',
      'Keep the hips level and move as fast as you can with control.',
    ],
    mistakes: ['Bouncing the hips up high.', 'Slowing down and resting the knees.'],
    breathing: 'Breathe rhythmically: exhale with every second step.',
  },

  // ---- Advanced: Push ----
  {
    id: 'LA07', name: 'Archer Push-Up', level: 'Advanced', category: 'Chest', equipment: ['No Equipment'],
    primary: [...MUSCLES.chest], secondary: [...MUSCLES.triceps, ...MUSCLES.frontDelts, ...MUSCLES.core],
    pattern: 'Unilateral Push', motion: 'pushup_wide', reps: 8, kcal: 38, tempo: '3-0-1',
    steps: [
      'Take a very wide push-up position.',
      'Lower toward one hand while the opposite arm stays straight.',
      'Press back up and alternate sides each rep.',
    ],
    mistakes: ['Twisting the hips.', 'Bending the straight arm.'],
    breathing: 'Inhale down; exhale up.',
  },
  {
    id: 'LA08', name: 'Explosive Clap Push-Up', level: 'Advanced', category: 'Chest', equipment: ['No Equipment'],
    primary: [...MUSCLES.chest, ...MUSCLES.triceps], secondary: [...MUSCLES.frontDelts, ...MUSCLES.core],
    pattern: 'Plyometric Push', motion: 'pushup_standard', reps: 8, kcal: 40, tempo: '2-0-X',
    steps: [
      'Lower into a push-up with a tight, straight body.',
      'Press up with maximum force so the hands leave the floor.',
      'Clap, land with soft elbows and go straight into the next rep.',
    ],
    mistakes: ['Landing with locked elbows.', 'Piking the hips in the air.'],
    breathing: 'Inhale on the way down; forceful exhale on the push.',
  },
  {
    id: 'LA09', name: 'Weighted Decline Push-Up', level: 'Advanced', category: 'Chest', equipment: ['Bench', 'Dumbbells'],
    primary: [...MUSCLES.chest, ...MUSCLES.frontDelts], secondary: [...MUSCLES.triceps, ...MUSCLES.core],
    pattern: 'Incline Press', motion: 'pushup_decline', reps: 10, kcal: 42, tempo: '3-1-1',
    steps: [
      'Place feet on a bench, hands on the floor, with a weight plate or backpack on the back.',
      'Lower the chest slowly until it nearly touches the floor.',
      'Press up powerfully while keeping the body in one line.',
    ],
    mistakes: ['Hips sagging under the weight.', 'Flaring the elbows wide.'],
    breathing: 'Inhale down for three seconds; exhale up.',
  },
  {
    id: 'LA10', name: 'Elevated Pike Push-Up', level: 'Advanced', category: 'Shoulders', equipment: ['Bench'],
    primary: [...MUSCLES.frontDelts, ...MUSCLES.sideDelts], secondary: [...MUSCLES.triceps, ...MUSCLES.traps],
    pattern: 'Vertical Push', motion: 'pike_pushup', reps: 8, kcal: 36, tempo: '3-0-1',
    steps: [
      'Put your feet on a bench and walk your hands in until the hips are high.',
      'Lower the top of the head toward the floor between the hands.',
      'Press back up to straight arms with the hips stacked over the shoulders.',
    ],
    mistakes: ['Bending the hips instead of the arms.', 'Elbows flaring far out.'],
    breathing: 'Inhale down; exhale up.',
  },
  {
    id: 'LA11', name: 'Parallel Bar Dips', level: 'Advanced', category: 'Arms', equipment: ['Pull-Up Bar'],
    primary: [...MUSCLES.triceps, ...MUSCLES.chest], secondary: [...MUSCLES.frontDelts],
    pattern: 'Vertical Push', motion: 'tricep_dips', reps: 10, kcal: 40, tempo: '3-0-1',
    steps: [
      'Support yourself on parallel bars with straight arms and a slight forward lean.',
      'Lower until the elbows reach about 90 degrees.',
      'Press up to lockout without shrugging the shoulders.',
    ],
    mistakes: ['Dropping too deep and straining the shoulders.', 'Swinging the legs.'],
    breathing: 'Inhale down; exhale on the press.',
  },

  // ---- Advanced: Pull ----
  {
    id: 'LA12', name: 'Weighted Pull-Up', level: 'Advanced', category: 'Back', equipment: ['Pull-Up Bar', 'Dumbbells'],
    primary: [...MUSCLES.lats], secondary: [...MUSCLES.biceps, ...MUSCLES.traps, ...MUSCLES.forearms],
    pattern: 'Vertical Pull', motion: 'pull_up', reps: 6, kcal: 40, tempo: '2-0-2',
    steps: [
      'Hang from the bar with a weight held between the feet or in a belt.',
      'Pull the chest toward the bar by driving the elbows down.',
      'Lower slowly to a full hang.',
    ],
    mistakes: ['Kipping with the legs.', 'Half reps at the bottom.'],
    breathing: 'Exhale as you pull up; inhale as you lower.',
  },
  {
    id: 'LA13', name: 'Archer Pull-Up', level: 'Advanced', category: 'Back', equipment: ['Pull-Up Bar'],
    primary: [...MUSCLES.lats, ...MUSCLES.biceps], secondary: [...MUSCLES.traps, ...MUSCLES.core],
    pattern: 'Unilateral Pull', motion: 'pull_up', reps: 6, kcal: 38, tempo: '2-0-2',
    steps: [
      'Use a wide grip and pull up toward one hand.',
      'Keep the opposite arm straight and extended along the bar.',
      'Lower with control and alternate sides.',
    ],
    mistakes: ['Bending the straight arm.', 'Losing control on the way down.'],
    breathing: 'Exhale on the pull; inhale on the lowering.',
  },
  {
    id: 'LA14', name: 'L-Sit Pull-Up', level: 'Advanced', category: 'Back', equipment: ['Pull-Up Bar'],
    primary: [...MUSCLES.lats, ...MUSCLES.abs], secondary: [...MUSCLES.biceps, ...MUSCLES.quads, ...MUSCLES.forearms],
    pattern: 'Vertical Pull + Core', motion: 'pull_up', reps: 6, kcal: 40, tempo: '2-0-2',
    steps: [
      'Hang from the bar and lift both legs straight in front of you (L shape).',
      'Pull up while keeping the legs parallel to the floor.',
      'Lower slowly without letting the legs drop.',
    ],
    mistakes: ['Legs dropping during the pull.', 'Rounding the shoulders forward.'],
    breathing: 'Exhale as you pull; inhale as you lower.',
  },
  {
    id: 'LA15', name: 'Pendlay Row', level: 'Advanced', category: 'Back', equipment: ['Barbell'],
    primary: [...MUSCLES.lats, ...MUSCLES.traps], secondary: [...MUSCLES.biceps, ...MUSCLES.lowerBack, ...MUSCLES.hamstrings],
    pattern: 'Horizontal Pull', motion: 'band_row', reps: 8, kcal: 40, tempo: '1-1-2',
    steps: [
      'Set a barbell on the floor, hinge until the back is parallel to the ground.',
      'Explosively row the bar to the lower chest.',
      'Return the bar to the floor each rep and reset your back.',
    ],
    mistakes: ['Rounding the lower back.', 'Using body momentum to heave the bar.'],
    breathing: 'Exhale on the pull; inhale as the bar returns.',
  },

  // ---- Advanced: Legs & Core ----
  {
    id: 'LA16', name: 'Barbell Front Squat', level: 'Advanced', category: 'Legs', equipment: ['Barbell'],
    primary: [...MUSCLES.quads, ...MUSCLES.glutes], secondary: [...MUSCLES.core, ...MUSCLES.lowerBack, ...MUSCLES.hamstrings],
    pattern: 'Squat', motion: 'squat', reps: 8, kcal: 48, tempo: '3-1-1',
    steps: [
      'Rest the bar across the front shoulders with elbows high.',
      'Sit down between the hips keeping the torso upright.',
      'Drive through the whole foot to stand up.',
    ],
    mistakes: ['Elbows dropping and the bar rolling forward.', 'Heels lifting off the floor.'],
    breathing: 'Big breath in and brace at the top; exhale as you stand.',
  },
  {
    id: 'LA17', name: 'Pistol Squat', level: 'Advanced', category: 'Legs', equipment: ['No Equipment'],
    primary: [...MUSCLES.quads, ...MUSCLES.glutes], secondary: [...MUSCLES.hamstrings, ...MUSCLES.core, ...MUSCLES.calves],
    pattern: 'Single-Leg Squat', motion: 'squat', reps: 6, kcal: 40, tempo: '3-0-2',
    steps: [
      'Stand on one leg with the other leg extended straight in front.',
      'Sit back and down on the standing leg as far as you can with control.',
      'Drive up through the heel without letting the knee cave in.',
    ],
    mistakes: ['Dropping fast into the bottom.', 'Heel lifting off the floor.'],
    breathing: 'Inhale down; exhale up.',
  },
  {
    id: 'LA18', name: 'Barbell Hip Thrust', level: 'Advanced', category: 'Legs', equipment: ['Barbell', 'Bench'],
    primary: [...MUSCLES.glutes], secondary: [...MUSCLES.hamstrings, ...MUSCLES.core],
    pattern: 'Hip Extension', motion: 'glute_bridge', reps: 10, kcal: 38, tempo: '2-1-2',
    steps: [
      'Sit with your upper back on a bench and a barbell across your hips.',
      'Drive through the heels and lift the hips until the body is flat.',
      'Squeeze the glutes at the top, then lower under control.',
    ],
    mistakes: ['Over-arching the lower back at the top.', 'Pushing through the toes.'],
    breathing: 'Exhale as you thrust up; inhale as you lower.',
  },
  {
    id: 'LA19', name: 'Hanging Leg Raise', level: 'Advanced', category: 'Abs', equipment: ['Pull-Up Bar'],
    primary: [...MUSCLES.abs], secondary: [...MUSCLES.forearms, ...MUSCLES.core],
    pattern: 'Hip Flexion', motion: 'leg_raise', reps: 12, kcal: 34, tempo: '2-0-3',
    steps: [
      'Hang from the bar with straight arms and no swing.',
      'Lift the legs until they reach hip height or higher.',
      'Lower very slowly and stop the swing before the next rep.',
    ],
    mistakes: ['Swinging with momentum.', 'Letting the lower back arch.'],
    breathing: 'Exhale as the legs rise; inhale as they lower.',
  },
  {
    id: 'LA20', name: 'Dragon Flag', level: 'Advanced', category: 'Abs', equipment: ['Bench'],
    primary: [...MUSCLES.abs, ...MUSCLES.core], secondary: [...MUSCLES.obliques, ...MUSCLES.lats],
    pattern: 'Anti-Extension', motion: 'leg_raise', reps: 6, kcal: 36, tempo: '3-0-3',
    steps: [
      'Lie on a bench and grip it behind your head.',
      'Raise the whole body until only the upper back touches the bench.',
      'Lower the body slowly as one straight line, without bending at the hips.',
    ],
    mistakes: ['Bending at the hips.', 'Dropping fast in the lowering phase.'],
    breathing: 'Exhale as you lift; inhale slowly as you lower.',
  },
];

export const LEVEL_NEW_EXERCISES: Exercise[] = NEW_SPECS.map(makeExercise);

// --------------------------- PROGRAM DEFINITIONS ---------------------------

interface DayDef {
  title: string;
  focus: string;
  ids: string[];
}

interface ProgramDef {
  level: FitnessLevel;
  intensity: Intensity;
  bars: 1 | 2 | 3;
  title: string;
  tagline: string;
  emoji: string;
  gradient: string;
  days: DayDef[];
}

const PROGRAM_DEFS: ProgramDef[] = [
  {
    level: 'Beginner',
    intensity: 'Easy',
    bars: 1,
    title: 'Beginner Program',
    tagline: 'Learn the moves. Light reps, 2 sets, long rests.',
    emoji: '🌱',
    gradient: 'from-emerald-500/25 via-green-600/25 to-teal-600/20',
    days: [
      { title: 'Day 1', focus: 'Warm-up & Cardio', ids: ['EX071', 'EX018', 'EX019', 'EX017', 'BX001', 'BX002', 'EX066'] },
      { title: 'Day 2', focus: 'Upper Body', ids: ['EX002', 'EX001', 'EX020', 'EX004', 'EX013', 'EX006', 'EX026'] },
      { title: 'Day 3', focus: 'Lower Body', ids: ['EX007', 'EX054', 'EX009', 'EX076', 'EX059', 'EX063', 'LB01'] },
      { title: 'Day 4', focus: 'Core & Cool-down', ids: ['EX014', 'EX015', 'EX052', 'EX075', 'EX016', 'EX011', 'EX067'] },
    ],
  },
  {
    level: 'Intermediate',
    intensity: 'Moderate',
    bars: 2,
    title: 'Intermediate Program',
    tagline: 'Build strength. Normal reps, 3 sets, steady rests.',
    emoji: '🔥',
    gradient: 'from-amber-500/25 via-orange-600/25 to-yellow-600/20',
    days: [
      { title: 'Day 1', focus: 'Cardio & Conditioning', ids: ['EX060', 'EX065', 'EX064', 'EX061', 'BX003', 'BX004', 'EX068'] },
      { title: 'Day 2', focus: 'Push (Chest & Shoulders)', ids: ['EX003', 'EX022', 'EX023', 'EX021', 'EX012', 'EX036', 'EX037'] },
      { title: 'Day 3', focus: 'Pull & Arms', ids: ['EX028', 'EX029', 'EX034', 'EX038', 'EX040', 'EX046', 'EX005'] },
      { title: 'Day 4', focus: 'Legs & Core', ids: ['EX008', 'EX055', 'EX056', 'EX049', 'EX050', 'EX051', 'EX077'] },
    ],
  },
  {
    level: 'Advanced',
    intensity: 'Hard',
    bars: 3,
    title: 'Advanced Program',
    tagline: 'Push your limits. Heavy and explosive, 4 sets.',
    emoji: '⚡',
    gradient: 'from-red-500/25 via-rose-600/25 to-orange-600/20',
    days: [
      { title: 'Day 1', focus: 'Power & Conditioning', ids: ['LA01', 'LA02', 'LA03', 'LA04', 'EX062', 'LA05', 'LA06'] },
      { title: 'Day 2', focus: 'Push Power', ids: ['EX024', 'EX039', 'LA07', 'LA08', 'LA09', 'LA10', 'LA11'] },
      { title: 'Day 3', focus: 'Pull Power', ids: ['EX010', 'EX078', 'EX032', 'LA12', 'LA13', 'LA14', 'LA15'] },
      { title: 'Day 4', focus: 'Legs & Core', ids: ['EX057', 'EX033', 'LA16', 'LA17', 'LA18', 'LA19', 'LA20'] },
    ],
  },
];

// ---------------------- how hard each level is (sets / reps / rest) ----------------------

function applyLevel(base: Exercise, level: FitnessLevel): Exercise {
  const timed = !!base.durationSeconds;
  const ex: Exercise = { ...base, difficulty: level };

  if (level === 'Beginner') {
    ex.sets = 2;
    if (timed) ex.durationSeconds = Math.max(20, Math.round((base.durationSeconds as number) * 0.75));
    if (base.reps > 1) ex.reps = Math.max(6, Math.round(base.reps * 0.7));
    ex.restSeconds = Math.min(75, Math.max(30, base.restSeconds + 15));
  } else if (level === 'Intermediate') {
    ex.sets = 3;
    ex.restSeconds = Math.max(30, base.restSeconds);
  } else {
    // heavy strength work gets 4 sets; long cardio / timed / high-rep work gets 3 so a day stays doable
    ex.sets = timed || base.reps > 12 ? 3 : 4;
    if (timed) ex.durationSeconds = (base.durationSeconds as number) + 10;
    ex.restSeconds = Math.max(60, base.restSeconds);
  }
  return ex;
}

// ----------------------------- build the programs -----------------------------

export interface LevelDay {
  id: string;
  title: string;
  focus: string;
  exercises: Exercise[];
  routine: WorkoutRoutine;
}

export interface LevelProgram {
  level: FitnessLevel;
  intensity: Intensity;
  bars: 1 | 2 | 3;
  title: string;
  tagline: string;
  emoji: string;
  gradient: string;
  days: LevelDay[];
  allExercises: Exercise[];
  fullRoutine: WorkoutRoutine;
  totalExercises: number;
  avgDayMinutes: number;
  totalCalories: number;
}

const newById = new Map(LEVEL_NEW_EXERCISES.map(e => [e.id, e]));

function findExercise(id: string): Exercise {
  const ex = newById.get(id) ?? EXERCISES_DATABASE.find(e => e.id === id);
  if (!ex) throw new Error(`Level program: exercise ${id} not found`);
  return ex;
}

function routineStats(exercises: Exercise[]) {
  const seconds = exercises.reduce(
    (acc, e) => acc + e.sets * ((e.durationSeconds || Math.max(30, e.reps * 3)) + e.restSeconds),
    0
  );
  const calories = exercises.reduce((acc, e) => acc + e.caloriesEstimate * e.sets, 0);
  return { minutes: Math.max(1, Math.round(seconds / 60)), calories };
}

function buildProgram(def: ProgramDef): LevelProgram {
  const slug = def.level.toUpperCase().slice(0, 3);

  const days: LevelDay[] = def.days.map((d, i) => {
    const exercises = d.ids.map(id => applyLevel(findExercise(id), def.level));
    const { minutes, calories } = routineStats(exercises);
    const routine: WorkoutRoutine = {
      id: `LVL_${slug}_D${i + 1}`,
      title: `${def.level} • ${d.title}`,
      subtitle: d.focus,
      durationMinutes: minutes,
      level: def.level,
      goal: 'Build Muscle',
      category: d.focus,
      caloriesEstimate: calories,
      exercises,
      bannerGradient: def.gradient,
    };
    return { id: routine.id, title: d.title, focus: d.focus, exercises, routine };
  });

  const allExercises = days.flatMap(d => d.exercises);
  const { minutes, calories } = routineStats(allExercises);

  const fullRoutine: WorkoutRoutine = {
    id: `LVL_${slug}_ALL`,
    title: `${def.level} • Full Program`,
    subtitle: `${allExercises.length} exercises`,
    durationMinutes: minutes,
    level: def.level,
    goal: 'Build Muscle',
    category: 'Full Program',
    caloriesEstimate: calories,
    exercises: allExercises,
    bannerGradient: def.gradient,
  };

  return {
    level: def.level,
    intensity: def.intensity,
    bars: def.bars,
    title: def.title,
    tagline: def.tagline,
    emoji: def.emoji,
    gradient: def.gradient,
    days,
    allExercises,
    fullRoutine,
    totalExercises: allExercises.length,
    avgDayMinutes: Math.round(days.reduce((a, d) => a + d.routine.durationMinutes, 0) / days.length),
    totalCalories: calories,
  };
}

export const LEVEL_PROGRAMS: LevelProgram[] = PROGRAM_DEFS.map(buildProgram);
