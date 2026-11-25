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
  restOf: (key: string, comp: string) => number,
  mid?: PoseDef
): Record<string, JointAngles> {
  // With a middle pose: start -> mid in the first half, mid -> end in the second half
  if (mid) {
    return t < 0.5
      ? lerpPose(start, mid, t * 2, restOf)
      : lerpPose(mid, end, (t - 0.5) * 2, restOf);
  }
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

interface Placement {
  x: number; y: number; z: number;
  focusY: number;
  platform?: { x: number; z: number; height: number; yaw: number; w?: number; d?: number };
  bar?: { x: number; z: number; height: number; yaw: number };
}

// Body placement (centre, floor height, camera focus, step position) is worked out ONCE per
// character + motion, then kept fixed. Before, it was recomputed every frame, which made the
// whole body slide around while the exercise played.
const placementCache = new WeakMap<LoadedCharacter, WeakMap<MotionDef, Placement>>();

/**
 * Apply a pose-based motion (start pose -> end pose) to the character.
 * phase: 0 = start, 1 = end (peak). Only the joints and the whole-body tilt change with phase;
 * the body position stays fixed. Publishes camera/prop hints on char.scene.userData
 * (focusY, platform), which are constant for a given exercise.
 */
export function applyMotion(char: LoadedCharacter, m: MotionDef, phase: number) {
  const bones = char.bones;
  const init = char.initialTransforms;
  const scene = char.scene;
  const getBone = (n: string) => bones['mixamorig' + n] || bones['mixamorig:' + n];
  const raise = m.raise ?? {};
  const v = new THREE.Vector3();
  const worldOf = (n: string): THREE.Vector3 | null => {
    const bn = getBone(n);
    return bn ? bn.getWorldPosition(v).clone() : null;
  };

  // Joint angles + whole-body tilt/turn at a given phase (position is NOT touched here)
  const poseBody = (ph: number) => {
    const restOf = (key: string, comp: string): number => {
      if (comp === 'dy' || comp === 'dz') return 0;
      const target = resolveTargets(key)[0];
      if (!target) return 0;
      const bone = getBone(target[0]);
      if (!bone) return 0;
      const val = comp === 'x' ? bone.rotation.x : comp === 'y' ? bone.rotation.y : bone.rotation.z;
      return comp === 'x' ? val : val * target[1];
    };
    const pose = lerpPose(m.start, m.end, ph, restOf, m.mid);
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
    const pitch = m.mid && m.midPitch !== undefined
      ? (ph < 0.5 ? lerp(m.pitch[0], m.midPitch, ph * 2) : lerp(m.midPitch, m.pitch[1], (ph - 0.5) * 2))
      : lerp(m.pitch[0], m.pitch[1], ph);
    scene.quaternion.setFromEuler(new THREE.Euler(pitch, m.yaw, m.roll ?? 0, 'YXZ'));
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);
  };

  let perChar = placementCache.get(char);
  if (!perChar) { perChar = new WeakMap(); placementCache.set(char, perChar); }
  let placement = perChar.get(m);

  if (!placement) {
    // Snapshot the rest state so every sample starts from the same bones
    const snap = new Map<THREE.Bone, { rot: THREE.Euler; pos: THREE.Vector3 }>();
    Object.values(bones).forEach((b) => snap.set(b, { rot: b.rotation.clone(), pos: b.position.clone() }));
    const restore = () => snap.forEach((s, b) => { b.rotation.copy(s.rot); b.position.copy(s.pos); });

    const SAMPLES = 9;
    let minY = Infinity, sx = 0, sz = 0, sn = 0, headY = 0, hn = 0;
    let px = 0, pz = 0, pn = 0;
    // Snapshot at phase 0 (used for the pull-up bar and for a bench under the back)
    let h0: THREE.Vector3 | null = null;
    let spine0: THREE.Vector3 | null = null;
    let hipsY0: number | null = null;
    const stepNames = raise.foot ? ['LeftToeBase', 'RightToeBase'] : ['LeftHand', 'RightHand'];
    const stepHeight = raise.foot ?? raise.hand ?? 0;

    for (let i = 0; i < SAMPLES; i++) {
      restore();
      poseBody(i / (SAMPLES - 1));
      Object.keys(CONTACT_RADIUS).forEach((n) => {
        if (m.ignoreContact && m.ignoreContact.includes(n)) return;
        const p = worldOf(n);
        if (!p) return;
        let r = CONTACT_RADIUS[n];
        if (n.includes('Hand')) r += raise.hand ?? 0;
        if (n.includes('Foot') || n.includes('Toe')) r += raise.foot ?? 0;
        minY = Math.min(minY, p.y - r);
      });
      ['Head', 'LeftFoot', 'RightFoot', 'LeftHand', 'RightHand'].forEach((n) => {
        const p = worldOf(n);
        if (p) { sx += p.x; sz += p.z; sn++; }
      });
      const h = worldOf('Head');
      if (h) { headY += h.y; hn++; }
      if (i === 0) {
        const lh = worldOf('LeftHand'), rh = worldOf('RightHand'), sp = worldOf('Spine1'), hp = worldOf('Hips');
        if (lh && rh) h0 = lh.clone().add(rh).multiplyScalar(0.5);
        if (sp) spine0 = sp.clone();
        if (hp) hipsY0 = hp.y;
      }
      if (stepHeight > 0) {
        stepNames.forEach((n) => {
          const p = worldOf(n);
          if (p) { px += p.x; pz += p.z; pn++; }
        });
      }
    }
    restore();

    if (!isFinite(minY)) minY = 0;
    const cx = sn > 0 ? sx / sn : 0;
    const cz = sn > 0 ? sz / sn : 0;
    let offX = -cx, offY = FLOOR_Y - minY, offZ = -cz;
    let bar: Placement['bar'];
    const hand0 = h0 as THREE.Vector3 | null;
    if (m.bar !== undefined && hand0) {
      // Hanging from an overhead bar: the hands (not the floor) fix the body height
      offX = -hand0.x;
      offZ = -hand0.z;
      offY = FLOOR_Y + m.bar - hand0.y;
      bar = { x: 0, z: 0, height: m.bar, yaw: m.yaw };
    }
    const headWorldY = hn > 0 ? headY / hn + offY : null;
    let platform: Placement['platform'] = stepHeight > 0 && pn > 0
      ? { x: px / pn - cx, z: pz / pn - cz, height: stepHeight, yaw: m.yaw }
      : undefined;
    const sp0 = spine0 as THREE.Vector3 | null;
    if (m.bench && sp0 && hipsY0 !== null) {
      // Bench under the back: its top is where the hips rest
      const top = hipsY0 + offY - CONTACT_RADIUS.Hips - FLOOR_Y;
      platform = {
        x: sp0.x + offX, z: sp0.z + offZ, height: Math.max(0.2, top), yaw: m.yaw,
        w: m.bench.width, d: m.bench.length,
      };
    }
    placement = {
      x: offX, y: offY, z: offZ,
      focusY: headWorldY !== null ? Math.max(-0.6, Math.min(0.05, (headWorldY + FLOOR_Y) / 2)) : 0.05,
      platform,
      bar,
    };
    perChar.set(m, placement);
  }

  // Final pose for this frame, with the fixed placement
  poseBody(phase);
  scene.position.set(placement.x, placement.y, placement.z);
  scene.updateMatrixWorld(true);
  scene.userData.focusY = placement.focusY;
  scene.userData.platform = placement.platform;
  scene.userData.bar = placement.bar;
}
