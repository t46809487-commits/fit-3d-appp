import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MuscleName, CharacterModelId, AvatarConfiguration } from '../../types';
import { createAnatomicalHumanRig } from './anatomicalRig';

export interface LoadedCharacter {
  scene: THREE.Group;
  surfaceMesh: THREE.SkinnedMesh;
  jointsMesh?: THREE.SkinnedMesh;
  colorAttribute: THREE.BufferAttribute;
  muscleVertexIndices: Map<string, number[]>;
  bones: Record<string, THREE.Bone>;
  initialTransforms: {
    hipsPos: THREE.Vector3;
    rotations: Map<string, THREE.Euler>;
  };
  isProceduralFallback?: boolean;
}

let cachedGLTF: any = null;
let loadPromise: Promise<any> | null = null;

// Preload and cache CHAR-M-01.glb
export function loadCharacterAsset(): Promise<any> {
  if (cachedGLTF) return Promise.resolve(cachedGLTF);
  if (loadPromise) return loadPromise;

  const loader = new GLTFLoader();
  loadPromise = new Promise((resolve, reject) => {
    loader.load(
      '/models/CHAR-M-01.glb',
      (gltf) => {
        cachedGLTF = gltf;
        resolve(gltf);
      },
      undefined,
      (err) => {
        console.error('Failed to load CHAR-M-01.glb:', err);
        loadPromise = null;
        reject(err);
      }
    );
  });
  return loadPromise;
}

