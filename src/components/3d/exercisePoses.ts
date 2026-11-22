// ---------------------------------------------------------------------------
// Pose-based exercise animation data (PRD: Exercise -> Animation -> Movement).
// Each exercise = a START pose + an END pose. The engine (poseEngine.ts) blends
// between them using the PRD 6-state cycle phase (0 = start, 1 = end/peak).
//
// Angles are in radians and use the Mixamo bone axes of CHAR-M-01.glb:
//   x = forward/back swing (sagittal), y = twist/elbow bend, z = sideways raise.
// Left side values are written; the right side is mirrored automatically
// (y and z are negated, x is kept).
// Every pose here was checked with an offline stick-figure preview of the
// real skeleton before being added.
// ---------------------------------------------------------------------------

export interface JointAngles {
  x?: number;
  y?: number;
  z?: number;
  dy?: number; // hips only: vertical offset in cm
  dz?: number; // hips only: forward offset in cm
}

export type JointKey =
  | 'hips' | 'spine' | 'spine1' | 'spine2' | 'neck' | 'head'
  | 'shoulder' | 'arm' | 'foreArm' | 'hand'
  | 'upLeg' | 'leg' | 'foot' | 'toe';

export type PoseDef = Partial<Record<JointKey, JointAngles>>;

export interface MotionDef {
  start: PoseDef;
  end: PoseDef;
  /** Whole-body tilt about X in radians: [at start, at end]. 0 = standing, PI/2 = lying face-down. */
  pitch: [number, number];
  /** Whole-body turn about Y in radians (to show the exercise side-on from the default camera). */
  yaw: number;
  /** Height (metres) of a step / bench the hands or feet rest on. */
  raise?: { hand?: number; foot?: number };
}

// Push-up family: arms stay vertical in world space; solved so hands and toes
// stay planted on the floor (or on the step/bench) during the whole rep.
const pushUp = (
  pitchTop: number, pitchBottom: number,
  upperArmBack: number, elbowBend: number,
  abductTop: number, abductBottom: number,
  raise?: { hand?: number; foot?: number }
): MotionDef => ({
  start: {
    arm: { x: -pitchTop, z: abductTop },
    foreArm: { y: 0 },
    head: { x: -0.30 },
    neck: { x: -0.12 },
  },
  end: {
    arm: { x: -pitchBottom + upperArmBack, z: abductBottom },
    foreArm: { y: elbowBend },
    head: { x: -0.30 },
    neck: { x: -0.12 },
  },
  pitch: [pitchTop, pitchBottom],
  yaw: -1.0,
  raise,
});

// Standing, slight knee bend and forward lean (feet stay flat on the floor).
const standingLean = {
  spine: { x: 0.16 },
  spine1: { x: 0.12 },
  spine2: { x: 0.10 },
  head: { x: -0.25 },
  neck: { x: -0.10 },
  upLeg: { x: -0.22 },
  leg: { x: 0.34 },
  foot: { x: -0.12 },
} as const;

export const EXERCISE_MOTIONS: Record<string, MotionDef> = {
  // ---- CHEST ----
  pushup_standard: pushUp(1.259, 1.463, 1.35, -2.021, -1.52, -1.10),
  pushup_wide: pushUp(1.276, 1.46, 1.35, -1.962, -1.28, -0.85),
  pushup_decline: pushUp(1.511, 1.755, 1.295, -2.369, -1.52, -1.10, { foot: 0.35 }),
  pushup_incline: pushUp(0.881, 1.086, 1.35, -1.561, -1.52, -1.10, { hand: 0.45 }),
  cable_crossover: {
    start: { ...standingLean, arm: { x: 0.30, z: -0.60 }, foreArm: { y: -0.35 } },
    end: { ...standingLean, arm: { x: -0.80, z: -1.05 }, foreArm: { y: -0.45 } },
    pitch: [0, 0],
    yaw: 0,
  },
};
