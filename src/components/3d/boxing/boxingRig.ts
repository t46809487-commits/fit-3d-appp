import {
  V3, M3, I3, add, sub, scl, dot, cross, len, norm, clamp, mirrorV, mirrorM,
  mul, mulV, tr, Rx, Ry, Rz, fromCols, eulerYXZ, rotFromTo,
} from './boxingMath';

// ---------------------------------------------------------------------------------------------
// Boxing rig: turns "where should the feet / hips / gloves be" into bone rotations.
//   * both legs and both arms use analytic two-bone IK, so planted feet NEVER slide or float
//   * torso (hips + 3 spine bones + head) is driven by yaw / lean / twist angles
// Everything is expressed in a "boxer frame": origin on the floor at the middle of the stance,
// +Z = towards the opponent / bag, +X = the boxer's LEFT, +Y = up, metres.
// The maths is independent of three.js. Rotations are returned as 3x3 matrices (local to the parent
// bone) so there is no Euler gimbal problem; the three.js adapter turns them into quaternions.
// ---------------------------------------------------------------------------------------------

export type OffKey =
  | 'spine' | 'spine1' | 'spine2' | 'neck' | 'head' | 'shoulder' | 'arm' | 'foreArm' | 'hand'
  | 'upLeg' | 'leg' | 'foot' | 'toe';

export interface Skel {
  hipsRest: V3;
  toeRestY: number;                 // toe-ball joint height when the foot is flat on the floor
  k: number;                        // size vs the reference character (hips 1.04 m)
  off: Record<OffKey, V3>;          // LEFT side parent -> child offsets (right side = mirrored)
  L: { upper: number; fore: number; thigh: number; shin: number };
  gloveLen: number;                 // wrist -> centre of the glove
  rc: { thigh: M3; shin: M3 };      // corrective rotations: real rest direction of thigh/shin -> straight down
}

export const REF_HIPS_Y = 1.04;

/** Build the skeleton from the rest-pose world positions of the bones (metres, T-pose, rotations = identity). */
export function skelFromWorld(w: Record<string, V3>): Skel {
  const d = (a: string, b: string): V3 => sub(w[b], w[a]);
  const off = {
    spine: d('Hips', 'Spine'), spine1: d('Spine', 'Spine1'), spine2: d('Spine1', 'Spine2'),
    neck: d('Spine2', 'Neck'), head: d('Neck', 'Head'),
    shoulder: d('Spine2', 'LeftShoulder'), arm: d('LeftShoulder', 'LeftArm'),
    foreArm: d('LeftArm', 'LeftForeArm'), hand: d('LeftForeArm', 'LeftHand'),
    upLeg: d('Hips', 'LeftUpLeg'), leg: d('LeftUpLeg', 'LeftLeg'), foot: d('LeftLeg', 'LeftFoot'),
    toe: d('LeftFoot', 'LeftToeBase'),
  } as Record<OffKey, V3>;
  const k = w.Hips[1] / REF_HIPS_Y;
  return {
    hipsRest: w.Hips,
    toeRestY: w.LeftToeBase[1],
    k,
    off,
    L: { upper: len(off.foreArm), fore: len(off.hand), thigh: len(off.leg), shin: len(off.foot) },
    gloveLen: 0.11 * k,
    rc: { thigh: rotFromTo(norm(off.leg), [0, -1, 0]), shin: rotFromTo(norm(off.foot), [0, -1, 0]) },
  };
}

// ---------------------------------------------------------------------------------------------
// Pose description (already resolved to numbers, positions in metres)
// ---------------------------------------------------------------------------------------------
export interface FootT { x: number; y: number; z: number; yaw: number; heel: number } // y = lift above the floor, heel = heel-raise angle
export interface HandT { p: V3; pole: V3 }                                              // glove centre (world) + direction the elbow points to
export interface Resolved {
  hip: { x: number; z: number; drop: number; yaw: number; lean: number; roll: number };
  twist: number; bend: number; sway: number;
  head: { yaw: number; pitch: number };
  footL: FootT; footR: FootT;
  handL: HandT; handR: HandT;
}