// Instantiate an isolated clone of the character
export async function createCharacterInstance(
  gender: CharacterModelId = 'CHAR-M-01',
  avatarConfig?: AvatarConfiguration
): Promise<LoadedCharacter> {
  try {
    const gltf = await loadCharacterAsset();

    // Clone scene and skeleton cleanly
    const clonedScene = SkeletonUtils.clone(gltf.scene) as THREE.Group;

    // The GLB is authored in 1.80m metric units. Height scaling adapts to user profile safely.
    const hScale = avatarConfig?.heightScale ? Math.max(0.85, Math.min(1.15, avatarConfig.heightScale)) : 1.0;
    clonedScene.scale.set(hScale, hScale, hScale);
    // Center character at origin: feet at y = -0.90 * hScale, hips at y = 0.00
    clonedScene.position.set(0, -0.90 * hScale, 0);

    let surfaceMesh: THREE.SkinnedMesh | null = null;
    let jointsMesh: THREE.SkinnedMesh | null = null;
    const bones: Record<string, THREE.Bone> = {};
    const rotations = new Map<string, THREE.Euler>();

    clonedScene.traverse((child: any) => {
      if (child.isBone) {
        // Register under original name (e.g. 'mixamorig:Hips' or 'mixamorigHips')
        bones[child.name] = child;
        // Also register with normalized alphanumeric name without colons or underscores
        const normName = child.name.replace(/[:_\s]/g, '');
        bones[normName] = child;
        rotations.set(child.name, child.rotation.clone());
        rotations.set(normName, child.rotation.clone());
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.name === 'Beta_Surface' || child.name.includes('Surface')) {
          surfaceMesh = child;
        }
        if (child.name === 'Beta_Joints' || child.name.includes('Joints')) {
          jointsMesh = child;
        }
      }
    });

    // Fallback search if named differently
    if (!surfaceMesh) {
      clonedScene.traverse((child: any) => {
        if (child.isMesh && child.isSkinnedMesh && !surfaceMesh) {
          surfaceMesh = child;
        }
      });
    }

    if (!surfaceMesh) {
      throw new Error('Surface mesh not found in GLB asset');
    }

    const skinnedSurface: THREE.SkinnedMesh = surfaceMesh;

    // Pre-classify 15,901 vertices into canonical anatomical muscle groups
    const posAttr = skinnedSurface.geometry.attributes.position;
    const vertCount = posAttr.count;
    const muscleVertexIndices = new Map<string, number[]>();

    const registerMuscleVert = (idx: number, muscle: string) => {
      if (!muscleVertexIndices.has(muscle)) {
        muscleVertexIndices.set(muscle, []);
      }
      muscleVertexIndices.get(muscle)!.push(idx);
    };

    for (let i = 0; i < vertCount; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      // Anatomical classification in metric space (y: 0 to 1.80m)
      // Chest Pectorals (Upper, Mid, Lower)
      if (y >= 1.34 && y <= 1.48 && z > 0.035 && Math.abs(x) < 0.22) {
        registerMuscleVert(i, x < 0 ? 'upper_chest_l' : 'upper_chest_r');
        registerMuscleVert(i, 'upper_chest');
        registerMuscleVert(i, 'chest');
      } else if (y >= 1.25 && y < 1.34 && z > 0.035 && Math.abs(x) < 0.22) {
        registerMuscleVert(i, x < 0 ? 'mid_chest_l' : 'mid_chest_r');
        registerMuscleVert(i, 'mid_chest');
        registerMuscleVert(i, 'chest');
      } else if (y >= 1.18 && y < 1.25 && z > 0.035 && Math.abs(x) < 0.20) {
        registerMuscleVert(i, x < 0 ? 'lower_chest_l' : 'lower_chest_r');
        registerMuscleVert(i, 'lower_chest');
        registerMuscleVert(i, 'chest');
      }
      // Core & Abdomen (Rectus Abdominis 6-pack & Obliques)
      else if (y >= 1.02 && y < 1.18 && z > 0.025 && Math.abs(x) < 0.13) {
        registerMuscleVert(i, 'rectus_abdominis');
        registerMuscleVert(i, 'abs');
      } else if (y >= 0.92 && y < 1.02 && z > 0.025 && Math.abs(x) < 0.13) {
        registerMuscleVert(i, 'lower_abs');
        registerMuscleVert(i, 'abs');
      } else if (y >= 0.94 && y < 1.22 && Math.abs(x) >= 0.12 && Math.abs(x) <= 0.23 && z > -0.02) {
        registerMuscleVert(i, x < 0 ? 'obliques_l' : 'obliques_r');
        registerMuscleVert(i, 'obliques');
        registerMuscleVert(i, 'abs');
      }
      // Back & Trapezius & Lats
      else if (y >= 1.38 && y <= 1.55 && z < 0.01 && Math.abs(x) < 0.24) {
        registerMuscleVert(i, 'traps');
        registerMuscleVert(i, 'upper_back');
        registerMuscleVert(i, 'back');
      } else if (y >= 1.12 && y < 1.38 && z < 0.01 && Math.abs(x) < 0.28) {
        registerMuscleVert(i, x < 0 ? 'lats_l' : 'lats_r');
        registerMuscleVert(i, 'lats');
        registerMuscleVert(i, 'back');
      } else if (y >= 0.94 && y < 1.12 && z < 0.01 && Math.abs(x) < 0.16) {
        registerMuscleVert(i, 'lower_back');
        registerMuscleVert(i, 'back');
      }
      // Shoulders & Deltoid Caps
      else if (y >= 1.30 && y <= 1.48 && Math.abs(x) >= 0.18 && Math.abs(x) <= 0.35 && z > 0.02) {
        registerMuscleVert(i, x < 0 ? 'front_delts_l' : 'front_delts_r');
        registerMuscleVert(i, 'front_delts');
        registerMuscleVert(i, 'shoulders');
      } else if (y >= 1.30 && y <= 1.48 && Math.abs(x) >= 0.24 && Math.abs(x) <= 0.38 && Math.abs(z) <= 0.04) {
        registerMuscleVert(i, x < 0 ? 'side_delts_l' : 'side_delts_r');
        registerMuscleVert(i, 'side_delts');
        registerMuscleVert(i, 'shoulders');
      } else if (y >= 1.30 && y <= 1.48 && Math.abs(x) >= 0.18 && Math.abs(x) <= 0.35 && z < -0.02) {
        registerMuscleVert(i, x < 0 ? 'rear_delts_l' : 'rear_delts_r');
        registerMuscleVert(i, 'rear_delts');
        registerMuscleVert(i, 'shoulders');
      }
      // Arms (Biceps peak, Triceps horseshoe, Forearm flexors/extensors)
      else if (Math.abs(x) >= 0.25 && Math.abs(x) <= 0.52 && y >= 1.24 && y <= 1.52) {
        if (z >= -0.01) {
          registerMuscleVert(i, x < 0 ? 'biceps_l' : 'biceps_r');
          registerMuscleVert(i, 'biceps');
          registerMuscleVert(i, 'arms');
        } else {
          registerMuscleVert(i, x < 0 ? 'triceps_l' : 'triceps_r');
          registerMuscleVert(i, 'triceps');
          registerMuscleVert(i, 'arms');
        }
      } else if (Math.abs(x) > 0.52 && Math.abs(x) <= 0.78 && y >= 1.18 && y <= 1.52) {
        registerMuscleVert(i, x < 0 ? 'forearms_l' : 'forearms_r');
        registerMuscleVert(i, 'forearms');
        registerMuscleVert(i, 'arms');
      }
      // Lower Body: Glutes, Quads, Hamstrings, Calves
      else if (y >= 0.80 && y < 1.02 && z < -0.01 && Math.abs(x) <= 0.24) {
        registerMuscleVert(i, x < 0 ? 'glutes_l' : 'glutes_r');
        registerMuscleVert(i, 'glutes');
        registerMuscleVert(i, 'legs');
      } else if (y >= 0.48 && y < 0.88 && z > 0.005 && Math.abs(x) <= 0.24) {
        registerMuscleVert(i, x < 0 ? 'quads_l' : 'quads_r');
        registerMuscleVert(i, 'quads');
        registerMuscleVert(i, 'legs');
      } else if (y >= 0.48 && y < 0.88 && z <= 0.005 && Math.abs(x) <= 0.24) {
        registerMuscleVert(i, x < 0 ? 'hamstrings_l' : 'hamstrings_r');
        registerMuscleVert(i, 'hamstrings');
        registerMuscleVert(i, 'legs');
      } else if (y >= 0.12 && y < 0.48 && z < 0.01 && Math.abs(x) <= 0.18) {
        registerMuscleVert(i, x < 0 ? 'calves_l' : 'calves_r');
        registerMuscleVert(i, 'calves');
        registerMuscleVert(i, 'legs');
      }
    }

    // Setup vertex colors buffer on Beta_Surface
    const colorsArray = new Float32Array(vertCount * 3);
    for (let i = 0; i < vertCount * 3; i += 3) {
      colorsArray[i] = 0.62;     // R
      colorsArray[i + 1] = 0.63; // G
      colorsArray[i + 2] = 0.65; // B: Neutral light-gray mannequin base (PRD anatomical style)
    }
    const colorAttribute = new THREE.BufferAttribute(colorsArray, 3);
    skinnedSurface.geometry.setAttribute('color', colorAttribute);

    // Clean PBR Skin & Materials (satin skin response, no harsh plastic shine)
    skinnedSurface.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.60,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    // Seamlessly match joints mesh to surface so there are no floating pieces or contrasting robot bands
    const skinnedJoints = jointsMesh as THREE.SkinnedMesh | null;
    if (skinnedJoints) {
      skinnedJoints.material = new THREE.MeshStandardMaterial({
        color: 0x9ea0a5,
        roughness: 0.60,
        metalness: 0.0,
      });
    }

    // Morphology adjustments: Gender baseline + Parametric User Avatar Customization
    const shoulderMod = avatarConfig?.shoulderProportion ?? (gender === 'CHAR-F-01' ? 0.92 : 1.05);
    const chestMod = avatarConfig?.chestProportion ?? (gender === 'CHAR-F-01' ? 0.95 : 1.04);
    const waistMod = avatarConfig?.waistProportion ?? (gender === 'CHAR-F-01' ? 0.92 : 1.0);
    const hipMod = avatarConfig?.hipProportion ?? (gender === 'CHAR-F-01' ? 1.08 : 0.98);
    const armMod = avatarConfig?.armProportion ?? (gender === 'CHAR-F-01' ? 0.94 : 1.06);
    const legMod = avatarConfig?.legProportion ?? (gender === 'CHAR-F-01' ? 0.96 : 1.04);

    const lShoulder = bones.mixamorigLeftShoulder || bones['mixamorig:LeftShoulder'];
    const rShoulder = bones.mixamorigRightShoulder || bones['mixamorig:RightShoulder'];
    const hips = bones.mixamorigHips || bones['mixamorig:Hips'];
    const spine = bones.mixamorigSpine || bones['mixamorig:Spine'];
    const spine2 = bones.mixamorigSpine2 || bones['mixamorig:Spine2'];
    const lArm = bones.mixamorigLeftArm || bones['mixamorig:LeftArm'];
    const rArm = bones.mixamorigRightArm || bones['mixamorig:RightArm'];
    const lUpLeg = bones.mixamorigLeftUpLeg || bones['mixamorig:LeftUpLeg'];
    const rUpLeg = bones.mixamorigRightUpLeg || bones['mixamorig:RightUpLeg'];

    if (lShoulder) lShoulder.scale.set(shoulderMod, 1, shoulderMod);
    if (rShoulder) rShoulder.scale.set(shoulderMod, 1, shoulderMod);
    if (spine2) spine2.scale.set(chestMod, 1, chestMod);
    if (spine) spine.scale.set(waistMod, 1, waistMod);
    if (hips) hips.scale.set(hipMod, 1, hipMod);
    if (lArm) lArm.scale.set(armMod, 1, armMod);
    if (rArm) rArm.scale.set(armMod, 1, armMod);
    if (lUpLeg) lUpLeg.scale.set(legMod, 1, legMod);
    if (rUpLeg) rUpLeg.scale.set(legMod, 1, legMod);

    const char: LoadedCharacter = {
      scene: clonedScene,
      surfaceMesh,
      jointsMesh: jointsMesh || undefined,
      colorAttribute,
      muscleVertexIndices,
      bones,
      initialTransforms: {
        hipsPos: hips ? hips.position.clone() : new THREE.Vector3(0, 104, 0),
        rotations,
      },
      isProceduralFallback: false,
    };

    // Immediately put character into natural athletic resting stance
    resetBonesToRest(char);

    return char;
  } catch (err) {
    console.warn('Falling back to anatomical rigged mesh:', err);
    // Reliable procedural fallback
    const rigData = createAnatomicalHumanRig(gender);
    const sceneGroup = new THREE.Group();
    sceneGroup.add(rigData.mesh);
    sceneGroup.scale.set(1.0, 1.0, 1.0);
    sceneGroup.position.set(0, -0.90, 0);

    const bonesRecord: Record<string, THREE.Bone> = {};
    const rotations = new Map<string, THREE.Euler>();
    Object.entries(rigData.bones).forEach(([k, b]) => {
      bonesRecord[k] = b;
      rotations.set(k, b.rotation.clone());
    });

    return {
      scene: sceneGroup,
      surfaceMesh: rigData.mesh,
      colorAttribute: rigData.colorAttribute,
      muscleVertexIndices: rigData.muscleVertexIndices,
      bones: bonesRecord,
      initialTransforms: {
        hipsPos: rigData.bones.pelvis.position.clone(),
        rotations,
      },
      isProceduralFallback: true,
    };
  }
}

