import { V3, add, scl, lerp, lerp3, mulV, Ry, smooth } from './boxingMath';
import { Skel, Resolved, FootT, HandT, Solution, solve, torsoFK } from './boxingRig';

// ---------------------------------------------------------------------------------------------
// Boxing moves: punches, footwork and defence.
// A move is a list of key poses. Between keys everything is blended, then the IK rig makes sure
// feet stay planted and the gloves go exactly where the key says. All lengths are for a character
// with hips at 1.04 m and are scaled to the real model automatically.
// ---------------------------------------------------------------------------------------------

export interface HandSpec { frame: 'torso' | 'world'; p: V3; pole: V3 }
export interface Spec {
  hip: { x: number; z: number; drop: number; yaw: number; lean: number; roll: number };
  twist: number; bend: number; sway: number;
  head: { yaw: number; pitch: number };
  footL: FootT; footR: FootT;
  handL: HandSpec; handR: HandSpec;
}
type Over = {
  hip?: Partial<Spec['hip']>; twist?: number; bend?: number; sway?: number; head?: Partial<Spec['head']>;
  footL?: Partial<FootT>; footR?: Partial<FootT>; handL?: Partial<HandSpec>; handR?: Partial<HandSpec>;
};

// Orthodox guard: left foot / left hand in front. Hands are given relative to the chest (torso frame).
export const GUARD: Spec = {
  hip: { x: 0, z: -0.02, drop: 0.09, yaw: -0.35, lean: 0.10, roll: 0 },
  twist: -0.30, bend: 0.06, sway: 0,
  head: { yaw: -0.05, pitch: 0.14 },
  footL: { x: 0.10, y: 0, z: 0.30, yaw: -0.20, heel: 0.08 },
  footR: { x: -0.18, y: 0, z: -0.30, yaw: -0.85, heel: 0.55 },
  handL: { frame: 'torso', p: [0.10, 0.15, 0.28], pole: [0.4, -1, -0.2] },
  handR: { frame: 'torso', p: [-0.08, 0.13, 0.20], pole: [-0.4, -1, -0.2] },
};

export const mk = (o: Over = {}, base: Spec = GUARD): Spec => ({
  hip: { ...base.hip, ...o.hip },
  twist: o.twist ?? base.twist, bend: o.bend ?? base.bend, sway: o.sway ?? base.sway,
  head: { ...base.head, ...o.head },
  footL: { ...base.footL, ...o.footL }, footR: { ...base.footR, ...o.footR },
  handL: { ...base.handL, ...o.handL }, handR: { ...base.handR, ...o.handR },
});

export interface Key { t: number; pose: Spec; ease?: 'smooth' | 'lin' }
export type Kind = 'punch' | 'footwork' | 'defense';
export interface MoveDef {
  id: string; name: string; kind: Kind;
  keys: Key[];
  /** seconds for one full cycle (punch = out and back) */
  duration: number;
  /** phase exponents per body part: <1 starts earlier, >1 arrives later (hips lead, hands arrive last) */
  shape?: { hips?: number; torso?: number; feet?: number; hands?: number };
}

// ---------------------------------------------------------------------------------------------
// Resolving a blended pose into numbers
// ---------------------------------------------------------------------------------------------
const lerpFoot = (a: FootT, b: FootT, t: number): FootT => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), yaw: lerp(a.yaw, b.yaw, t), heel: lerp(a.heel, b.heel, t),
});

function findSeg(keys: Key[], t: number): { a: Key; b: Key; u: number } {
  if (t <= keys[0].t) return { a: keys[0], b: keys[0], u: 0 };
  for (let i = 0; i < keys.length - 1; i++) {
    if (t <= keys[i + 1].t) {
      const span = keys[i + 1].t - keys[i].t;
      const raw = span < 1e-9 ? 1 : (t - keys[i].t) / span;
      return { a: keys[i], b: keys[i + 1], u: keys[i + 1].ease === 'lin' ? raw : smooth(raw) };
    }
  }
  const last = keys[keys.length - 1];
  return { a: last, b: last, u: 0 };
}