export interface Solution {
  hips: V3;
  rot: Record<string, M3>;
  diag: { knee: [number, number]; elbow: [number, number]; clamp: [boolean, boolean, boolean, boolean]; kneePos: [V3, V3]; elbowPos: [V3, V3] };
}

const SP_TWIST = [0.2, 0.35, 0.45];
const SP_BEND = [0.3, 0.35, 0.35];
const SP_SWAY = [0.3, 0.35, 0.35];

const sideOff = (sk: Skel, key: OffKey, side: 'L' | 'R'): V3 => (side === 'L' ? sk.off[key] : mirrorV(sk.off[key]));

export interface Torso {
  H: V3; Rh: M3;
  pos: { spine: V3; spine1: V3; spine2: V3; neck: V3 };
  Rw: { spine: M3; spine1: M3; spine2: M3 };
  Rl: { spine: M3; spine1: M3; spine2: M3 };
}

export function torsoFK(sk: Skel, r: Resolved): Torso {
  const H: V3 = [r.hip.x, sk.hipsRest[1] - r.hip.drop, r.hip.z];
  const Rh = mul(mul(Ry(r.hip.yaw), Rx(r.hip.lean)), Rz(r.hip.roll));
  const seg = (i: number): M3 => mul(mul(Ry(r.twist * SP_TWIST[i]), Rx(r.bend * SP_BEND[i])), Rz(r.sway * SP_SWAY[i]));
  const Rl = { spine: seg(0), spine1: seg(1), spine2: seg(2) };
  const pSpine = add(H, mulV(Rh, sk.off.spine));
  const Rs0 = mul(Rh, Rl.spine);
  const pSpine1 = add(pSpine, mulV(Rs0, sk.off.spine1));
  const Rs1 = mul(Rs0, Rl.spine1);
  const pSpine2 = add(pSpine1, mulV(Rs1, sk.off.spine2));
  const Rs2 = mul(Rs1, Rl.spine2);
  const pNeck = add(pSpine2, mulV(Rs2, sk.off.neck));
  return { H, Rh, pos: { spine: pSpine, spine1: pSpine1, spine2: pSpine2, neck: pNeck }, Rw: { spine: Rs0, spine1: Rs1, spine2: Rs2 }, Rl };
}

// ---- two-bone IK ------------------------------------------------------------------------------
function perp(v: V3, axis: V3): V3 {
  let p = sub(v, scl(axis, dot(v, axis)));
  if (len(p) < 1e-6) p = cross(axis, Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1]);
  return norm(p);
}

function twoBone(S: V3, T: V3, L1: number, L2: number, pole: V3) {
  const d = sub(T, S);
  const D = len(d);
  const Dc = clamp(D, Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-4);
  const u = norm(d);
  const a = (L1 * L1 - L2 * L2 + Dc * Dc) / (2 * Dc);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const K = add(add(S, scl(u, a)), scl(perp(pole, u), h));
  return { K, Tc: add(S, scl(u, Dc)), clamped: Dc !== D };
}

/** Left-side leg. Inputs are in the "left frame" (the right leg is mirrored into it by the caller). */
function legLeft(sk: Skel, S: V3, A: V3, pole: V3, Rparent: M3, Rf: M3) {
  const { K, Tc, clamped } = twoBone(S, A, sk.L.thigh, sk.L.shin, pole);
  const d1 = norm(sub(K, S));
  const d2 = norm(sub(Tc, K));
  const cosT = clamp(dot(d1, d2), -1, 1);
  const th = Math.acos(cosT);
  const yb = scl(d1, -1);
  const zb = Math.sin(th) > 1e-3 ? norm(sub(scl(d1, cosT), d2)) : perp(pole, d1);
  const xb = cross(yb, zb);
  const Rup = fromCols(xb, yb, zb);          // thigh frame that points straight down along -Y
  const Rleg = mul(mul(Rup, Rx(th)), sk.rc.shin);
  const upFinal = mul(Rup, sk.rc.thigh);     // real bones are not exactly straight: correct for their rest direction
  return {
    up: mul(tr(Rparent), upFinal),
    leg: mul(mul(tr(sk.rc.thigh), Rx(th)), sk.rc.shin),
    foot: mul(tr(Rleg), Rf),
    th, K, clamped,
  };
}

