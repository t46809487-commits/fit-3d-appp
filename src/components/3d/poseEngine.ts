import * as THREE from 'three';
import type { LoadedCharacter } from './characterLoader';
import type { MotionDef, PoseDef, JointAngles } from './exercisePoses';

const CENTER: Record<string, string> = {
  hips: 'Hips', spine: 'Spine', spine1: 'Spine1', spine2: 'Spine2', neck: 'Neck', head: 'Head',
};
const SIDED: Record<string, string> = {
  shoulder: 'Shoulder', arm: 'Arm', foreArm: 'ForeArm', hand: 'Hand',
  upLeg: 'UpLeg', leg: 'Leg', foot: 'Foot', toe: 'ToeBase',
};

// Floor level of the studio podium (see Human3DModel.tsx).
const FLOOR_Y = -0.905;

// Approximate "thickness" of each body part (metres) used to rest it on the floor.
const CONTACT_RADIUS: Record<string, number> = {
  LeftFoot: 0.04, RightFoot: 0.04, LeftToeBase: 0.03, RightToeBase: 0.03,
  LeftHand: 0.04, RightHand: 0.04, LeftLeg: 0.06, RightLeg: 0.06,
  LeftForeArm: 0.04, RightForeArm: 0.04, Hips: 0.12, Spine2: 0.10, Head: 0.10,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Which bone(s) a pose key drives. "arm" = both arms (right side mirrored),
// "armL" / "armR" = one side only (the value is written in left-side convention).
function resolveTargets(key: string): Array<[string, number]> {
  if (CENTER[key]) return [[CENTER[key], 1]];
  if (SIDED[key]) return [['Left' + SIDED[key], 1], ['Right' + SIDED[key], -1]];
  const base = key.slice(0, -1);
  const side = key.slice(-1);
  if (SIDED[base] && (side === 'L' || side === 'R')) {
    return [[(side === 'L' ? 'Left' : 'Right') + SIDED[base], side === 'L' ? 1 : -1]];
  }
  return [];
}

function lerpPose(
  start: PoseDef,
  end: PoseDef,
  t: number,
  restOf: (key: string, comp: string) => number
): Record<string, JointAngles> {
  const out: Record<string, JointAngles> = {};
  const keys = new Set([...Object.keys(start), ...Object.keys(end)]);
  keys.forEach((k) => {
    const s = start[k] ?? {};
    const e = end[k] ?? {};
    const o: Record<string, number> = {};
    (['x', 'y', 'z', 'dy', 'dz'] as const).forEach((c) => {
      if (s[c] === undefined && e[c] === undefined) return;
      // A joint angle missing from one pose falls back to the rest angle
      const sv = s[c] ?? restOf(k, c);
      const ev = e[c] ?? restOf(k, c);
      o[c] = lerp(sv, ev, t);
    });
    out[k] = o;
  });
  return out;
}

/**
 * Apply a pose-based motion (start pose -> end pose) to the character.
 * phase: 0 = start, 1 = end (peak). Also keeps the body resting on the floor
 * (or on a step/bench) and centred, and publishes camera/prop hints on
 * char.scene.userData (focusY, platform).
 */
export function applyMotion(char: LoadedCharacter, m: MotionDef, phase: number) {
  const bones = char.bones;
  const init = char.initialTransforms;
  const getBone = (n: string) => bones['mixamorig' + n] || bones['mixamorig:' + n];

  // 1) Joint angles (rest angles are read before any bone is changed)
  const restOf = (key: string, comp: string): number => {
    if (comp === 'dy' || comp === 'dz') return 0;
    const target = resolveTargets(key)[0];
    if (!target) return 0;
    const bone = getBone(target[0]);
    if (!bone) return 0;
    const v = comp === 'x' ? bone.rotation.x : comp === 'y' ? bone.rotation.y : bone.rotation.z;
    return comp === 'x' ? v : v * target[1];
  };
  const pose = lerpPose(m.start, m.end, phase, restOf);
  Object.keys(pose).forEach((key) => {
    const j = pose[key];
    if (key === 'hips') {
      const hips = getBone('Hips');
      if (hips) {
        hips.position.y = init.hipsPos.y + (j.dy ?? 0);
        hips.position.z = init.hipsPos.z + (j.dz ?? 0);
      }
    }
    resolveTargets(key).forEach(([name, sign]) => {
      const bone = getBone(name);
      if (!bone) return;
      if (j.x !== undefined) bone.rotation.x = j.x;
      if (j.y !== undefined) bone.rotation.y = sign * j.y;
      if (j.z !== undefined) bone.rotation.z = sign * j.z;
    });
  });

  // 2) Whole-body tilt + turn (pitch about X, then yaw about world Y)
  const scene = char.scene;
  const pitch = lerp(m.pitch[0], m.pitch[1], phase);
  scene.quaternion.setFromEuler(new THREE.Euler(pitch, m.yaw, m.roll ?? 0, 'YXZ'));
  scene.position.set(0, 0, 0);
  scene.updateMatrixWorld(true);

  // 3) Floor / step contact: rest the lowest body part on the floor
  const raise = m.raise ?? {};
  const v = new THREE.Vector3();
  const worldOf = (n: string): THREE.Vector3 | null => {
    const bn = getBone(n);
    if (!bn) return null;
    return bn.getWorldPosition(v).clone();
  };
  let minY = Infinity;
  Object.keys(CONTACT_RADIUS).forEach((n) => {
    const p = worldOf(n);
    if (!p) return;
    let r = CONTACT_RADIUS[n];
    if (n.includes('Hand')) r += raise.hand ?? 0;
    if (n.includes('Foot') || n.includes('Toe')) r += raise.foot ?? 0;
    minY = Math.min(minY, p.y - r);
  });
  if (!isFinite(minY)) minY = 0;

  // Centre the body horizontally around the head, feet and hands
  const centreNames = ['Head', 'LeftFoot', 'RightFoot', 'LeftHand', 'RightHand'];
  let cx = 0, cz = 0, cn = 0;
  centreNames.forEach((n) => {
    const p = worldOf(n);
    if (p) { cx += p.x; cz += p.z; cn++; }
  });
  if (cn > 0) { cx /= cn; cz /= cn; }
  scene.position.set(-cx, FLOOR_Y - minY, -cz);
  scene.updateMatrixWorld(true);

  // 4) Hints for the viewer: camera focus height and step/bench position
  const head = worldOf('Head');
  scene.userData.focusY = head ? Math.max(-0.6, Math.min(0.05, (head.y + FLOOR_Y) / 2)) : 0.05;

  const stepHeight = raise.foot ?? raise.hand ?? 0;
  if (stepHeight > 0) {
    const names = raise.foot ? ['LeftToeBase', 'RightToeBase'] : ['LeftHand', 'RightHand'];
    let px = 0, pz = 0, pn = 0;
    names.forEach((n) => {
      const p = worldOf(n);
      if (p) { px += p.x; pz += p.z; pn++; }
    });
    if (pn > 0) {
      scene.userData.platform = { x: px / pn, z: pz / pn, height: stepHeight, yaw: m.yaw };
    }
  } else {
    scene.userData.platform = undefined;
  }
}
