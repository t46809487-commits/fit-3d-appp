import * as THREE from 'three';
import type { LoadedCharacter } from './characterLoader';

// ---------------------------------------------------------------------------
// Exercise equipment drawn around the character: dumbbells, barbell, resistance band,
// cable machine, benches / seats and the pull-up bar.
// Everything is attached by animationType (see EQUIPMENT below), follows the character's
// hands/feet every frame, and is built from simple shapes (no model files needed).
// ---------------------------------------------------------------------------

const FLOOR = -0.905; // top of the studio floor (same value as in poseEngine / Human3DModel)

/** Position relative to the hips at the start pose (metres). fwd = the way the character faces. */
interface Anchor { fwd: number; up: number; side?: number }

export type PropSpec =
  | { k: 'dumbbell'; hands?: 'both' | 'left' | 'right' }
  | { k: 'barbell' }
  | { k: 'band' }                                           // resistance band: hands -> feet
  | { k: 'cable'; anchor: Anchor; hands?: 'both' | 'left' | 'right'; sides?: boolean; bar?: boolean }
  | { k: 'torsoBench' }                                     // pad under the back (flat / incline / reclined)
  | { k: 'seat' }                                           // seat under the hips
  | { k: 'handBench' }                                      // bench under the hands (bench dips)
  | { k: 'rearBench' }                                      // bench under the rear foot (split squat)
  | { k: 'pullupBar' };                                     // bar at hand height with two posts

const DB: PropSpec = { k: 'dumbbell' };
const BB: PropSpec = { k: 'barbell' };
const BENCH: PropSpec = { k: 'torsoBench' };

/** animationType -> equipment. Exercises not listed here have no equipment. */
export const EQUIPMENT: Record<string, PropSpec[]> = {
  // chest
  db_bench_press: [DB, BENCH],
  db_incline_press: [DB, BENCH],
  db_chest_fly: [DB, BENCH],
  barbell_bench_press: [BB, BENCH],
  cable_crossover: [{ k: 'cable', anchor: { fwd: 0.0, up: 1.1, side: 1.0 }, sides: true }],
  // back
  pull_up: [{ k: 'pullupBar' }],
  inverted_row: [{ k: 'pullupBar' }],
  band_row: [{ k: 'band' }],
  db_bent_row: [DB],
  db_one_arm_row: [{ k: 'dumbbell', hands: 'left' }],
  barbell_bent_row: [BB],
  lat_pulldown: [{ k: 'cable', anchor: { fwd: 0.1, up: 1.7 }, bar: true }, { k: 'seat' }],
  seated_cable_row: [{ k: 'cable', anchor: { fwd: 1.6, up: 0.05 }, bar: true }, { k: 'seat' }],
  face_pull: [{ k: 'cable', anchor: { fwd: 1.2, up: 0.8 } }],
  barbell_deadlift: [BB],
  db_rdl: [DB],
  // shoulders
  db_overhead_press: [DB],
  barbell_overhead_press: [BB],
  push_press: [BB],
  db_lateral_raise: [DB],
  cable_lateral_raise: [{ k: 'cable', anchor: { fwd: 0.0, up: -0.75, side: -0.5 }, hands: 'left' }],
  front_raise: [DB],
  arnold_press: [DB],
  rear_delt_fly: [DB],
  upright_row: [DB],
  // arms
  db_bicep_curl: [DB],
  hammer_curl: [DB],
  concentration_curl: [DB],
  barbell_curl: [BB],
  tricep_extension: [DB],
  tricep_kickback: [DB],
  cable_pushdown: [{ k: 'cable', anchor: { fwd: 0.25, up: 1.25 }, bar: true }],
  bench_dips: [{ k: 'handBench' }],
  // legs / full body
  goblet_squat: [DB],
  barbell_back_squat: [BB],
  thruster: [DB],
  leg_press: [BENCH],
  bulgarian_split_squat: [{ k: 'rearBench' }],
  farmer_walk: [DB],
  // abs
  cable_crunch: [{ k: 'cable', anchor: { fwd: 0.05, up: 1.3 } }],
};

export interface Equipment {
  group: THREE.Group;
  /** Call once per frame, after the character pose has been applied. */
  update: () => void;
  dispose: () => void;
}

const UP = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

const matMetal = () => new THREE.MeshStandardMaterial({ color: 0x2b303b, roughness: 0.45, metalness: 0.6 });
const matChrome = () => new THREE.MeshStandardMaterial({ color: 0xb9c0cc, roughness: 0.3, metalness: 0.8 });
const matPad = () => new THREE.MeshStandardMaterial({ color: 0x2f3340, roughness: 0.8, metalness: 0.0 });
const matFrame = () => new THREE.MeshStandardMaterial({ color: 0x8e97a8, roughness: 0.5, metalness: 0.5 });
const matBand = () => new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.6 });
const matCable = () => new THREE.MeshStandardMaterial({ color: 0x3a3f4b, roughness: 0.6 });