/** Left-side arm (right arm is mirrored into this frame by the caller). */
function armLeft(sk: Skel, S: V3, W: V3, pole: V3, Rparent: M3) {
  const { K, Tc, clamped } = twoBone(S, W, sk.L.upper, sk.L.fore, pole);
  const d1 = norm(sub(K, S));
  const d2 = norm(sub(Tc, K));
  const cosA = clamp(dot(d1, d2), -1, 1);
  const al = Math.acos(cosA);
  const xb = d1;
  const zb = Math.sin(al) > 1e-3 ? norm(sub(d2, scl(d1, cosA))) : scl(perp(pole, d1), -1);
  const yb = cross(zb, xb);
  const Rarm = fromCols(xb, yb, zb);
  return { arm: mul(tr(Rparent), Rarm), fore: Ry(-al) as M3, al, K, clamped, d2 };
}

export function solve(sk: Skel, r: Resolved): Solution {
  const t = torsoFK(sk, r);
  const rot: Record<string, M3> = {};
  const knee: number[] = [0, 0], elbow: number[] = [0, 0];
  const clampF: boolean[] = [false, false, false, false];
  const kneePos: V3[] = [[0, 0, 0], [0, 0, 0]], elbowPos: V3[] = [[0, 0, 0], [0, 0, 0]];

  rot.Hips = t.Rh;
  rot.Spine = t.Rl.spine; rot.Spine1 = t.Rl.spine1; rot.Spine2 = t.Rl.spine2;

  // ---- legs ----
  (['L', 'R'] as const).forEach((side, i) => {
    const f = side === 'L' ? r.footL : r.footR;
    const Rf = mul(Ry(f.yaw), Rx(f.heel));
    const S = add(t.H, mulV(t.Rh, sideOff(sk, 'upLeg', side)));
    const P: V3 = [f.x, sk.toeRestY + f.y, f.z];
    const A = sub(P, mulV(Rf, sideOff(sk, 'toe', side)));
    const pole: V3 = [Math.sin(f.yaw), 0, Math.cos(f.yaw)];
    const mir = side === 'R';
    const res = legLeft(
      sk, mir ? mirrorV(S) : S, mir ? mirrorV(A) : A, mir ? mirrorV(pole) : pole,
      mir ? mirrorM(t.Rh) : t.Rh, mir ? mirrorM(Rf) : Rf,
    );
    const nm = side === 'L' ? 'Left' : 'Right';
    rot[`${nm}UpLeg`] = mir ? mirrorM(res.up) : res.up;
    rot[`${nm}Leg`] = mir ? mirrorM(res.leg) : res.leg;
    rot[`${nm}Foot`] = mir ? mirrorM(res.foot) : res.foot;
    knee[i] = res.th; clampF[i] = res.clamped;
    kneePos[i] = mir ? mirrorV(res.K) : res.K;
  });

  // ---- arms ----
  (['L', 'R'] as const).forEach((side, i) => {
    const h = side === 'L' ? r.handL : r.handR;
    const Rsp2 = t.Rw.spine2;
    const shoulder = add(t.pos.spine2, mulV(Rsp2, sideOff(sk, 'shoulder', side)));
    const S = add(shoulder, mulV(Rsp2, sideOff(sk, 'arm', side)));
    const mir = side === 'R';
    const Sl = mir ? mirrorV(S) : S;
    const Gl = mir ? mirrorV(h.p) : h.p;
    const pl = mir ? mirrorV(h.pole) : h.pole;
    const Rpl = mir ? mirrorM(Rsp2) : Rsp2;
    // The glove sits beyond the wrist along the forearm, so iterate: aim the wrist at (glove - forearm * glove length)
    let fdir = norm(sub(Gl, Sl));
    let res = armLeft(sk, Sl, sub(Gl, scl(fdir, sk.gloveLen)), pl, Rpl);
    for (let it = 0; it < 4; it++) {
      fdir = res.d2;
      res = armLeft(sk, Sl, sub(Gl, scl(fdir, sk.gloveLen)), pl, Rpl);
    }
    const nm = side === 'L' ? 'Left' : 'Right';
    rot[`${nm}Arm`] = mir ? mirrorM(res.arm) : res.arm;
    rot[`${nm}ForeArm`] = mir ? mirrorM(res.fore) : res.fore;
    elbow[i] = res.al; clampF[2 + i] = res.clamped;
    elbowPos[i] = mir ? mirrorV(res.K) : res.K;
  });

  // ---- head: keeps looking at the opponent while the torso turns ----
  const Rdes = mul(Ry(r.head.yaw), Rx(r.head.pitch));
  const rel = mul(tr(t.Rw.spine2), Rdes);
  const e = eulerYXZ(rel);
  const half = mul(mul(Ry(e.yaw / 2), Rx(e.pitch / 2)), Rz(e.roll / 2));
  rot.Neck = half; rot.Head = half;
  rot.LeftShoulder = I3; rot.RightShoulder = I3;

  return {
    hips: t.H, rot,
    diag: { knee: [knee[0], knee[1]], elbow: [elbow[0], elbow[1]], clamp: clampF as [boolean, boolean, boolean, boolean], kneePos: [kneePos[0], kneePos[1]], elbowPos: [elbowPos[0], elbowPos[1]] },
  };
}