function handWorld(h: HandSpec, sp2: V3, yawTot: number, k: number): HandT {
  if (h.frame === 'world') return { p: scl(h.p, k), pole: h.pole };
  const R = Ry(yawTot);
  return { p: add(sp2, mulV(R, scl(h.p, k))), pole: mulV(R, h.pole) };
}

/** Resolve a move at time t (0..1) into a pose for the rig. */
export function resolve(sk: Skel, move: MoveDef, t: number): Resolved {
  const k = sk.k;
  const sh = move.shape ?? {};
  const tc = (p: number | undefined) => Math.pow(Math.min(1, Math.max(0, t)), p ?? 1);
  const sH = findSeg(move.keys, tc(sh.hips)), sT = findSeg(move.keys, tc(sh.torso));
  const sF = findSeg(move.keys, tc(sh.feet)), sN = findSeg(move.keys, tc(sh.hands));
  const hip = {
    x: lerp(sH.a.pose.hip.x, sH.b.pose.hip.x, sH.u) * k, z: lerp(sH.a.pose.hip.z, sH.b.pose.hip.z, sH.u) * k,
    drop: lerp(sH.a.pose.hip.drop, sH.b.pose.hip.drop, sH.u) * k,
    yaw: lerp(sH.a.pose.hip.yaw, sH.b.pose.hip.yaw, sH.u), lean: lerp(sH.a.pose.hip.lean, sH.b.pose.hip.lean, sH.u),
    roll: lerp(sH.a.pose.hip.roll, sH.b.pose.hip.roll, sH.u),
  };
  const L = (f: (p: Spec) => number) => lerp(f(sT.a.pose), f(sT.b.pose), sT.u);
  const twist = L((p) => p.twist), bend = L((p) => p.bend), sway = L((p) => p.sway);
  const head = { yaw: L((p) => p.head.yaw), pitch: L((p) => p.head.pitch) };
  const sc = (f: FootT): FootT => ({ ...f, x: f.x * k, y: f.y * k, z: f.z * k });
  const footL = sc(lerpFoot(sF.a.pose.footL, sF.b.pose.footL, sF.u));
  const footR = sc(lerpFoot(sF.a.pose.footR, sF.b.pose.footR, sF.u));
  const partial: Resolved = {
    hip, twist, bend, sway, head, footL, footR,
    handL: { p: [0, 0, 0], pole: [0, -1, 0] }, handR: { p: [0, 0, 0], pole: [0, -1, 0] },
  };
  // hands are placed relative to the CURRENT torso so they follow every turn of the body
  const tor = torsoFK(sk, partial);
  const yawTot = hip.yaw + twist;
  const hand = (side: 'handL' | 'handR'): HandT => {
    const A = handWorld(sN.a.pose[side], tor.pos.spine2, yawTot, k);
    const B = handWorld(sN.b.pose[side], tor.pos.spine2, yawTot, k);
    return { p: lerp3(A.p, B.p, sN.u), pole: lerp3(A.pole, B.pole, sN.u) };
  };
  partial.handL = hand('handL');
  partial.handR = hand('handR');
  return partial;
}

export const poseOf = (sk: Skel, move: MoveDef, t: number): Solution => solve(sk, resolve(sk, move, t));

// ---------------------------------------------------------------------------------------------
// PUNCHES (phase 0 = guard, 1 = fist lands; the app plays out-and-back)
// ---------------------------------------------------------------------------------------------
const G = GUARD;
const OPP_Y = 1.50; // face height of the opponent / bag centre
const punch = (id: string, name: string, keys: Key[], shape: MoveDef['shape'], duration = 0.8): MoveDef =>
  ({ id, name, kind: 'punch', keys, duration, shape });

export const JAB = punch('box_jab', 'Lead Jab', [
  { t: 0, pose: G },
  { t: 1, pose: mk({
    hip: { z: 0.05, drop: 0.10, yaw: -0.42, lean: 0.14 }, twist: -0.50, bend: 0.10,
    footR: { heel: 0.75 },
    handL: { frame: 'world', p: [0.03, OPP_Y, 0.86], pole: [0.25, -1, -0.2] },
    handR: { p: [-0.07, 0.15, 0.17] },
  }) },
], { hips: 0.8, torso: 0.9, hands: 1.1 });