// Reset all bones to natural athletic resting stance (arms relaxed at sides, grounded feet)
export function resetBonesToRest(char: LoadedCharacter) {
  const bones = char.bones;
  const init = char.initialTransforms;

  const hips = bones.mixamorigHips || bones['mixamorig:Hips'] || bones.pelvis;
  if (hips) {
    hips.position.copy(init.hipsPos);
    hips.rotation.set(0, 0, 0);
  }

  // Restore base rotations
  init.rotations.forEach((rot, name) => {
    if (bones[name]) {
      bones[name].rotation.copy(rot);
    }
  });

  // Natural athletic resting stance: drop arms from Mixamo T-pose to sides
  const lArm = bones.mixamorigLeftArm || bones['mixamorig:LeftArm'] || bones.upperarmL;
  const rArm = bones.mixamorigRightArm || bones['mixamorig:RightArm'] || bones.upperarmR;
  const lForeArm = bones.mixamorigLeftForeArm || bones['mixamorig:LeftForeArm'] || bones.forearmL;
  const rForeArm = bones.mixamorigRightForeArm || bones['mixamorig:RightForeArm'] || bones.forearmR;

  if (lArm) {
    lArm.rotation.z = -1.25;
    lArm.rotation.x = 0.05;
  }
  if (rArm) {
    rArm.rotation.z = 1.25;
    rArm.rotation.x = 0.05;
  }
  if (lForeArm) {
    lForeArm.rotation.y = 0.15;
  }
  if (rForeArm) {
    rForeArm.rotation.y = -0.15;
  }
}

