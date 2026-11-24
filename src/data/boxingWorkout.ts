import { FitnessLevel } from '../types';
import { BOXING_COMBOS } from './exercises';

// ---------------------------------------------------------------------------
// Boxing workout = an ORDERED list of drills. The 3D boxer performs every drill
// by itself (same as the other exercises), one after the other:
//   drill 1 -> drill 2 -> drill 3 ...
// Inside a drill the punches are also performed in order (1st, 2nd, 3rd ...).
// useBag = true  -> a heavy punching bag hangs in front of the boxer
// useBag = false -> shadow boxing (no equipment)
// ---------------------------------------------------------------------------

export type PunchNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface PunchInfo {
  label: string;      // short name shown on the chips
  fullName: string;
  animationType: string;
  sound: 'jab' | 'cross' | 'hook' | 'uppercut';
  /** how hard the bag is pushed (0.6 light .. 1.4 power) */
  power: number;
}

export const PUNCHES: Record<number, PunchInfo> = {
  1: { label: 'JAB', fullName: 'Lead Jab', animationType: 'box_jab', sound: 'jab', power: 0.7 },
  2: { label: 'CROSS', fullName: 'Power Cross', animationType: 'box_cross', sound: 'cross', power: 1.2 },
  3: { label: 'L-HOOK', fullName: 'Left Hook', animationType: 'box_left_hook', sound: 'hook', power: 1.3 },
  4: { label: 'R-HOOK', fullName: 'Right Hook', animationType: 'box_right_hook', sound: 'hook', power: 1.4 },
  5: { label: 'L-UPPER', fullName: 'Left Uppercut', animationType: 'box_left_uppercut', sound: 'uppercut', power: 1.0 },
  6: { label: 'R-UPPER', fullName: 'Right Uppercut', animationType: 'box_right_uppercut', sound: 'uppercut', power: 1.2 },
};

export interface BoxingDrill {
  id: string;
  name: string;
  description: string;
  /** Punch numbers in the order they are thrown. Empty = guard stance only. */
  sequence: number[];
  useBag: boolean;
  durationSeconds: number;
  restSeconds: number;
  difficulty: FitnessLevel;
  cues: string[];
}

const single = (
  id: string,
  punch: number,
  difficulty: FitnessLevel,
  description: string,
  cues: string[]
): BoxingDrill => ({
  id,
  name: `${PUNCHES[punch].fullName} (${punch})`,
  description,
  sequence: [punch],
  useBag: true,
  durationSeconds: 40,
  restSeconds: 15,
  difficulty,
  cues,
});

const fromCombo = (comboId: string): BoxingDrill => {
  const c = BOXING_COMBOS.find((x) => x.id === comboId)!;
  return {
    id: `DR-${c.id}`,
    name: c.name,
    description: c.description,
    sequence: c.sequence,
    useBag: true,
    durationSeconds: 45,
    restSeconds: 15,
    difficulty: c.difficulty,
    cues: ['Throw the punches in order, one after another.', 'Reset to guard after every combo.'],
  };
};

export const BOXING_DRILLS: BoxingDrill[] = [
  {
    id: 'DR-GUARD',
    name: 'Guard Stance & Bounce',
    description: 'Warm-up: stay light on your feet with both hands up.',
    sequence: [],
    useBag: false,
    durationSeconds: 30,
    restSeconds: 10,
    difficulty: 'Beginner',
    cues: ['Hands glued to the cheekbones.', 'Elbows in, chin down.', 'Small bounces on the balls of your feet.'],
  },
  {
    id: 'DR-SHADOW12',
    name: 'Shadow Boxing 1-2',
    description: 'No bag yet. Jab then cross in the air to find your rhythm.',
    sequence: [1, 2],
    useBag: false,
    durationSeconds: 40,
    restSeconds: 10,
    difficulty: 'Beginner',
    cues: ['1st: jab straight out.', '2nd: cross with a hip turn.', 'Snap both hands back to guard.'],
  },
  single('DR-JAB', 1, 'Beginner', 'Snap the lead hand straight into the bag.', [
    'Rotate the fist so the palm faces down.',
    'Retract instantly back to guard.',
  ]),
  single('DR-CROSS', 2, 'Beginner', 'Pivot the rear foot and drive the right hand through the bag.', [
    'Rotate hip and foot together with the punch.',
    'Keep the left hand up.',
  ]),
  single('DR-LHOOK', 3, 'Intermediate', 'Swing the left hook around the side of the bag.', [
    'Keep the elbow at shoulder height.',
    'Pivot on the lead foot.',
  ]),
  single('DR-RHOOK', 4, 'Intermediate', 'Swing the right hook with a full hip turn.', [
    'Rotate the rear foot deeply.',
    'Elbow locked at 90 degrees.',
  ]),
  single('DR-LUPPER', 5, 'Intermediate', 'Dip and drive the left uppercut up the middle of the bag.', [
    'Bend the knees, then drive up.',
    'Keep the right hand on the jaw.',
  ]),
  single('DR-RUPPER', 6, 'Intermediate', 'Dip and drive the right uppercut up the middle of the bag.', [
    'Turn the right shoulder down first.',
    'Snap back to guard.',
  ]),
  fromCombo('BC001'),
  fromCombo('BC002'),
  fromCombo('BC003'),
  fromCombo('BC004'),
];