export const CROSS = punch('box_cross', 'Rear Cross', [
  { t: 0, pose: G },
  { t: 1, pose: mk({
    hip: { z: 0.10, drop: 0.11, yaw: 0.12, lean: 0.16 }, twist: 0.22, bend: 0.12,
    footL: { heel: 0.10 }, footR: { yaw: -0.30, heel: 1.0 },
    handR: { frame: 'world', p: [-0.03, OPP_Y, 0.88], pole: [-0.25, -1, -0.2] },
    handL: { p: [0.12, 0.14, 0.20] },
  }) },
], { hips: 0.75, torso: 0.85, hands: 1.15 });

export const L_HOOK = punch('box_left_hook', 'Lead Hook', [
  { t: 0, pose: G },
  { t: 0.55, pose: mk({
    hip: { z: 0.02, yaw: -0.62, lean: 0.12 }, twist: -0.45,
    footL: { yaw: -0.50, heel: 0.35 },
    handL: { frame: 'world', p: [0.40, 1.44, 0.50], pole: [1, 0.2, 0] },
  }) },
  { t: 1, pose: mk({
    hip: { x: 0.02, z: 0.05, drop: 0.10, yaw: -0.82, lean: 0.14 }, twist: -0.55, bend: 0.10,
    footL: { yaw: -0.80, heel: 0.55 },
    handL: { frame: 'world', p: [0.02, 1.48, 0.70], pole: [1, 0.15, 0] },
    handR: { p: [-0.06, 0.15, 0.16] },
  }) },
], { hips: 0.8, torso: 0.9, hands: 1.1 });

export const R_HOOK = punch('box_right_hook', 'Rear Hook', [
  { t: 0, pose: G },
  { t: 0.55, pose: mk({
    hip: { z: 0.04, yaw: 0.05, lean: 0.12 }, twist: 0.05,
    footR: { yaw: -0.55, heel: 0.85 },
    handR: { frame: 'world', p: [-0.40, 1.44, 0.46], pole: [-1, 0.2, 0] },
  }) },
  { t: 1, pose: mk({
    hip: { z: 0.09, drop: 0.11, yaw: 0.40, lean: 0.15 }, twist: 0.30, bend: 0.12,
    footL: { heel: 0.10 }, footR: { yaw: -0.25, heel: 1.0 },
    handR: { frame: 'world', p: [-0.02, 1.48, 0.68], pole: [-1, 0.15, 0] },
    handL: { p: [0.12, 0.14, 0.19] },
  }) },
], { hips: 0.75, torso: 0.85, hands: 1.1 });

export const L_UPPER = punch('box_left_uppercut', 'Lead Uppercut', [
  { t: 0, pose: G },
  { t: 0.45, pose: mk({
    hip: { z: 0.02, drop: 0.21, yaw: -0.40, lean: 0.20, roll: 0.05 }, twist: -0.42, bend: 0.14,
    handL: { frame: 'torso', p: [0.12, -0.24, 0.24], pole: [0.2, -1, -0.5] },
  }) },
  { t: 1, pose: mk({
    hip: { z: 0.06, drop: 0.12, yaw: -0.55, lean: 0.12 }, twist: -0.45, bend: 0.08,
    handL: { frame: 'world', p: [0.05, 1.36, 0.62], pole: [0.3, -1, -0.4] },
    handR: { p: [-0.07, 0.14, 0.18] },
  }) },
], { hips: 0.85, torso: 0.95, hands: 1.05 });

export const R_UPPER = punch('box_right_uppercut', 'Rear Uppercut', [
  { t: 0, pose: G },
  { t: 0.45, pose: mk({
    hip: { z: 0.0, drop: 0.22, yaw: -0.25, lean: 0.20, roll: -0.05 }, twist: -0.18, bend: 0.14,
    footR: { heel: 0.8 },
    handR: { frame: 'torso', p: [-0.10, -0.24, 0.20], pole: [-0.2, -1, -0.5] },
  }) },
  { t: 1, pose: mk({
    hip: { z: 0.08, drop: 0.12, yaw: 0.20, lean: 0.12 }, twist: 0.15, bend: 0.08,
    footL: { heel: 0.10 }, footR: { yaw: -0.40, heel: 1.0 },
    handR: { frame: 'world', p: [-0.04, 1.36, 0.62], pole: [-0.3, -1, -0.4] },
    handL: { p: [0.12, 0.14, 0.19] },
  }) },
], { hips: 0.85, torso: 0.95, hands: 1.05 });

