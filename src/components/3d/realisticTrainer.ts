import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { LoadedCharacter } from './characterLoader';
import { MOTION_ALIAS } from './exercisePoses';

// ---------------------------------------------------------------------------
// Realistic human trainer.
//
//   public/models/trainer.glb            a realistic, skinned human GLB with a Mixamo-style skeleton
//                                        (bones such as Hips, Spine, LeftUpLeg ... with or without the
//                                        "mixamorig:" prefix). Textures / materials are kept as they are.
//   public/animations/manifest.json      OPTIONAL. Maps an exercise (animationType) to an animation-only
//                                        GLB, e.g. { "pushup_standard": "push-up.glb" }. Those clips are
//                                        played with THREE.AnimationMixer.
//
// Exercises without a clip use the built-in procedural animation (joint angles driven in code),
// which works with the same skeleton. If trainer.glb is missing or invalid the default character
// is used, so the site never breaks.
// ---------------------------------------------------------------------------

const TRAINER_URL = '/models/trainer.glb';
const MANIFEST_URL = '/animations/manifest.json';

const REQUIRED_BONES = ['Hips', 'Spine', 'Head', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'LeftFoot', 'LeftArm', 'RightArm', 'LeftForeArm'];

let probePromise: Promise<boolean> | null = null;

/** True only if trainer.glb really exists (static hosts often answer 200 + index.html for missing files). */
function trainerExists(): Promise<boolean> {
  if (!probePromise) {
    probePromise = (async () => {
      try {
        const r = await fetch(TRAINER_URL, { headers: { Range: 'bytes=0-3' } });
        if (!r.ok || !r.body) return false;
        const reader = r.body.getReader();
        const { value } = await reader.read();
        reader.cancel().catch(() => {});
        return !!value && value.length >= 4 && String.fromCharCode(value[0], value[1], value[2], value[3]) === 'glTF';
      } catch {
        return false;
      }
    })();
  }
  return probePromise;
}

let gltfPromise: Promise<any> | null = null;

function loadTrainerGLTF(onProgress?: (p: number) => void): Promise<any> {
  if (!gltfPromise) {
    gltfPromise = new Promise((resolve, reject) => {
      new GLTFLoader().load(
        TRAINER_URL,
        resolve,
        (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); },
        (err) => { gltfPromise = null; reject(err); }
      );
    });
  }
  return gltfPromise;
}

let manifestPromise: Promise<Record<string, string>> | null = null;
function loadManifest(): Promise<Record<string, string>> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : {}))
      .catch(() => ({}));
  }
  return manifestPromise;
}

const baseName = (n: string) => n.replace(/^mixamorig[:_]?/i, '').replace(/[:_\s]/g, '');

