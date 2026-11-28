// Tiny dependency-free vector / matrix helpers used by the boxing rig (no three.js needed,
// so the whole animation maths can be unit-tested in plain Node).
export type V3 = [number, number, number];
export type M3 = [number, number, number, number, number, number, number, number, number]; // row-major

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a);
  return l < 1e-9 ? [0, 0, 0] : [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
export const mirrorV = (a: V3): V3 => [-a[0], a[1], a[2]]; // reflect across the body's mid-plane (left <-> right)

export const I3: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export const mul = (a: M3, b: M3): M3 => {
  const r = new Array(9).fill(0) as M3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
};
export const mulV = (m: M3, p: V3): V3 => [
  m[0] * p[0] + m[1] * p[1] + m[2] * p[2],
  m[3] * p[0] + m[4] * p[1] + m[5] * p[2],
  m[6] * p[0] + m[7] * p[1] + m[8] * p[2],
];
export const tr = (m: M3): M3 => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
export const Rx = (a: number): M3 => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
export const Ry = (a: number): M3 => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
export const Rz = (a: number): M3 => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
/** Matrix whose columns are the three axis vectors. */
export const fromCols = (x: V3, y: V3, z: V3): M3 => [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
/** Reflect a rotation across the body's mid-plane (used to solve the right side with left-side maths). */
export const mirrorM = (m: M3): M3 => {
  const s = [-1, 1, 1];
  const r = new Array(9).fill(0) as M3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = m[i * 3 + j] * s[i] * s[j];
  return r;
};
/** Angle (radians) of the rotation that takes a to b. */
export const angleBetween = (a: M3, b: M3): number => {
  const m = mul(tr(a), b);
  return Math.acos(clamp((m[0] + m[4] + m[8] - 1) / 2, -1, 1));
};
/** Euler angles for R = Ry(yaw) * Rx(pitch) * Rz(roll). */
export const eulerYXZ = (m: M3): { yaw: number; pitch: number; roll: number } => {
  const m23 = m[5];
  const pitch = Math.asin(-clamp(m23, -1, 1));
  if (Math.abs(m23) < 0.9999) return { yaw: Math.atan2(m[2], m[8]), pitch, roll: Math.atan2(m[3], m[4]) };
  return { yaw: Math.atan2(-m[6], m[0]), pitch, roll: 0 };
};
export const smooth = (x: number): number => x * x * (3 - 2 * x);

/** Smallest rotation taking unit vector a onto unit vector b. */
export const rotFromTo = (a: V3, b: V3): M3 => {
  const v = cross(a, b);
  const c = dot(a, b);
  const s2 = dot(v, v);
  if (s2 < 1e-12) return c > 0 ? I3 : [1, 0, 0, 0, -1, 0, 0, 0, -1];
  const k = (1 - c) / s2;
  const vx: M3 = [0, -v[2], v[1], v[2], 0, -v[0], -v[1], v[0], 0];
  const vx2 = mul(vx, vx);
  return [
    1 + vx[0] + vx2[0] * k, vx[1] + vx2[1] * k, vx[2] + vx2[2] * k,
    vx[3] + vx2[3] * k, 1 + vx[4] + vx2[4] * k, vx[5] + vx2[5] * k,
    vx[6] + vx2[6] * k, vx[7] + vx2[7] * k, 1 + vx[8] + vx2[8] * k,
  ];
};