export const GUARD_MOVE: MoveDef = {
  id: 'box_guard', name: 'Boxing Guard', kind: 'defense', duration: 1.6,
  keys: [{ t: 0, pose: G }, { t: 0.5, pose: mk({ hip: { drop: 0.11 }, head: { pitch: 0.16 } }) }, { t: 1, pose: G }],
};

// ---------------------------------------------------------------------------------------------
// FOOTWORK  (one cycle = step out, then step back; the feet leave the floor only while stepping)
// ---------------------------------------------------------------------------------------------
type Side = 'L' | 'R';
const tx = (x: number, z: number, psi: number, px: number, pz: number): [number, number] => {
  const dx = x - px, dz = z - pz;
  return [px + dx * Math.cos(psi) + dz * Math.sin(psi), pz - dx * Math.sin(psi) + dz * Math.cos(psi)];
};

/** The guard stance moved by (dx,dz) and rotated by psi around (px,pz). */
export function stanceAt(dx: number, dz: number, psi = 0, px = 0, pz = 0, extra: Over = {}): Spec {
  const f = (b: FootT): FootT => {
    const [x, z] = tx(b.x, b.z, psi, px, pz);
    return { ...b, x: x + dx, z: z + dz, yaw: b.yaw + psi };
  };
  const [hx, hz] = tx(G.hip.x, G.hip.z, psi, px, pz);
  return mk({
    ...extra,
    hip: { x: hx + dx, z: hz + dz, yaw: G.hip.yaw + psi, ...extra.hip },
    footL: { ...f(G.footL), ...extra.footL }, footR: { ...f(G.footR), ...extra.footR },
  });
}

const mixFoot = (a: FootT, b: FootT, t: number, lift = 0): FootT => ({ ...lerpFoot(a, b, t), y: lerp(a.y, b.y, t) + lift });
const mixHip = (a: Spec, b: Spec, t: number): Spec['hip'] => ({
  x: lerp(a.hip.x, b.hip.x, t), z: lerp(a.hip.z, b.hip.z, t), drop: lerp(a.hip.drop, b.hip.drop, t),
  yaw: lerp(a.hip.yaw, b.hip.yaw, t), lean: lerp(a.hip.lean, b.hip.lean, t), roll: lerp(a.hip.roll, b.hip.roll, t),
});

/** Key poses that take the boxer from stance A to stance B: first foot moves, then the other follows. */
function stepKeys(A: Spec, B: Spec, first: Side, lift: number): Spec[] {
  const second: Side = first === 'L' ? 'R' : 'L';
  const fk = (s: Side) => (s === 'L' ? 'footL' : 'footR') as 'footL' | 'footR';
  const mk4 = (w: number, firstT: number | 'mid', secondT: number | 'mid', bob: number): Spec => {
    const sp = mk({}, B);
    const set = (s: Side, tt: number | 'mid') => {
      const key = fk(s);
      sp[key] = tt === 'mid' ? mixFoot(A[key], B[key], 0.5, lift) : mixFoot(A[key], B[key], tt);
    };
    set(first, firstT); set(second, secondT);
    sp.hip = { ...mixHip(A, B, w), drop: lerp(A.hip.drop, B.hip.drop, w) + bob };
    return sp;
  };
  return [
    mk({}, A),
    mk4(0.25, 'mid', 0, 0.015),
    mk4(0.50, 1, 0, 0),
    mk4(0.75, 1, 'mid', 0.015),
    mk4(1.0, 1, 1, 0),
  ];
}