/** Makes a clip safe for our model: in-place root, correct hips height, no stray position/scale tracks. */
function cleanClip(clip: THREE.AnimationClip, hipsRestY: number): THREE.AnimationClip {
  const tracks: THREE.KeyframeTrack[] = [];
  clip.tracks.forEach((tr) => {
    const dot = tr.name.lastIndexOf('.');
    const node = tr.name.slice(0, dot);
    const prop = tr.name.slice(dot + 1);
    if (prop === 'scale') return;
    if (prop === 'position') {
      if (!/Hips$/.test(node)) return;
      const vals = Array.from(tr.values as ArrayLike<number>);
      const k = vals[1] > 1e-6 ? hipsRestY / vals[1] : 1;     // unit conversion (cm <-> m)
      const x0 = vals[0], z0 = vals[2];
      for (let i = 0; i < vals.length; i += 3) {
        vals[i] = x0 * k;           // keep the exercise in place (no drifting)
        vals[i + 1] *= k;
        vals[i + 2] = z0 * k;
      }
      tracks.push(new THREE.VectorKeyframeTrack(tr.name, Array.from(tr.times as ArrayLike<number>), vals));
      return;
    }
    tracks.push(tr);
  });
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

async function loadClip(file: string, root: THREE.Object3D, hipsRestY: number): Promise<THREE.AnimationClip | null> {
  try {
    const gltf: any = await new Promise((resolve, reject) => new GLTFLoader().load(`/animations/${file}`, resolve, undefined, reject));
    const raw: THREE.AnimationClip | undefined = gltf.animations?.[0];
    if (!raw) return null;
    const clip = cleanClip(raw, hipsRestY);
    // The clip must really fit this skeleton, otherwise the procedural animation is used instead
    let matched = 0;
    clip.tracks.forEach((tr) => {
      const node = tr.name.slice(0, tr.name.lastIndexOf('.'));
      if (THREE.PropertyBinding.findNode(root, node)) matched++;
    });
    return matched >= 20 ? clip : null;
  } catch {
    return null;
  }
}

/**
 * Returns a ready-to-animate realistic trainer, or null when no (valid) trainer.glb is installed.
 */
export async function loadRealisticTrainer(
  heightScale = 1,
  onProgress?: (p: number) => void,
  animationType?: string
): Promise<LoadedCharacter | null> {
  if (!(await trainerExists())) return null;

  const gltf = await loadTrainerGLTF(onProgress);
  const root = SkeletonUtils.clone(gltf.scene) as THREE.Group;

  // ---- bones (names normalised so both "mixamorig:Hips" and "Hips" work) ----
  const bones: Record<string, THREE.Bone> = {};
  const rotations = new Map<string, THREE.Euler>();
  const skinned: THREE.SkinnedMesh[] = [];
  root.traverse((o: any) => {
    if (o.isBone) {
      const base = baseName(o.name);
      [o.name, 'mixamorig' + base, 'mixamorig:' + base].forEach((k) => {
        bones[k] = o;
        rotations.set(k, o.rotation.clone());
      });
    }
    if (o.isSkinnedMesh) {
      skinned.push(o);
      o.frustumCulled = false;
    }
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  const missing = REQUIRED_BONES.filter((n) => !bones['mixamorig' + n]);
  if (!skinned.length || missing.length) {
    console.warn('trainer.glb ignored - it needs a skinned mesh and a Mixamo-style skeleton. Missing bones:', missing);
    return null;
  }

  // ---- real-world size: 1.8 m tall, standing on the studio floor ----
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const h = box.max.y - box.min.y;
  if (!isFinite(h) || h < 0.2) return null;
  const s = (1.8 * Math.max(0.85, Math.min(1.15, heightScale))) / h;
  root.scale.multiplyScalar(s);
  root.position.set(0, -0.9 - box.min.y * s, 0);
  root.updateMatrixWorld(true);

  const hips = bones.mixamorigHips;
  // 1 cm expressed in the hips' parent units - the motion data is written in centimetres
  const parentScale = (hips.parent ? hips.parent.getWorldScale(new THREE.Vector3()).y : 1) || 1;
  const unit = 0.01 / parentScale;

  const surface = skinned.reduce((a, b) => (b.geometry.attributes.position.count > a.geometry.attributes.position.count ? b : a));

  const char: LoadedCharacter = {
    scene: root,
    surfaceMesh: surface,
    colorAttribute: new THREE.BufferAttribute(new Float32Array(3), 3),   // (muscle tint is not used on realistic models)
    muscleVertexIndices: new Map(),
    bones,
    initialTransforms: { hipsPos: hips.position.clone(), rotations, unit },
    isProceduralFallback: false,
    isRealistic: true,
  };

  // ---- optional animation clip (AnimationMixer) for this exercise ----
  if (animationType) {
    try {
      const manifest = await loadManifest();
      const key = manifest[animationType] ? animationType : MOTION_ALIAS[animationType];
      const file = manifest[animationType] ?? (key ? manifest[key] : undefined);
      if (file) {
        const clip = await loadClip(file, root, hips.position.y);
        if (clip) {
          const mixer = new THREE.AnimationMixer(root);
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
          action.paused = true;           // we scrub the time ourselves so Pause / Slow-motion / Restart work
          char.mixer = mixer;
          char.clipAction = action;
          char.clipDuration = clip.duration;
        }
      }
    } catch (e) {
      console.warn('Exercise clip could not be used, using procedural animation instead:', e);
    }
  }

  return char;
}