/** Unit-height cylinder (along Y) that we stretch between two points. */
function makeLink(radius: number, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 10), mat);
  m.castShadow = true;
  return m;
}
function setLink(m: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  const dir = b.clone().sub(a);
  const len = dir.length();
  m.visible = len > 1e-4;
  if (!m.visible) return;
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, dir.multiplyScalar(1 / len));
  m.scale.set(1, len, 1);
}

function makeDumbbell(): THREE.Group {
  const g = new THREE.Group();
  const metal = matMetal();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.16, 12), matChrome());
  handle.rotation.x = Math.PI / 2;            // axis along Z (across the knuckles)
  g.add(handle);
  for (const z of [-0.085, 0.085]) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.045, 6), metal);
    plate.rotation.x = Math.PI / 2;
    plate.position.z = z;
    plate.castShadow = true;
    g.add(plate);
  }
  return g;
}

function makeBarbell(): THREE.Group {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2.0, 12), matChrome());
  bar.rotation.z = Math.PI / 2;               // axis along X
  g.add(bar);
  for (const x of [-0.78, 0.78]) {
    const big = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.045, 24), matMetal());
    big.rotation.z = Math.PI / 2;
    big.position.x = x;
    big.castShadow = true;
    g.add(big);
    const small = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 24), matMetal());
    small.rotation.z = Math.PI / 2;
    small.position.x = x * 0.91;
    g.add(small);
  }
  return g;
}

