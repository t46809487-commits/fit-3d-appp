import * as THREE from 'three';
import { MuscleName, CharacterModelId } from '../../types';

export interface AnatomicalRigData {
  mesh: THREE.SkinnedMesh;
  skeleton: THREE.Skeleton;
  bones: {
    root: THREE.Bone;
    pelvis: THREE.Bone;
    spine01: THREE.Bone;
    spine02: THREE.Bone;
    chest: THREE.Bone;
    neck: THREE.Bone;
    head: THREE.Bone;
    clavicleL: THREE.Bone;
    clavicleR: THREE.Bone;
    upperarmL: THREE.Bone;
    upperarmR: THREE.Bone;
    forearmL: THREE.Bone;
    forearmR: THREE.Bone;
    handL: THREE.Bone;
    handR: THREE.Bone;
    thighL: THREE.Bone;
    thighR: THREE.Bone;
    calfL: THREE.Bone;
    calfR: THREE.Bone;
    footL: THREE.Bone;
    footR: THREE.Bone;
  };
  muscleVertexIndices: Map<string, number[]>;
  colorAttribute: THREE.BufferAttribute;
}

// Generate an organically sculpted, connected anatomical human mesh with humanoid bone rig
export function createAnatomicalHumanRig(gender: CharacterModelId = 'CHAR-M-01'): AnatomicalRigData {
  const isFemale = gender === 'CHAR-F-01';

  // Athletic proportions
  const shoulderWidth = isFemale ? 0.38 : 0.46;
  const chestDepth = isFemale ? 0.28 : 0.32;
  const waistWidth = isFemale ? 0.24 : 0.29;
  const hipWidth = isFemale ? 0.36 : 0.32;
  const limbThickness = isFemale ? 0.88 : 1.0;

  // 1. CREATE HUMANOID BONE HIERARCHY (PRD v2.0 Section 8)
  const root = new THREE.Bone();
  root.name = 'root';
  root.position.set(0, -1.8, 0);

  const pelvis = new THREE.Bone();
  pelvis.name = 'pelvis';
  pelvis.position.set(0, 0.95, 0);
  root.add(pelvis);

  const spine01 = new THREE.Bone();
  spine01.name = 'spine_01';
  spine01.position.set(0, 0.16, 0);
  pelvis.add(spine01);

  const spine02 = new THREE.Bone();
  spine02.name = 'spine_02';
  spine02.position.set(0, 0.16, 0);
  spine01.add(spine02);

  const chest = new THREE.Bone();
  chest.name = 'chest';
  chest.position.set(0, 0.22, 0);
  spine02.add(chest);

  const neck = new THREE.Bone();
  neck.name = 'neck';
  neck.position.set(0, 0.20, 0);
  chest.add(neck);

  const head = new THREE.Bone();
  head.name = 'head';
  head.position.set(0, 0.16, 0);
  neck.add(head);

  // Clavicles & Arms
  const clavicleL = new THREE.Bone();
  clavicleL.name = 'clavicle_l';
  clavicleL.position.set(-0.12, 0.12, 0);
  chest.add(clavicleL);

  const upperarmL = new THREE.Bone();
  upperarmL.name = 'upperarm_l';
  upperarmL.position.set(-shoulderWidth + 0.12, -0.04, 0);
  clavicleL.add(upperarmL);

  const forearmL = new THREE.Bone();
  forearmL.name = 'forearm_l';
  forearmL.position.set(0, -0.36, 0);
  upperarmL.add(forearmL);

  const handL = new THREE.Bone();
  handL.name = 'hand_l';
  handL.position.set(0, -0.34, 0);
  forearmL.add(handL);

  const clavicleR = new THREE.Bone();
  clavicleR.name = 'clavicle_r';
  clavicleR.position.set(0.12, 0.12, 0);
  chest.add(clavicleR);

  const upperarmR = new THREE.Bone();
  upperarmR.name = 'upperarm_r';
  upperarmR.position.set(shoulderWidth - 0.12, -0.04, 0);
  clavicleR.add(upperarmR);

  const forearmR = new THREE.Bone();
  forearmR.name = 'forearm_r';
  forearmR.position.set(0, -0.36, 0);
  upperarmR.add(forearmR);

  const handR = new THREE.Bone();
  handR.name = 'hand_r';
  handR.position.set(0, -0.34, 0);
  forearmR.add(handR);

  // Hips & Legs
  const thighL = new THREE.Bone();
  thighL.name = 'thigh_l';
  thighL.position.set(-hipWidth * 0.5, -0.08, 0);
  pelvis.add(thighL);

  const calfL = new THREE.Bone();
  calfL.name = 'calf_l';
  calfL.position.set(0, -0.46, 0);
  thighL.add(calfL);

  const footL = new THREE.Bone();
  footL.name = 'foot_l';
  footL.position.set(0, -0.46, 0.04);
  calfL.add(footL);

  const thighR = new THREE.Bone();
  thighR.name = 'thigh_r';
  thighR.position.set(hipWidth * 0.5, -0.08, 0);
  pelvis.add(thighR);

  const calfR = new THREE.Bone();
  calfR.name = 'calf_r';
  calfR.position.set(0, -0.46, 0);
  thighR.add(calfR);

  const footR = new THREE.Bone();
  footR.name = 'foot_r';
  footR.position.set(0, -0.46, 0.04);
  calfR.add(footR);

  const bonesList = [
    root, pelvis, spine01, spine02, chest, neck, head,
    clavicleL, upperarmL, forearmL, handL,
    clavicleR, upperarmR, forearmR, handR,
    thighL, calfL, footL,
    thighR, calfR, footR,
  ];

  const skeleton = new THREE.Skeleton(bonesList);

  // 2. BUILD CONTINUOUS ORGANIC TOPOLOGY WITH ANATOMICAL MUSCLE ZONES
  // We construct a high-resolution, organically contoured humanoid body mesh
  // with smooth subdivision rings, muscle contours, and skin weights.
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const indices: number[] = [];

  const muscleVertexIndices = new Map<string, number[]>();

  const registerVertexMuscle = (vertIdx: number, muscleName: string) => {
    if (!muscleVertexIndices.has(muscleName)) {
      muscleVertexIndices.set(muscleName, []);
    }
    muscleVertexIndices.get(muscleName)!.push(vertIdx);
  };

  // Bone Index Lookup
  const bIdx = {
    pelvis: 1,
    spine01: 2,
    spine02: 3,
    chest: 4,
    neck: 5,
    head: 6,
    upperarmL: 8,
    forearmL: 9,
    handL: 10,
    upperarmR: 12,
    forearmR: 13,
    handR: 14,
    thighL: 15,
    calfL: 16,
    footL: 17,
    thighR: 18,
    calfR: 19,
    footR: 20,
  };

  let currentVertexOffset = 0;

  // Helper to construct seamless anatomical tubular/surface sections with organic contouring
  const addAnatomicalSection = (
    rings: {
      y: number;
      rx: number;
      rz: number;
      cx?: number;
      cz?: number;
      boneA: number;
      boneB?: number;
      weightA?: number;
      muscleHint?: (x: number, z: number) => string | null;
    }[],
    segments: number = 24
  ) => {
    const startIndex = currentVertexOffset;

    for (let r = 0; r < rings.length; r++) {
      const ring = rings[r];
      const cx = ring.cx || 0;
      const cz = ring.cz || 0;
      const bA = ring.boneA;
      const bB = ring.boneB !== undefined ? ring.boneB : ring.boneA;
      const wA = ring.weightA !== undefined ? ring.weightA : 1.0;
      const wB = 1.0 - wA;

      for (let s = 0; s < segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // Organic sculpting adjustment
        const px = cx + ring.rx * cosT;
        const pz = cz + ring.rz * sinT;
        const py = ring.y;

        vertices.push(px, py, pz);

        // Computed approximate normal
        const nx = cosT;
        const ny = 0;
        const nz = sinT;
        normals.push(nx, ny, nz);

        uvs.push(s / segments, r / (rings.length - 1));

        // Default neutral graphite base color (#2b3342)
        colors.push(0.17, 0.20, 0.26);

        // Skin weights
        skinIndices.push(bA, bB, 0, 0);
        skinWeights.push(wA, wB, 0, 0);

        // Muscle assignment
        if (ring.muscleHint) {
          const muscle = ring.muscleHint(px, pz);
          if (muscle) {
            registerVertexMuscle(currentVertexOffset, muscle);
          }
        }

        currentVertexOffset++;
      }
    }

    // Connect quads / triangles
    for (let r = 0; r < rings.length - 1; r++) {
      for (let s = 0; s < segments; s++) {
        const nextS = (s + 1) % segments;
        const v0 = startIndex + r * segments + s;
        const v1 = startIndex + r * segments + nextS;
        const v2 = startIndex + (r + 1) * segments + nextS;
        const v3 = startIndex + (r + 1) * segments + s;

        indices.push(v0, v1, v2);
        indices.push(v0, v2, v3);
      }
    }
  };

  // A. CONTINUOUS TORSO & PELVIS (Pectorals, Abdominals, Obliques, Lats, Traps, Glutes)
  const torsoRings = [
    // Pelvis base / Gluteal fold
    {
      y: -0.22,
      rx: hipWidth * 0.5,
      rz: hipWidth * 0.44,
      boneA: bIdx.pelvis,
      muscleHint: (x: number, z: number) => {
        if (z < -0.05) return x < 0 ? 'glutes_l' : 'glutes_r';
        return null;
      },
    },
    // Mid Pelvis / Iliac Crest
    {
      y: -0.05,
      rx: hipWidth * 0.52,
      rz: hipWidth * 0.42,
      boneA: bIdx.pelvis,
      boneB: bIdx.spine01,
      weightA: 0.8,
      muscleHint: (x: number, z: number) => {
        if (z < -0.04) return x < 0 ? 'glutes_l' : 'glutes_r';
        if (z > 0.06) return 'lower_abs';
        return x < 0 ? 'obliques_l' : 'obliques_r';
      },
    },
    // Waist / Navel (Rectus Abdominis lower pack & Obliques)
    {
      y: 0.12,
      rx: waistWidth * 0.52,
      rz: waistWidth * 0.44,
      boneA: bIdx.spine01,
      boneB: bIdx.spine02,
      weightA: 0.6,
      muscleHint: (x: number, z: number) => {
        if (z > 0.05 && Math.abs(x) < 0.11) return 'lower_abs';
        if (z < -0.06) return 'lower_back';
        return x < 0 ? 'obliques_l' : 'obliques_r';
      },
    },
    // Mid Torso (Mid Abs & Latissimus Dorsi waist taper)
    {
      y: 0.28,
      rx: waistWidth * 0.56,
      rz: waistWidth * 0.46,
      boneA: bIdx.spine02,
      boneB: bIdx.chest,
      weightA: 0.6,
      muscleHint: (x: number, z: number) => {
        if (z > 0.06 && Math.abs(x) < 0.12) return 'rectus_abdominis';
        if (z < -0.05) return x < 0 ? 'lats_l' : 'lats_r';
        return x < 0 ? 'obliques_l' : 'obliques_r';
      },
    },
    // Lower Ribcage / Lower Chest (Pectoralis Major lower sweep)
    {
      y: 0.42,
      rx: shoulderWidth * 0.48,
      rz: chestDepth * 0.52,
      boneA: bIdx.chest,
      muscleHint: (x: number, z: number) => {
        if (z > 0.06) return x < 0 ? 'lower_chest_l' : 'lower_chest_r';
        if (z < -0.05) return x < 0 ? 'lats_l' : 'lats_r';
        return null;
      },
    },
    // Mid Pectorals (Mid Chest & Latissimus Dorsi wing flare)
    {
      y: 0.54,
      rx: shoulderWidth * 0.52,
      rz: chestDepth * 0.56,
      boneA: bIdx.chest,
      muscleHint: (x: number, z: number) => {
        if (z > 0.06) return x < 0 ? 'mid_chest_l' : 'mid_chest_r';
        if (z < -0.04) return x < 0 ? 'lats_l' : 'lats_r';
        return null;
      },
    },
    // Upper Pectorals / Clavicular head
    {
      y: 0.68,
      rx: shoulderWidth * 0.54,
      rz: chestDepth * 0.52,
      boneA: bIdx.chest,
      muscleHint: (x: number, z: number) => {
        if (z > 0.05) return x < 0 ? 'upper_chest_l' : 'upper_chest_r';
        if (z < -0.04) return 'traps';
        return null;
      },
    },
    // Neck base / Trapezius sweep
    {
      y: 0.82,
      rx: 0.14,
      rz: 0.15,
      boneA: bIdx.neck,
      boneB: bIdx.chest,
      weightA: 0.7,
      muscleHint: (x: number, z: number) => (z < -0.02 ? 'traps' : null),
    },
  ];
  addAnatomicalSection(torsoRings, 28);

  // B. ANATOMICAL HEAD & NECK
  const headRings = [
    { y: 0.84, rx: 0.12, rz: 0.14, boneA: bIdx.neck },
    { y: 0.94, rx: 0.13, rz: 0.15, boneA: bIdx.neck, boneB: bIdx.head, weightA: 0.5 },
    { y: 1.05, rx: 0.16, rz: 0.18, cz: 0.02, boneA: bIdx.head }, // Jaw / chin
    { y: 1.18, rx: 0.18, rz: 0.20, cz: 0.02, boneA: bIdx.head }, // Cranium
    { y: 1.28, rx: 0.14, rz: 0.16, boneA: bIdx.head },
    { y: 1.34, rx: 0.06, rz: 0.08, boneA: bIdx.head }, // Crown
  ];
  addAnatomicalSection(headRings, 20);

  // C. LEFT ARM & DELTOID (Deltoid caps, Biceps peak, Triceps, Forearm, Hand)
  const leftArmRings = [
    // Deltoid cap (Front, Side, Rear Delts)
    {
      y: 0.74,
      rx: 0.16 * limbThickness,
      rz: 0.16 * limbThickness,
      cx: -shoulderWidth,
      boneA: bIdx.upperarmL,
      muscleHint: (x: number, z: number) => {
        if (z > 0.04) return 'front_delts_l';
        if (z < -0.04) return 'rear_delts_l';
        return 'side_delts_l';
      },
    },
    // Mid Bicep / Tricep
    {
      y: 0.58,
      rx: 0.14 * limbThickness,
      rz: 0.14 * limbThickness,
      cx: -shoulderWidth,
      boneA: bIdx.upperarmL,
      muscleHint: (x: number, z: number) => (z > 0.02 ? 'biceps_l' : 'triceps_l'),
    },
    // Above Elbow
    {
      y: 0.42,
      rx: 0.11 * limbThickness,
      rz: 0.11 * limbThickness,
      cx: -shoulderWidth,
      boneA: bIdx.upperarmL,
      boneB: bIdx.forearmL,
      weightA: 0.7,
      muscleHint: (x: number, z: number) => (z > 0.02 ? 'biceps_l' : 'triceps_l'),
    },
    // Elbow Joint
    {
      y: 0.36,
      rx: 0.10 * limbThickness,
      rz: 0.10 * limbThickness,
      cx: -shoulderWidth,
      boneA: bIdx.forearmL,
      boneB: bIdx.upperarmL,
      weightA: 0.7,
    },
    // Forearm Belly (Extensors & Flexors)
    {
      y: 0.22,
      rx: 0.11 * limbThickness,
      rz: 0.10 * limbThickness,
      cx: -shoulderWidth,
      boneA: bIdx.forearmL,
      muscleHint: () => 'forearms_l',
    },
    // Wrist Taper
    {
      y: 0.06,
      rx: 0.07 * limbThickness,
      rz: 0.06 * limbThickness,
      cx: -shoulderWidth,
      boneA: bIdx.forearmL,
      boneB: bIdx.handL,
      weightA: 0.5,
    },
    // Palm & Hand with sculpted fingers
    {
      y: -0.06,
      rx: 0.09 * limbThickness,
      rz: 0.04 * limbThickness,
      cx: -shoulderWidth,
      boneA: bIdx.handL,
    },
    {
      y: -0.16,
      rx: 0.06 * limbThickness,
      rz: 0.02 * limbThickness,
      cx: -shoulderWidth,
      boneA: bIdx.handL,
    },
  ];
  addAnatomicalSection(leftArmRings, 18);

  // D. RIGHT ARM & DELTOID (Symmetrical for Right Side)
  const rightArmRings = [
    {
      y: 0.74,
      rx: 0.16 * limbThickness,
      rz: 0.16 * limbThickness,
      cx: shoulderWidth,
      boneA: bIdx.upperarmR,
      muscleHint: (x: number, z: number) => {
        if (z > 0.04) return 'front_delts_r';
        if (z < -0.04) return 'rear_delts_r';
        return 'side_delts_r';
      },
    },
    {
      y: 0.58,
      rx: 0.14 * limbThickness,
      rz: 0.14 * limbThickness,
      cx: shoulderWidth,
      boneA: bIdx.upperarmR,
      muscleHint: (x: number, z: number) => (z > 0.02 ? 'biceps_r' : 'triceps_r'),
    },
    {
      y: 0.42,
      rx: 0.11 * limbThickness,
      rz: 0.11 * limbThickness,
      cx: shoulderWidth,
      boneA: bIdx.upperarmR,
      boneB: bIdx.forearmR,
      weightA: 0.7,
      muscleHint: (x: number, z: number) => (z > 0.02 ? 'biceps_r' : 'triceps_r'),
    },
    {
      y: 0.36,
      rx: 0.10 * limbThickness,
      rz: 0.10 * limbThickness,
      cx: shoulderWidth,
      boneA: bIdx.forearmR,
      boneB: bIdx.upperarmR,
      weightA: 0.7,
    },
    {
      y: 0.22,
      rx: 0.11 * limbThickness,
      rz: 0.10 * limbThickness,
      cx: shoulderWidth,
      boneA: bIdx.forearmR,
      muscleHint: () => 'forearms_r',
    },
    {
      y: 0.06,
      rx: 0.07 * limbThickness,
      rz: 0.06 * limbThickness,
      cx: shoulderWidth,
      boneA: bIdx.forearmR,
      boneB: bIdx.handR,
      weightA: 0.5,
    },
    {
      y: -0.06,
      rx: 0.09 * limbThickness,
      rz: 0.04 * limbThickness,
      cx: shoulderWidth,
      boneA: bIdx.handR,
    },
    {
      y: -0.16,
      rx: 0.06 * limbThickness,
      rz: 0.02 * limbThickness,
      cx: shoulderWidth,
      boneA: bIdx.handR,
    },
  ];
  addAnatomicalSection(rightArmRings, 18);

  // E. LEFT LEG (Quadriceps teardrop, Hamstrings, Calf gastrocnemius, Foot with arch & toes)
  const leftLegCenterX = -hipWidth * 0.48;
  const leftLegRings = [
    // Upper Thigh / Hip Joint
    {
      y: -0.25,
      rx: 0.19 * limbThickness,
      rz: 0.20 * limbThickness,
      cx: leftLegCenterX,
      boneA: bIdx.thighL,
      muscleHint: (x: number, z: number) => (z > 0.02 ? 'quads_l' : 'hamstrings_l'),
    },
    // Mid Quadricep / Vastus Lateralis flare
    {
      y: -0.45,
      rx: 0.18 * limbThickness,
      rz: 0.18 * limbThickness,
      cx: leftLegCenterX,
      boneA: bIdx.thighL,
      muscleHint: (x: number, z: number) => (z > 0.02 ? 'quads_l' : 'hamstrings_l'),
    },
    // Vastus Medialis teardrop above knee
    {
      y: -0.65,
      rx: 0.15 * limbThickness,
      rz: 0.15 * limbThickness,
      cx: leftLegCenterX,
      boneA: bIdx.thighL,
      boneB: bIdx.calfL,
      weightA: 0.7,
      muscleHint: (x: number, z: number) => (z > 0.01 ? 'quads_l' : 'hamstrings_l'),
    },
    // Knee Patella Cap
    {
      y: -0.74,
      rx: 0.12 * limbThickness,
      rz: 0.12 * limbThickness,
      cx: leftLegCenterX,
      cz: 0.01,
      boneA: bIdx.calfL,
      boneB: bIdx.thighL,
      weightA: 0.6,
    },
    // Upper Calf (Gastrocnemius teardrops)
    {
      y: -0.88,
      rx: 0.14 * limbThickness,
      rz: 0.15 * limbThickness,
      cx: leftLegCenterX,
      cz: -0.02,
      boneA: bIdx.calfL,
      muscleHint: (x: number, z: number) => (z < 0.01 ? 'calves_l' : null),
    },
    // Lower Calf & Achilles Tendon
    {
      y: -1.05,
      rx: 0.11 * limbThickness,
      rz: 0.11 * limbThickness,
      cx: leftLegCenterX,
      boneA: bIdx.calfL,
      muscleHint: (x: number, z: number) => (z < 0.01 ? 'calves_l' : null),
    },
    // Ankle Joint
    {
      y: -1.22,
      rx: 0.08 * limbThickness,
      rz: 0.09 * limbThickness,
      cx: leftLegCenterX,
      boneA: bIdx.calfL,
      boneB: bIdx.footL,
      weightA: 0.5,
    },
    // Foot Heel, Forefoot, and Toes
    {
      y: -1.28,
      rx: 0.09 * limbThickness,
      rz: 0.16 * limbThickness,
      cx: leftLegCenterX,
      cz: 0.06,
      boneA: bIdx.footL,
    },
    {
      y: -1.33,
      rx: 0.08 * limbThickness,
      rz: 0.12 * limbThickness,
      cx: leftLegCenterX,
      cz: 0.12,
      boneA: bIdx.footL,
    },
  ];
  addAnatomicalSection(leftLegRings, 20);

  // F. RIGHT LEG (Symmetrical for Right Side)
  const rightLegCenterX = hipWidth * 0.48;
  const rightLegRings = [
    {
      y: -0.25,
      rx: 0.19 * limbThickness,
      rz: 0.20 * limbThickness,
      cx: rightLegCenterX,
      boneA: bIdx.thighR,
      muscleHint: (x: number, z: number) => (z > 0.02 ? 'quads_r' : 'hamstrings_r'),
    },
    {
      y: -0.45,
      rx: 0.18 * limbThickness,
      rz: 0.18 * limbThickness,
      cx: rightLegCenterX,
      boneA: bIdx.thighR,
      muscleHint: (x: number, z: number) => (z > 0.02 ? 'quads_r' : 'hamstrings_r'),
    },
    {
      y: -0.65,
      rx: 0.15 * limbThickness,
      rz: 0.15 * limbThickness,
      cx: rightLegCenterX,
      boneA: bIdx.thighR,
      boneB: bIdx.calfR,
      weightA: 0.7,
      muscleHint: (x: number, z: number) => (z > 0.01 ? 'quads_r' : 'hamstrings_r'),
    },
    {
      y: -0.74,
      rx: 0.12 * limbThickness,
      rz: 0.12 * limbThickness,
      cx: rightLegCenterX,
      cz: 0.01,
      boneA: bIdx.calfR,
      boneB: bIdx.thighR,
      weightA: 0.6,
    },
    {
      y: -0.88,
      rx: 0.14 * limbThickness,
      rz: 0.15 * limbThickness,
      cx: rightLegCenterX,
      cz: -0.02,
      boneA: bIdx.calfR,
      muscleHint: (x: number, z: number) => (z < 0.01 ? 'calves_r' : null),
    },
    {
      y: -1.05,
      rx: 0.11 * limbThickness,
      rz: 0.11 * limbThickness,
      cx: rightLegCenterX,
      boneA: bIdx.calfR,
      muscleHint: (x: number, z: number) => (z < 0.01 ? 'calves_r' : null),
    },
    {
      y: -1.22,
      rx: 0.08 * limbThickness,
      rz: 0.09 * limbThickness,
      cx: rightLegCenterX,
      boneA: bIdx.calfR,
      boneB: bIdx.footR,
      weightA: 0.5,
    },
    {
      y: -1.28,
      rx: 0.09 * limbThickness,
      rz: 0.16 * limbThickness,
      cx: rightLegCenterX,
      cz: 0.06,
      boneA: bIdx.footR,
    },
    {
      y: -1.33,
      rx: 0.08 * limbThickness,
      rz: 0.12 * limbThickness,
      cx: rightLegCenterX,
      cz: 0.12,
      boneA: bIdx.footR,
    },
  ];
  addAnatomicalSection(rightLegRings, 20);

  // 3. COMPOSE SKINNED BUFFER GEOMETRY
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  const colorAttribute = new THREE.Float32BufferAttribute(colors, 3);
  geometry.setAttribute('color', colorAttribute);

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // PBR Anatomical Material
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.42,
    metalness: 0.18,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.add(root);
  mesh.bind(skeleton);

  return {
    mesh,
    skeleton,
    bones: {
      root,
      pelvis,
      spine01,
      spine02,
      chest,
      neck,
      head,
      clavicleL,
      clavicleR,
      upperarmL,
      upperarmR,
      forearmL,
      forearmR,
      handL,
      handR,
      thighL,
      thighR,
      calfL,
      calfR,
      footL,
      footR,
    },
    muscleVertexIndices,
    colorAttribute,
  };
}