// Full humanoid joint kinematics driving the connected mesh
export function applyExerciseKinematics(
  char: LoadedCharacter,
  animationType: string,
  phase: number, // 0 (start) to 1 (peak contraction / turnaround)
  t: number
) {
  resetBonesToRest(char);
  const b = char.bones;
  const init = char.initialTransforms;

  // Convenient bone aliases
  const hips = b.mixamorigHips || b['mixamorig:Hips'] || b.pelvis;
  const spine = b.mixamorigSpine || b['mixamorig:Spine'] || b.spine01;
  const spine1 = b.mixamorigSpine1 || b['mixamorig:Spine1'] || b.spine02;
  const spine2 = b.mixamorigSpine2 || b['mixamorig:Spine2'] || b.chest;
  const head = b.mixamorigHead || b['mixamorig:Head'] || b.head;

  const lArm = b.mixamorigLeftArm || b['mixamorig:LeftArm'] || b.upperarmL;
  const rArm = b.mixamorigRightArm || b['mixamorig:RightArm'] || b.upperarmR;
  const lForeArm = b.mixamorigLeftForeArm || b['mixamorig:LeftForeArm'] || b.forearmL;
  const rForeArm = b.mixamorigRightForeArm || b['mixamorig:RightForeArm'] || b.forearmR;
  const lHand = b.mixamorigLeftHand || b['mixamorig:LeftHand'] || b.handL;
  const rHand = b.mixamorigRightHand || b['mixamorig:RightHand'] || b.handR;

  const lUpLeg = b.mixamorigLeftUpLeg || b['mixamorig:LeftUpLeg'] || b.thighL;
  const rUpLeg = b.mixamorigRightUpLeg || b['mixamorig:RightUpLeg'] || b.thighR;
  const lLeg = b.mixamorigLeftLeg || b['mixamorig:LeftLeg'] || b.calfL;
  const rLeg = b.mixamorigRightLeg || b['mixamorig:RightLeg'] || b.calfR;
  const lFoot = b.mixamorigLeftFoot || b['mixamorig:LeftFoot'] || b.footL;
  const rFoot = b.mixamorigRightFoot || b['mixamorig:RightFoot'] || b.footR;

  switch (animationType) {
    case 'squat': {
      char.scene.rotation.set(0, 0, 0);
      char.scene.position.set(0, -0.90, 0);
      // 1. Controlled hip descent and hinge backward
      const descentCm = phase * 32; // 32 cm descent to parallel
      if (hips) {
        hips.position.y = init.hipsPos.y - descentCm;
        hips.position.z = init.hipsPos.z - phase * 6;
      }
      // 2. Torso forward inclination to preserve center of gravity
      if (spine) spine.rotation.x = phase * 0.32;
      if (spine1) spine1.rotation.x = phase * 0.16;
      // 3. Thigh hip flexion (quads load)
      if (lUpLeg) lUpLeg.rotation.x = -phase * 1.40;
      if (rUpLeg) rUpLeg.rotation.x = -phase * 1.40;
      // 4. Knee flexion (knees bend back 90-105 deg)
      if (lLeg) lLeg.rotation.x = phase * 2.20;
      if (rLeg) rLeg.rotation.x = phase * 2.20;
      // 5. Ankle dorsiflexion keeps feet stable on ground
      if (lFoot) lFoot.rotation.x = -phase * 0.80;
      if (rFoot) rFoot.rotation.x = -phase * 0.80;
      // 6. Arms extend forward for counterbalance
      if (lArm) {
        lArm.rotation.z = -1.1;
        lArm.rotation.x = -phase * 1.15;
      }
      if (rArm) {
        rArm.rotation.z = 1.1;
        rArm.rotation.x = -phase * 1.15;
      }
      break;
    }

    case 'pushup': {
      // Horizontal prone orientation
      char.scene.rotation.x = Math.PI / 2.12;
      char.scene.position.y = -0.55 - phase * 0.28;
      // Arms flare at safe 45 deg angle, elbows bend to 90 deg
      if (lArm) {
        lArm.rotation.z = -0.45 - phase * 0.45;
        lArm.rotation.x = 0.45 + phase * 0.48;
      }
      if (rArm) {
        rArm.rotation.z = 0.45 + phase * 0.45;
        rArm.rotation.x = 0.45 + phase * 0.48;
      }
      if (lForeArm) lForeArm.rotation.y = -0.45 - phase * 1.15;
      if (rForeArm) rForeArm.rotation.y = 0.45 + phase * 1.15;
      break;
    }

    case 'bicep_curl': {
      char.scene.rotation.set(0, 0, 0);
      char.scene.position.set(0, -0.90, 0);
      // Upper arms pinned against ribs
      if (lArm) {
        lArm.rotation.z = -1.30;
        lArm.rotation.x = 0.05;
      }
      if (rArm) {
        rArm.rotation.z = 1.30;
        rArm.rotation.x = 0.05;
      }
      // Forearms curl up with supination to peak contraction
      if (lForeArm) {
        lForeArm.rotation.y = -phase * 2.30;
        lForeArm.rotation.z = phase * 0.35;
      }
      if (rForeArm) {
        rForeArm.rotation.y = phase * 2.30;
        rForeArm.rotation.z = -phase * 0.35;
      }
      if (lHand) lHand.rotation.z = phase * 0.2;
      if (rHand) rHand.rotation.z = -phase * 0.2;
      break;
    }

    case 'overhead_press': {
      char.scene.rotation.set(0, 0, 0);
      char.scene.position.set(0, -0.90, 0);
      // Arms press vertically overhead in scaption plane
      if (lArm) {
        lArm.rotation.z = -1.25 + phase * 1.15;
        lArm.rotation.x = -phase * 1.75;
      }
      if (rArm) {
        rArm.rotation.z = 1.25 - phase * 1.15;
        rArm.rotation.x = -phase * 1.75;
      }
      if (lForeArm) lForeArm.rotation.y = -1.25 + phase * 1.25;
      if (rForeArm) rForeArm.rotation.y = 1.25 - phase * 1.25;
      break;
    }

    case 'lunges': {
      char.scene.rotation.set(0, 0, 0);
      char.scene.position.set(0, -0.90, 0);
      const lungeCycle = Math.sin(t * 0.85);
      const descent = Math.abs(lungeCycle) * 22;
      if (hips) hips.position.y = init.hipsPos.y - descent;
      if (lUpLeg) lUpLeg.rotation.x = lungeCycle * 0.95;
      if (rUpLeg) rUpLeg.rotation.x = -lungeCycle * 0.95;
      if (lLeg) lLeg.rotation.x = Math.max(0, -lungeCycle * 1.6);
      if (rLeg) rLeg.rotation.x = Math.max(0, lungeCycle * 1.6);
      break;
    }

    case 'crunch': {
      char.scene.rotation.x = -Math.PI / 2.20;
      char.scene.position.y = -0.65;
      if (lUpLeg) lUpLeg.rotation.x = -1.35;
      if (rUpLeg) rUpLeg.rotation.x = -1.35;
      if (lLeg) lLeg.rotation.x = 1.95;
      if (rLeg) rLeg.rotation.x = 1.95;
      // Torso curls upward squeezing abs
      if (spine) spine.rotation.x = phase * 0.45;
      if (spine1) spine1.rotation.x = phase * 0.35;
      if (lArm) lArm.rotation.z = -1.0;
      if (rArm) rArm.rotation.z = 1.0;
      break;
    }

    // BOXING SUITE WITH BIOMECHANICAL KINETIC CHAIN
    case 'box_guard': {
      char.scene.rotation.set(0, 0.35, 0); // Orthodox 45 deg angle
      char.scene.position.set(0, -0.90, 0);
      const bounce = Math.sin(t * 3.5) * 0.015;
      if (hips) {
        hips.position.y = init.hipsPos.y + bounce;
        hips.rotation.y = 0.15;
      }
      // Lead left guard protecting cheek
      if (lArm) {
        lArm.rotation.z = -1.20;
        lArm.rotation.x = -0.95;
      }
      if (lForeArm) lForeArm.rotation.y = -1.35;
      // Rear right guard glued to jaw
      if (rArm) {
        rArm.rotation.z = 1.25;
        rArm.rotation.x = -1.15;
      }
      if (rForeArm) rForeArm.rotation.y = 1.55;
      // Staggered stance feet
      if (rFoot) rFoot.rotation.x = 0.25;
      break;
    }

    case 'box_jab': {
      char.scene.rotation.set(0, 0.35, 0);
      char.scene.position.set(0, -0.90, 0);
      // Kinetic Chain: Hip snap & torso drive
      if (hips) hips.rotation.y = 0.15 + phase * 0.25;
      if (spine1) spine1.rotation.y = 0.20 + phase * 0.38;
      // Lead left punch fires straight with horizontal pronation
      if (lArm) {
        lArm.rotation.z = -1.15 + phase * 0.35;
        lArm.rotation.x = -0.95 - phase * 0.85;
      }
      if (lForeArm) lForeArm.rotation.y = -1.35 + phase * 1.35;
      // Rear guard stays glued to jaw
      if (rArm) {
        rArm.rotation.z = 1.25;
        rArm.rotation.x = -1.15;
      }
      if (rForeArm) rForeArm.rotation.y = 1.55;
      break;
    }

    case 'box_cross': {
      char.scene.rotation.set(0, 0.35, 0);
      char.scene.position.set(0, -0.90, 0);
      // Rear foot pivot & deep explosive hip drive
      if (rUpLeg) rUpLeg.rotation.y = -phase * 0.55;
      if (rFoot) {
        rFoot.rotation.y = -phase * 0.35;
        rFoot.rotation.x = 0.35;
      }
      if (hips) hips.rotation.y = 0.15 - phase * 0.55;
      if (spine1) spine1.rotation.y = -phase * 0.72;
      // Rear cross drives straight down the pipe with pronation
      if (rArm) {
        rArm.rotation.z = 1.15 - phase * 0.35;
        rArm.rotation.x = -0.95 - phase * 0.90;
      }
      if (rForeArm) rForeArm.rotation.y = 1.55 - phase * 1.55;
      // Lead guard protects jaw
      if (lArm) {
        lArm.rotation.z = -1.25;
        lArm.rotation.x = -1.15;
      }
      if (lForeArm) lForeArm.rotation.y = -1.55;
      break;
    }

    case 'box_left_hook':
    case 'box_hook': {
      char.scene.rotation.set(0, 0.35, 0);
      char.scene.position.set(0, -0.90, 0);
      // Lead foot pivots, hips and torso whip horizontally to the right
      if (lUpLeg) lUpLeg.rotation.y = phase * 0.45;
      if (hips) hips.rotation.y = 0.15 + phase * 0.50;
      if (spine1) spine1.rotation.y = 0.20 + phase * 0.65;
      // Left elbow locked at 90 deg, horizontal whipping arc
      if (lArm) {
        lArm.rotation.x = -0.75 - phase * 0.30;
        lArm.rotation.z = -0.45 - phase * 0.55;
      }
      if (lForeArm) lForeArm.rotation.y = -1.50; // Rigid 90-deg angle
      // Rear guard protects right temple
      if (rArm) {
        rArm.rotation.z = 1.25;
        rArm.rotation.x = -1.15;
      }
      if (rForeArm) rForeArm.rotation.y = 1.55;
      break;
    }

    case 'box_right_hook': {
      char.scene.rotation.set(0, 0.35, 0);
      char.scene.position.set(0, -0.90, 0);
      // Rear foot pivots deeply, hips whip to the left
      if (rUpLeg) rUpLeg.rotation.y = -phase * 0.60;
      if (hips) hips.rotation.y = 0.15 - phase * 0.55;
      if (spine1) spine1.rotation.y = -phase * 0.70;
      // Right elbow locked at 90 deg horizontal looping hook
      if (rArm) {
        rArm.rotation.x = -0.75 - phase * 0.30;
        rArm.rotation.z = 0.45 + phase * 0.55;
      }
      if (rForeArm) rForeArm.rotation.y = 1.50;
      // Lead guard protects jaw
      if (lArm) {
        lArm.rotation.z = -1.25;
        lArm.rotation.x = -1.15;
      }
      if (lForeArm) lForeArm.rotation.y = -1.55;
      break;
    }

    case 'box_left_uppercut': {
      char.scene.rotation.set(0, 0.35, 0);
      char.scene.position.set(0, -0.90, 0);
      // Hip dips and explodes upward
      if (hips) {
        hips.position.y = init.hipsPos.y + phase * 4;
        hips.rotation.y = 0.15 + phase * 0.35;
      }
      if (spine1) spine1.rotation.x = -phase * 0.18;
      // Left uppercut vertical drive
      if (lArm) {
        lArm.rotation.x = -0.55 - phase * 0.85;
        lArm.rotation.z = -1.05;
      }
      if (lForeArm) lForeArm.rotation.y = -1.80 + phase * 0.65;
      // Rear guard
      if (rArm) {
        rArm.rotation.z = 1.25;
        rArm.rotation.x = -1.15;
      }
      if (rForeArm) rForeArm.rotation.y = 1.55;
      break;
    }

    case 'box_right_uppercut': {
      char.scene.rotation.set(0, 0.35, 0);
      char.scene.position.set(0, -0.90, 0);
      // Rear leg explodes upward
      if (rUpLeg) rUpLeg.rotation.y = -phase * 0.45;
      if (hips) {
        hips.position.y = init.hipsPos.y + phase * 4;
        hips.rotation.y = 0.15 - phase * 0.45;
      }
      if (spine1) spine1.rotation.x = -phase * 0.18;
      // Right uppercut vertical drive
      if (rArm) {
        rArm.rotation.x = -0.55 - phase * 0.85;
        rArm.rotation.z = 1.05;
      }
      if (rForeArm) rForeArm.rotation.y = 1.80 - phase * 0.65;
      // Lead guard
      if (lArm) {
        lArm.rotation.z = -1.25;
        lArm.rotation.x = -1.15;
      }
      if (lForeArm) lForeArm.rotation.y = -1.55;
      break;
    }

    default: {
      // Idle athletic breathing & micro-sway
      char.scene.rotation.set(0, 0, 0);
      char.scene.position.set(0, -0.90, 0);
      const breathe = Math.sin(t * 0.85) * 0.02;
      if (spine2) {
        spine2.scale.set(1 + breathe, 1 + breathe * 0.5, 1 + breathe);
      }
      if (head) {
        head.rotation.y = Math.sin(t * 0.35) * 0.06;
      }
      break;
    }
  }
}