/** Build a looping move: A -> B (steps) -> back to A (reverse steps). Optional extra poses give multi-leg routes. */
function loopKeys(legs: Array<{ from: Spec; to: Spec; first: Side; lift: number }>): Key[] {
  const out: Spec[] = [];
  legs.forEach((leg, i) => {
    const ks = stepKeys(leg.from, leg.to, leg.first, leg.lift);
    out.push(...(i === 0 ? ks : ks.slice(1)));
  });
  const n = out.length - 1;
  return out.map((pose, i) => ({ t: i / n, pose }));
}

const foot = (id: string, name: string, legs: Parameters<typeof loopKeys>[0], duration: number): MoveDef =>
  ({ id, name, kind: 'footwork', duration, keys: loopKeys(legs) });

/** A -> B and straight back (second half = first half reversed, so the step order is reversed too). */
const outBack = (A: Spec, B: Spec, first: Side, lift: number) => {
  const back: Side = first === 'L' ? 'R' : 'L';
  return [{ from: A, to: B, first, lift }, { from: B, to: A, first: back, lift }];
};

const S0 = G;
export const FOOTWORK: MoveDef[] = [
  foot('fw_forward', 'Forward Step', outBack(S0, stanceAt(0, 0.30), 'L', 0.07), 3.2),
  foot('fw_backward', 'Backward Step', outBack(S0, stanceAt(0, -0.30), 'R', 0.07), 3.2),
  foot('fw_left', 'Left Lateral Step', outBack(S0, stanceAt(0.30, 0), 'L', 0.06), 3.2),
  foot('fw_right', 'Right Lateral Step', outBack(S0, stanceAt(-0.30, 0), 'R', 0.06), 3.2),
  foot('fw_shuffle', 'Boxing Shuffle', [
    ...outBack(S0, stanceAt(0, 0.18, 0, 0, 0, { hip: { drop: 0.10 } }), 'L', 0.025),
    ...outBack(S0, stanceAt(0, 0.18, 0, 0, 0, { hip: { drop: 0.10 } }), 'L', 0.025),
  ], 3.0),
  foot('fw_pivot', 'Pivot Movement', outBack(
    S0, stanceAt(0, 0, -0.85, G.footL.x, G.footL.z), 'R', 0.05), 3.4),
  foot('fw_lateral', 'Lateral Movement', [
    ...outBack(S0, stanceAt(0.26, 0), 'L', 0.06),
    ...outBack(S0, stanceAt(-0.26, 0), 'R', 0.06),
  ], 5.2),
  foot('fw_in_out', 'In-and-Out Footwork', outBack(S0, stanceAt(0, 0.34), 'L', 0.05), 2.0),
  foot('fw_circle', 'Circle Movement', [
    ...outBack(S0, stanceAt(0, 0, -0.32, 0, 1.0), 'L', 0.05),
    ...outBack(S0, stanceAt(0, 0, 0.32, 0, 1.0), 'R', 0.05),
  ], 5.2),
  foot('fw_defensive', 'Defensive Movement', outBack(
    S0, stanceAt(0, -0.26, 0, 0, 0, {
      hip: { lean: -0.06, drop: 0.08 }, bend: -0.04, head: { pitch: 0.10 },
      handL: { p: [0.08, 0.20, 0.22] }, handR: { p: [-0.06, 0.18, 0.16] },
    }), 'R', 0.06), 3.0),
];

// ---------------------------------------------------------------------------------------------
// DEFENCE (feet stay planted, the body does the work)
// ---------------------------------------------------------------------------------------------
const hiGuard = (o: Over = {}) => mk({ handL: { p: [0.10, 0.19, 0.26] }, handR: { p: [-0.07, 0.17, 0.19] }, ...o });
const def = (id: string, name: string, keys: Key[], duration: number): MoveDef => ({ id, name, kind: 'defense', duration, keys });