// ---------------------------------------------------------------------------------------------
// Forward kinematics of a Solution (used by the tests and by the debug overlay): important joint positions
// ---------------------------------------------------------------------------------------------
export function forward(sk: Skel, s: Solution) {
  const out: Record<string, V3> = {};
  const Rh = s.rot.Hips;
  out.Hips = s.hips;
  const Rs0 = mul(Rh, s.rot.Spine);
  out.Spine = add(s.hips, mulV(Rh, sk.off.spine));
  const Rs1 = mul(Rs0, s.rot.Spine1);
  out.Spine1 = add(out.Spine, mulV(Rs0, sk.off.spine1));
  const Rs2 = mul(Rs1, s.rot.Spine2);
  out.Spine2 = add(out.Spine1, mulV(Rs1, sk.off.spine2));
  out.Neck = add(out.Spine2, mulV(Rs2, sk.off.neck));
  const Rn = mul(Rs2, s.rot.Neck);
  out.Head = add(out.Neck, mulV(Rn, sk.off.head));
  const Rhd = mul(Rn, s.rot.Head);
  out.HeadRot0 = mulV(Rhd, [0, 0, 1]); // where the face points
  (['Left', 'Right'] as const).forEach((nm) => {
    const side = nm === 'Left' ? 'L' : 'R';
    const up = add(s.hips, mulV(Rh, sideOff(sk, 'upLeg', side)));
    const Rup = mul(Rh, s.rot[`${nm}UpLeg`]);
    const knee = add(up, mulV(Rup, sideOff(sk, 'leg', side)));
    const Rleg = mul(Rup, s.rot[`${nm}Leg`]);
    const ankle = add(knee, mulV(Rleg, sideOff(sk, 'foot', side)));
    const Rft = mul(Rleg, s.rot[`${nm}Foot`]);
    const toe = add(ankle, mulV(Rft, sideOff(sk, 'toe', side)));
    out[`${nm}UpLeg`] = up; out[`${nm}Knee`] = knee; out[`${nm}Ankle`] = ankle; out[`${nm}Toe`] = toe;
    const sh = add(out.Spine2, mulV(Rs2, sideOff(sk, 'shoulder', side)));
    const arm = add(sh, mulV(Rs2, sideOff(sk, 'arm', side)));
    const Ra = mul(Rs2, s.rot[`${nm}Arm`]);
    const elbow = add(arm, mulV(Ra, sideOff(sk, 'foreArm', side)));
    const Rf = mul(Ra, s.rot[`${nm}ForeArm`]);
    const wrist = add(elbow, mulV(Rf, sideOff(sk, 'hand', side)));
    // glove centre: along the forearm direction
    const fd = norm(sub(wrist, elbow));
    out[`${nm}Shoulder`] = arm; out[`${nm}Elbow`] = elbow; out[`${nm}Wrist`] = wrist;
    out[`${nm}Glove`] = add(wrist, scl(fd, sk.gloveLen));
  });
  return out;
}