// Update muscle vertex highlights smoothly
export function updateMuscleHighlights(
  char: LoadedCharacter,
  primaryList: MuscleName[],
  secondaryList: MuscleName[]
) {
  const colorAttr = char.colorAttribute;
  const muscleMap = char.muscleVertexIndices;

  // Base neutral light-gray mannequin (PRD: neutral gray body)
  const baseR = 0.62;
  const baseG = 0.63;
  const baseB = 0.65;

  for (let i = 0; i < colorAttr.count; i++) {
    colorAttr.setXYZ(i, baseR, baseG, baseB);
  }

  const isMatched = (mKey: string, list: MuscleName[]) => {
    if (list.includes(mKey as MuscleName)) return true;
    const stripped = mKey.replace(/(_l|_r)$/, '');
    if (list.includes(stripped as MuscleName)) return true;
    return false;
  };

  muscleMap.forEach((indices, muscleKey) => {
    const isPrimary = isMatched(muscleKey, primaryList);
    const isSecondary = isMatched(muscleKey, secondaryList);

    if (isPrimary) {
      // Primary muscle: strong orange-red (PRD highlight)
      for (const idx of indices) {
        colorAttr.setXYZ(idx, 1.0, 0.30, 0.10);
      }
    } else if (isSecondary) {
      // Secondary muscle: lower-intensity soft orange (PRD)
      for (const idx of indices) {
        colorAttr.setXYZ(idx, 0.97, 0.66, 0.50);
      }
    }
  });

  colorAttr.needsUpdate = true;
}