export const DEFENSE: MoveDef[] = [
  def('df_high_guard', 'High Guard', [
    { t: 0, pose: G },
    { t: 0.35, pose: hiGuard({ hip: { drop: 0.10 }, head: { pitch: 0.20 }, bend: 0.10 }) },
    { t: 0.7, pose: hiGuard({ hip: { drop: 0.11 }, head: { pitch: 0.20 }, bend: 0.11 }) },
    { t: 1, pose: G },
  ], 2.4),
  def('df_slip_left', 'Slip Left', [
    { t: 0, pose: G },
    { t: 0.35, pose: mk({ hip: { x: 0.05, drop: 0.14, yaw: -0.45, roll: -0.02 }, sway: -0.30, twist: -0.40, head: { yaw: -0.05, pitch: 0.14 } }) },
    { t: 0.6, pose: mk({ hip: { x: 0.05, drop: 0.14, yaw: -0.45 }, sway: -0.30, twist: -0.40 }) },
    { t: 1, pose: G },
  ], 1.2),
  def('df_slip_right', 'Slip Right', [
    { t: 0, pose: G },
    { t: 0.35, pose: mk({ hip: { x: -0.05, drop: 0.14, yaw: -0.15 }, sway: 0.30, twist: -0.15, head: { yaw: -0.05, pitch: 0.14 } }) },
    { t: 0.6, pose: mk({ hip: { x: -0.05, drop: 0.14, yaw: -0.15 }, sway: 0.30, twist: -0.15 }) },
    { t: 1, pose: G },
  ], 1.2),
  def('df_bob_weave', 'Bob and Weave', [
    { t: 0, pose: G },
    { t: 0.2, pose: mk({ hip: { x: 0.05, drop: 0.24, lean: 0.24 }, sway: -0.28, bend: 0.16, head: { pitch: 0.2 } }) },
    { t: 0.5, pose: mk({ hip: { x: 0.0, drop: 0.30, lean: 0.28 }, sway: 0.0, bend: 0.18, head: { pitch: 0.22 } }) },
    { t: 0.8, pose: mk({ hip: { x: -0.05, drop: 0.20, lean: 0.20 }, sway: 0.28, bend: 0.14, head: { pitch: 0.18 } }) },
    { t: 1, pose: G },
  ], 2.2),
  def('df_duck', 'Ducking Movement', [
    { t: 0, pose: G },
    { t: 0.35, pose: hiGuard({ hip: { drop: 0.34, lean: 0.30 }, bend: 0.20, head: { pitch: 0.28 } }) },
    { t: 0.65, pose: hiGuard({ hip: { drop: 0.34, lean: 0.30 }, bend: 0.20, head: { pitch: 0.28 } }) },
    { t: 1, pose: G },
  ], 2.0),
  def('df_pull_back', 'Pull Back', [
    { t: 0, pose: G },
    { t: 0.3, pose: mk({
      hip: { z: -0.10, drop: 0.07, lean: -0.16 }, bend: -0.10, head: { pitch: 0.04 },
      footL: { heel: 0.40 }, footR: { heel: 0.15 },
      handL: { p: [0.10, 0.18, 0.22] }, handR: { p: [-0.07, 0.16, 0.16] },
    }) },
    { t: 0.6, pose: mk({ hip: { z: -0.10, drop: 0.07, lean: -0.16 }, bend: -0.10, head: { pitch: 0.04 }, footL: { heel: 0.40 }, footR: { heel: 0.15 } }) },
    { t: 1, pose: G },
  ], 1.4),
  def('df_recovery', 'Guard Recovery', [
    { t: 0, pose: mk({ hip: { lean: 0.04, drop: 0.07 }, head: { pitch: 0.0 }, handL: { p: [0.14, -0.10, 0.34] }, handR: { p: [-0.10, -0.12, 0.28] } }) },
    { t: 0.45, pose: G },
    { t: 1, pose: mk({ hip: { lean: 0.04, drop: 0.07 }, head: { pitch: 0.0 }, handL: { p: [0.14, -0.10, 0.34] }, handR: { p: [-0.10, -0.12, 0.28] } }) },
  ], 2.0),
];

// ---------------------------------------------------------------------------------------------
export const PUNCH_MOVES: MoveDef[] = [JAB, CROSS, L_HOOK, R_HOOK, L_UPPER, R_UPPER];
export const ALL_MOVES: MoveDef[] = [GUARD_MOVE, ...PUNCH_MOVES, ...FOOTWORK, ...DEFENSE];
export const MOVES: Record<string, MoveDef> = Object.fromEntries(ALL_MOVES.map((m) => [m.id, m]));
export const isBoxingMove = (id: string): boolean => id in MOVES;
