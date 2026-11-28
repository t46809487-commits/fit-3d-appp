import * as THREE from 'three';
import type { LoadedCharacter } from '../characterLoader';
import { M3 } from './boxingMath';
import { Skel, skelFromWorld, Solution } from './boxingRig';
import { MOVES, isBoxingMove, poseOf } from './boxingMoves';

// ---------------------------------------------------------------------------------------------
// three.js adapter: applies the IK solution of a boxing move to the loaded character.
// The pure maths lives in boxingRig / boxingMoves (unit-tested without three.js).
// ---------------------------------------------------------------------------------------------

interface RigCache { sk: Skel; unit: number; hips: THREE.Bone; bones: Record<string, THREE.Bone> }
const cache = new WeakMap<LoadedCharacter, RigCache>();

const NAMES = [
  'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
  'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
  'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase',
];

const find = (char: LoadedCharacter, name: string): THREE.Bone | undefined =>
  char.bones['mixamorig' + name] || char.bones['mixamorig:' + name];

function build(char: LoadedCharacter): RigCache | null {
  const bones: Record<string, THREE.Bone> = {};
  for (const n of NAMES) {
    const b = find(char, n);
    if (!b) return null; // not a Mixamo-rigged character: caller falls back to the old animation
    bones[n] = b;
  }
  const hips = bones.Hips;
  const unit = hips.parent ? hips.parent.scale.x : 1; // armature scale (0.01 = bones are stored in centimetres)
  // Rest-pose world position of every bone (T-pose: all rest rotations are identity)
  const world: Record<string, [number, number, number]> = {};
  const rest = (n: string): [number, number, number] => {
    if (world[n]) return world[n];
    const b = bones[n];
    const local = n === 'Hips' ? char.initialTransforms.hipsPos : b.position;
    const parentName = NAMES.find((p) => bones[p] === b.parent);
    const pw = parentName ? rest(parentName) : [0, 0, 0];
    return (world[n] = [pw[0] + local.x * unit, pw[1] + local.y * unit, pw[2] + local.z * unit]);
  };
  NAMES.forEach(rest);
  return { sk: skelFromWorld(world), unit, hips, bones };
}

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const setRot = (bone: THREE.Bone, m: M3) => {
  m4.set(m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, 0, 0, 0, 1);
  bone.quaternion.copy(q.setFromRotationMatrix(m4));
};

export function applySolution(char: LoadedCharacter, c: RigCache, sol: Solution) {
  for (const n of NAMES) {
    const bone = c.bones[n];
    if (n === 'Hips') bone.position.set(sol.hips[0] / c.unit, sol.hips[1] / c.unit, sol.hips[2] / c.unit);
    const m = sol.rot[n];
    if (m) setRot(bone, m);
    else bone.quaternion.identity(); // hands and toes stay in line with their parent
  }
  // Same camera angle the old boxing animation used, so the ring, bag and camera keep working
  char.scene.rotation.set(0, 0.35, 0);
  char.scene.position.set(0, -0.9 * char.scene.scale.y, 0);
}

/** Is this animation type handled by the boxing rig? */
export const handlesBoxing = (animationType: string): boolean => isBoxingMove(animationType);

/**
 * Drop-in replacement for the old boxing animations.
 *  - punches: `phase` 0 (guard) .. 1 (fist lands)
 *  - footwork / defence / guard: loop driven by `clock` (seconds)
 * Returns false if the character cannot be driven (then the old animation is used).
 */
export function applyBoxingPose(char: LoadedCharacter, id: string, phase: number, clock: number): boolean {
  const move = MOVES[id];
  if (!move) return false;
  let c = cache.get(char);
  if (!c) {
    const built = build(char);
    if (!built) return false;
    cache.set(char, built);
    c = built;
  }
  const t = move.kind === 'punch' ? phase : (((clock / move.duration) % 1) + 1) % 1;
  applySolution(char, c, poseOf(c.sk, move, Math.min(1, Math.max(0, t))));
  return true;
}

// ---------------------------------------------------------------------------------------------
// Boxing glove sized in metres and attached to a hand bone (works with the cm-scaled Mixamo armature)
// ---------------------------------------------------------------------------------------------
export function createBoxingGlove(char: LoadedCharacter, side: 'L' | 'R'): THREE.Group {
  const c = cache.get(char) ?? build(char);
  const unit = c ? c.unit : 0.01;
  const k = c ? c.sk.k : 1;
  const sgn = side === 'L' ? 1 : -1;          // fingers point along +X on the left hand, -X on the right
  const red = new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.38, metalness: 0.15 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x8f1414, roughness: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
  const g = new THREE.Group();

  const fist = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), red);
  fist.scale.set(1.15, 1.0, 0.95);
  fist.castShadow = true;
  const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), dark);
  thumb.position.set(-0.01, 0.045, 0.045 * sgn);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.07, 18), white);
  cuff.rotation.z = Math.PI / 2;
  cuff.position.set(-0.098, 0, 0);
  g.add(fist, thumb, cuff);
  g.position.set(sgn * 0.0, 0, 0);

  // wrapper: bone space is in centimetres, so scale metres up, and push the glove along the hand
  const wrap = new THREE.Group();
  wrap.scale.setScalar(k / unit);
  wrap.position.set((sgn * 0.11 * k) / unit, 0, 0);
  if (sgn < 0) g.scale.x = -1; // mirror for the right hand
  wrap.add(g);
  return wrap;
}