export function createEquipment(
  char: LoadedCharacter,
  specs: PropSpec[],
  /** Poses the character at the start of the exercise (used once to place the fixed parts). */
  poseAtStart: () => void
): Equipment {
  const group = new THREE.Group();
  const updaters: Array<() => void> = [];
  const disposables: THREE.Object3D[] = [];

  const bone = (n: string) => char.bones['mixamorig' + n] || char.bones['mixamorig:' + n];
  const pos = (n: string): THREE.Vector3 => {
    const b = bone(n);
    return b ? b.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
  };
  const quat = (n: string): THREE.Quaternion => {
    const b = bone(n);
    return b ? b.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion();
  };
  // Where the hand actually holds something (a bit past the wrist, towards the knuckles)
  const grip = (side: 'Left' | 'Right'): THREE.Vector3 => {
    const wrist = pos(side + 'Hand');
    const knuckle = bone(side + 'HandMiddle1') ? pos(side + 'HandMiddle1') : null;
    return knuckle ? wrist.clone().lerp(knuckle, 0.75) : wrist;
  };
  const refresh = () => char.scene.updateMatrixWorld(true);
  const add = (o: THREE.Object3D) => { group.add(o); disposables.push(o); };

  // Fixed parts are placed from the start pose
  poseAtStart();
  refresh();
  const hips0 = pos('Hips');
  const hipsQ = quat('Hips');
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(hipsQ); forward.y = 0;
  if (forward.lengthSq() < 1e-4) forward.set(0, 0, 1);
  forward.normalize();
  const left = new THREE.Vector3().crossVectors(UP, forward).normalize();   // character's left

  for (const spec of specs) {
    switch (spec.k) {
      case 'dumbbell': {
        const sides: Array<'Left' | 'Right'> =
          spec.hands === 'left' ? ['Left'] : spec.hands === 'right' ? ['Right'] : ['Left', 'Right'];
        sides.forEach((side) => {
          const db = makeDumbbell();
          add(db);
          updaters.push(() => {
            db.position.copy(grip(side));
            db.quaternion.copy(quat(side + 'Hand'));
          });
        });
        break;
      }

      case 'barbell': {
        const bb = makeBarbell();
        add(bb);
        updaters.push(() => {
          const a = grip('Left'), b = grip('Right');
          const axis = b.clone().sub(a);
          bb.position.copy(a).add(b).multiplyScalar(0.5);
          if (axis.length() > 0.08) bb.quaternion.setFromUnitVectors(X_AXIS, axis.normalize().multiplyScalar(-1));
          else bb.quaternion.identity();
        });
        break;
      }

      case 'band': {
        const links: Array<{ m: THREE.Mesh; hand: 'Left' | 'Right' }> = [];
        (['Left', 'Right'] as const).forEach((hand) => {
          const m = makeLink(0.012, matBand());
          add(m);
          links.push({ m, hand });
          const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), matBand());
          add(knob);
          updaters.push(() => knob.position.copy(grip(hand)));
        });
        updaters.push(() => {
          links.forEach(({ m, hand }) => setLink(m, grip(hand), pos(hand + 'ToeBase').add(new THREE.Vector3(0, 0.04, 0))));
        });
        break;
      }

      case 'cable': {
        const handsSel = spec.hands ?? 'both';
        const sides: Array<'Left' | 'Right'> =
          handsSel === 'left' ? ['Left'] : handsSel === 'right' ? ['Right'] : ['Left', 'Right'];
        const anchors = spec.sides
          ? [hips0.clone().addScaledVector(forward, spec.anchor.fwd).addScaledVector(UP, spec.anchor.up).addScaledVector(left, spec.anchor.side ?? 0),
             hips0.clone().addScaledVector(forward, spec.anchor.fwd).addScaledVector(UP, spec.anchor.up).addScaledVector(left, -(spec.anchor.side ?? 0))]
          : [hips0.clone().addScaledVector(forward, spec.anchor.fwd).addScaledVector(UP, spec.anchor.up).addScaledVector(left, spec.anchor.side ?? 0)];
        // pulley + tower for each anchor
        anchors.forEach((a) => {
          const pulley = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 14), matChrome());
          pulley.position.copy(a);
          add(pulley);
          const topY = Math.max(a.y + 0.2, FLOOR + 0.5);
          const tower = new THREE.Mesh(new THREE.BoxGeometry(0.14, topY - FLOOR, 0.14), matFrame());
          tower.position.set(a.x, (topY + FLOOR) / 2, a.z);
          // tower sits slightly behind the pulley, away from the character
          tower.position.addScaledVector(forward, spec.anchor.fwd > 0 ? 0.12 : 0);
          add(tower);
        });
        const lines: THREE.Mesh[] = [];
        sides.forEach(() => { const l = makeLink(0.006, matCable()); add(l); lines.push(l); });
        let barMesh: THREE.Mesh | null = null;
        if (spec.bar && sides.length === 2) { barMesh = makeLink(0.014, matChrome()); add(barMesh); }
        updaters.push(() => {
          sides.forEach((side, i) => {
            const a = anchors[spec.sides ? (side === 'Left' ? 0 : 1) : 0];
            setLink(lines[i], grip(side), a);
          });
          if (barMesh) setLink(barMesh, grip('Left'), grip('Right'));
        });
        break;
      }

      case 'torsoBench': {
        const hips = pos('Hips'), head = pos('Head');
        const axis = head.clone().sub(hips).normalize();
        const back = new THREE.Vector3(0, 0, -1).applyQuaternion(quat('Spine1')).normalize();
        const lateral = pos('LeftUpLeg').sub(pos('RightUpLeg')).normalize();
        const zAxis = axis.clone();
        const yAxis = back.clone().sub(zAxis.clone().multiplyScalar(back.dot(zAxis))).normalize();
        const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
        if (xAxis.dot(lateral) < 0) xAxis.multiplyScalar(-1);
        const len = head.distanceTo(hips) + 0.55;
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, len), matPad());
        pad.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
        pad.position.copy(hips).addScaledVector(zAxis, len / 2 - 0.25).addScaledVector(yAxis, 0.10 + 0.045);
        pad.castShadow = true;
        add(pad);
        // two posts to the floor, at each end of the pad
        for (const t of [-len / 2 + 0.12, len / 2 - 0.12]) {
          const top = pad.position.clone().addScaledVector(zAxis, t).addScaledVector(yAxis, -0.045);
          const post = makeLink(0.025, matFrame());
          setLink(post, top, new THREE.Vector3(top.x, FLOOR + 0.005, top.z));
          add(post);
        }
        break;
      }

      case 'seat': {
        const top = hips0.y - 0.12;
        const h = Math.max(top - FLOOR, 0.05);
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, h, 0.42), matPad());
        seat.position.set(hips0.x, FLOOR + h / 2, hips0.z);
        seat.position.addScaledVector(forward, -0.06);
        seat.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward);
        add(seat);
        break;
      }

      case 'handBench': {
        const a = grip('Left'), b = grip('Right');
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const top = mid.y - 0.05;
        const h = Math.max(top - FLOOR, 0.05);
        const lateral = a.clone().sub(b); lateral.y = 0;
        if (lateral.lengthSq() < 1e-4) lateral.copy(left); lateral.normalize();
        const bench = new THREE.Mesh(new THREE.BoxGeometry(0.62, h, 0.3), matPad());
        bench.position.set(mid.x, FLOOR + h / 2, mid.z);
        bench.quaternion.setFromUnitVectors(X_AXIS, lateral);
        add(bench);
        break;
      }

      case 'rearBench': {
        const foot = pos('RightFoot');
        const top = foot.y - 0.05;
        const h = Math.max(top - FLOOR, 0.05);
        const bench = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 0.4), matPad());
        bench.position.set(foot.x, FLOOR + h / 2, foot.z);
        bench.position.addScaledVector(forward, -0.05);
        bench.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward);
        add(bench);
        break;
      }

      case 'pullupBar': {
        const a = grip('Left'), b = grip('Right');
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const lateral = a.clone().sub(b); lateral.y = 0;
        if (lateral.lengthSq() < 1e-4) lateral.copy(left); lateral.normalize();
        const half = 0.7;
        const p1 = mid.clone().addScaledVector(lateral, half);
        const p2 = mid.clone().addScaledVector(lateral, -half);
        const bar = makeLink(0.02, matChrome());
        setLink(bar, p1, p2);
        add(bar);
        for (const p of [p1, p2]) {
          const post = makeLink(0.03, matFrame());
          setLink(post, new THREE.Vector3(p.x, FLOOR + 0.005, p.z), p);
          add(post);
        }
        break;
      }
    }
  }

  const update = () => {
    refresh();
    updaters.forEach((u) => u());
  };
  update();

  return {
    group,
    update,
    dispose() {
      disposables.forEach((o) =>
        o.traverse((c) => {
          const mesh = c as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else if (mat) mat.dispose();
        })
      );
      group.clear();
    },
  };
}
