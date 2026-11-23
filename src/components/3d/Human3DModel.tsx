import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MuscleName, CharacterModelId, AnimationState, AvatarConfiguration } from '../../types';
import {
  LoadedCharacter,
  createCharacterInstance,
  applyExerciseKinematics,
  updateMuscleHighlights,
} from './characterLoader';
import { EQUIPMENT, createEquipment, Equipment } from './equipmentProps';
import { Bone, Play, Pause, Zap, Info, ShieldCheck, Loader2 } from 'lucide-react';

interface Human3DModelProps {
  primaryMuscles?: MuscleName[];
  secondaryMuscles?: MuscleName[];
  animationType?: string;
  characterId?: CharacterModelId;
  avatarConfig?: AvatarConfiguration;
  isPaused?: boolean;
  playbackSpeed?: number;
  height?: number | string;
  className?: string;
  showControls?: boolean;
  /** Kept for compatibility. The camera is now always fixed (no drag / zoom). */
  interactive?: boolean;
  onMuscleClick?: (muscle: MuscleName) => void;
  onStateChange?: (state: AnimationState) => void;
}

// ---------------------------------------------------------------------------
// PRD Section 11 - 3D Model States: IDLE -> START -> MOVEMENT -> END -> REVERSE -> REPEAT
// One rep = one full cycle. Cycle length matches the old sine wave (2*PI in animTime units).
// phase: 0 = start posture, 1 = end posture (peak contraction).
// ---------------------------------------------------------------------------
// Fixed camera position (same 3/4 view for every exercise)
const FIXED_CAM = { x: 1.15, y: 0.15, z: 2.75 };

const smoothStep = (x: number) => x * x * (3 - 2 * x);

const getCycleInfo = (t: number): { phase: number; state: AnimationState } => {
  const x = ((t / (Math.PI * 2)) % 1 + 1) % 1; // 0..1 position inside one rep
  if (x < 0.10) return { phase: 0, state: 'IDLE' };
  if (x < 0.20) return { phase: 0, state: 'START_POSITION' };
  if (x < 0.50) return { phase: smoothStep((x - 0.20) / 0.30), state: 'ECCENTRIC_LOAD' };
  if (x < 0.65) return { phase: 1, state: 'PEAK_CONTRACTION' };
  if (x < 0.95) return { phase: 1 - smoothStep((x - 0.65) / 0.30), state: 'CONCENTRIC_RETURN' };
  return { phase: 0, state: 'REP_COMPLETE' };
};

const FLOOR_Y = -0.905;

// Plays one full rep offline (no rendering) and returns the box that contains the whole body
// at every moment of the exercise. Used once per exercise to frame the camera.
function computeMotionBounds(char: LoadedCharacter, animationType: string, equipment?: Equipment | null): THREE.Box3 {
  const box = new THREE.Box3();
  const p = new THREE.Vector3();
  const N = 24;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    applyExerciseKinematics(char, animationType, getCycleInfo(t).phase, t);
    char.scene.updateMatrixWorld(true);
    Object.values(char.bones).forEach((b) => {
      b.getWorldPosition(p);
      box.expandByPoint(p);
    });
    if (equipment) {
      equipment.update();
      box.union(new THREE.Box3().setFromObject(equipment.group));
    }
  }
  applyExerciseKinematics(char, animationType, 0, 0);
  char.scene.updateMatrixWorld(true);
  box.expandByScalar(0.14);                          // body thickness / head / hands
  box.expandByPoint(new THREE.Vector3(0, FLOOR_Y, 0)); // keep the floor in view
  return box;
}

// Places the (fixed) camera so the whole motion box fits in view. Same viewing direction for
// every exercise; only the distance and the look-at point depend on the exercise.
function fitCameraToBox(camera: THREE.PerspectiveCamera, box: THREE.Box3): THREE.Vector3 {
  const center = box.getCenter(new THREE.Vector3());
  const dir = new THREE.Vector3(FIXED_CAM.x, FIXED_CAM.y, FIXED_CAM.z).normalize();
  const corners: THREE.Vector3[] = [];
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
  let d = 1.2;
  for (let i = 0; i < 120; i++) {
    camera.position.copy(center).addScaledVector(dir, d);
    camera.lookAt(center);
    camera.updateMatrixWorld(true);
    const fits = corners.every((c) => {
      const n = c.clone().project(camera);
      return Math.abs(n.x) <= 0.92 && Math.abs(n.y) <= 0.92;
    });
    if (fits) break;
    d *= 1.04;
  }
  return center;
}

export const Human3DModel: React.FC<Human3DModelProps> = ({
  primaryMuscles = [],
  secondaryMuscles = [],
  animationType = 'idle',
  characterId = 'CHAR-M-01',
  avatarConfig,
  isPaused = false,
  playbackSpeed = 1,
  height = '100%',
  className = '',
  showControls = true,
  onMuscleClick,
  onStateChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalPaused, setInternalPaused] = useState(isPaused);
  const [internalSpeed, setInternalSpeed] = useState(playbackSpeed);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [selectedGender, setSelectedGender] = useState<CharacterModelId>(characterId);
  const [animState, setAnimState] = useState<AnimationState>('START_POSITION');
  const [showFormCues, setShowFormCues] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSelectedGender(characterId);
  }, [characterId]);

  useEffect(() => {
    setInternalPaused(isPaused);
  }, [isPaused]);

  useEffect(() => {
    setInternalSpeed(playbackSpeed);
  }, [playbackSpeed]);

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    char: LoadedCharacter | null;
    skeletonHelper: THREE.SkeletonHelper | null;
    box: THREE.Box3 | null;
    equipment: Equipment | null;
    lookAt: THREE.Vector3;
    animTime: number;
    reqId: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    char: null,
    skeletonHelper: null,
    box: null,
    equipment: null,
    lookAt: new THREE.Vector3(0, 0.05, 0),
    animTime: 0,
    reqId: null,
  });

  // Setup Three.js scene and load connected GLB humanoid character
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDisposed = false;
    const width = container.clientWidth || 360;
    const heightPx = container.clientHeight || 440;

    // Light neutral studio background (PRD visual language)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f5f7);   // clean off-white, like workout apps

    // Perspective Camera: 38 deg FOV framing full body with safe margins
    const camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 100);
    // FIXED camera: it never moves, orbits or zooms. Only the character moves.
    camera.position.set(FIXED_CAM.x, FIXED_CAM.y, FIXED_CAM.z);
    camera.lookAt(0, 0.05, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      console.warn('WebGL context creation failed:', err);
      setIsLoading(false);
      return;
    }
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Controlled Studio Lighting (Key, Fill, Rim, Ambient)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2.5, 3.5, 3.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.55);
    fillLight.position.set(-2.8, 1.6, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.50);
    rimLight.position.set(0, 3.0, -3.2);
    scene.add(rimLight);

    // Studio Pedestal & Contact Shadow Floor (Grounded at y = -0.90)
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.18 });
    const shadowFloor = new THREE.Mesh(floorGeo, floorMat);
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.y = -0.905;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);

    // Exercise mat (light blue). Its size is set once per exercise from the body footprint.
    const exMat = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.03, 1),
      new THREE.MeshStandardMaterial({ color: 0x8fd3f4, roughness: 0.9, metalness: 0.0 })
    );
    exMat.visible = false;
    exMat.receiveShadow = true;
    scene.add(exMat);

    // Step / bench prop (shown only for exercises that rest hands or feet on one)
    const propBox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xaeb2b8, roughness: 0.8, metalness: 0.0 })
    );
    propBox.visible = false;
    propBox.castShadow = true;
    propBox.receiveShadow = true;
    scene.add(propBox);

    stateRef.current.renderer = renderer;
    stateRef.current.scene = scene;
    stateRef.current.camera = camera;

    // Load authentic connected rigged GLB character
    setIsLoading(true);
    createCharacterInstance(selectedGender, avatarConfig)
      .then((char) => {
        if (isDisposed) return;
        scene.add(char.scene);

        // Skeleton X-Ray Helper
        const skelHelper = new THREE.SkeletonHelper(char.scene);
        (skelHelper.material as THREE.LineBasicMaterial).linewidth = 2;
        (skelHelper.material as THREE.LineBasicMaterial).color.setHex(0x38bdf8);
        skelHelper.visible = showSkeleton;
        scene.add(skelHelper);

        stateRef.current.char = char;
        stateRef.current.skeletonHelper = skelHelper;

        // Frame the whole exercise once; the camera never moves after this
        // Equipment (dumbbells, bench, bar, band, cable ...) for this exercise
        const specs = EQUIPMENT[animationType];
        let equipment: Equipment | null = null;
        if (specs && specs.length) {
          equipment = createEquipment(char, specs, () => applyExerciseKinematics(char, animationType, 0, 0));
          scene.add(equipment.group);
          stateRef.current.equipment = equipment;
        }
        const box = computeMotionBounds(char, animationType, equipment);
        box.expandByVector(new THREE.Vector3(0.3, 0, 0.3));      // mat margin around the body
        const mSize = box.getSize(new THREE.Vector3());
        const mCentre = box.getCenter(new THREE.Vector3());
        exMat.scale.set(Math.max(mSize.x, 1.0), 1, Math.max(mSize.z, 1.0));
        exMat.position.set(mCentre.x, FLOOR_Y - 0.011, mCentre.z);
        exMat.visible = true;
        stateRef.current.box = box;
        stateRef.current.lookAt = fitCameraToBox(camera, box);

        // Apply initial muscle highlights
        updateMuscleHighlights(char, primaryMuscles, secondaryMuscles);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Character instantiation error:', err);
        setIsLoading(false);
      });

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (stateRef.current.box) stateRef.current.lookAt = fitCameraToBox(camera, stateRef.current.box);
    };
    window.addEventListener('resize', handleResize);

    // Render & Animation Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (!internalPaused) {
        stateRef.current.animTime += delta * internalSpeed * 2.4;
      }

      const t = stateRef.current.animTime;
      const char = stateRef.current.char;

      if (char) {
        // Phase + state from the PRD 6-state cycle [phase: 0 to 1]
        const { phase, state: currentState } = getCycleInfo(t);

        setAnimState(currentState);
        if (onStateChange) onStateChange(currentState);

        // Apply joint kinematics to connected humanoid character
        applyExerciseKinematics(char, animationType, phase, t);
        // Keep dumbbells / bar / band / cable attached to the hands and feet
        stateRef.current.equipment?.update();
      }

      // Step / bench prop and camera focus for floor exercises (set by the pose engine)
      const plat = char
        ? (char.scene.userData.platform as { x: number; z: number; height: number; yaw: number } | undefined)
        : undefined;
      if (plat) {
        propBox.visible = true;
        propBox.scale.set(0.55, plat.height, 0.42);
        propBox.position.set(plat.x, -0.905 + plat.height / 2, plat.z);
        propBox.rotation.y = plat.yaw;
      } else {
        propBox.visible = false;
      }
      // Camera is fixed for the whole exercise (position set once in fitCameraToBox)
      camera.lookAt(stateRef.current.lookAt);

      renderer.render(scene, camera);
      stateRef.current.reqId = requestAnimationFrame(animate);
    };

    stateRef.current.reqId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      if (stateRef.current.reqId) cancelAnimationFrame(stateRef.current.reqId);
      if (stateRef.current.equipment) {
        stateRef.current.equipment.dispose();
        stateRef.current.equipment = null;
      }
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [animationType, selectedGender, avatarConfig]);

  // Update muscle highlights whenever props change
  useEffect(() => {
    const char = stateRef.current.char;
    if (char) {
      updateMuscleHighlights(char, primaryMuscles, secondaryMuscles);
    }
  }, [primaryMuscles, secondaryMuscles, isLoading]);

  // Toggle Skeleton Helper
  useEffect(() => {
    if (stateRef.current.skeletonHelper) {
      stateRef.current.skeletonHelper.visible = showSkeleton;
    }
  }, [showSkeleton]);

  const cycleSpeed = () => {
    const next = internalSpeed === 1 ? 0.5 : internalSpeed === 0.5 ? 0.75 : internalSpeed === 0.75 ? 1.5 : 1;
    setInternalSpeed(next);
  };

  const stateBadgeInfo: Record<AnimationState, { label: string; color: string }> = {
    IDLE: { label: 'IDLE', color: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
    START_POSITION: { label: 'START POSE', color: 'bg-blue-900/60 text-blue-300 border-blue-500/40' },
    ECCENTRIC_LOAD: { label: 'ECCENTRIC / LOAD', color: 'bg-amber-900/60 text-amber-300 border-amber-500/40' },
    PEAK_CONTRACTION: { label: 'PEAK CONTRACTION', color: 'bg-red-900/80 text-red-200 border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.5)]' },
    CONCENTRIC_RETURN: { label: 'CONCENTRIC / DRIVE', color: 'bg-orange-900/60 text-orange-300 border-orange-500/40' },
    REP_COMPLETE: { label: 'REP RESET', color: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40' },
  };

  return (
    <div className={`relative w-full overflow-hidden select-none rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black ${className}`} style={{ height }}>
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
          <span className="text-xs font-mono font-bold text-neutral-300 tracking-wider uppercase">
            Loading Rigged Biomechanics Avatar...
          </span>
        </div>
      )}

      {/* Top Left: Character ID & State Machine HUD */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-black/75 backdrop-blur-md text-neutral-300 border border-neutral-800 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {selectedGender} • Connected Human Rig
          </span>
        </div>

        {/* State Machine Badge */}
        <div className="flex items-center gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${stateBadgeInfo[animState].color}`}>
            {stateBadgeInfo[animState].label}
          </span>
        </div>
      </div>

      {/* Form Guidance Drawer */}
      {showFormCues && (
        <div className="absolute top-16 inset-x-4 bg-black/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3.5 z-20 text-xs shadow-2xl animate-fade-in space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase font-bold">
            <span className="flex items-center gap-1 text-orange-400">
              <Zap className="w-3.5 h-3.5" /> Biomechanics Cue
            </span>
            <button onClick={() => setShowFormCues(false)} className="hover:text-white">✕</button>
          </div>
          <p className="text-neutral-200 font-semibold leading-relaxed">
            {animState === 'ECCENTRIC_LOAD' && 'Eccentric descent: slow 2-second lowering under tension. Retract shoulder blades, ground feet.'}
            {animState === 'PEAK_CONTRACTION' && 'Peak contraction: pause briefly at full anatomical depth. Maximum muscle fiber recruitment.'}
            {animState === 'CONCENTRIC_RETURN' && 'Concentric drive: accelerate upward through the heels/palms with locked core stability.'}
            {animState === 'START_POSITION' && 'Starting alignment: upright spine, grounded stance, neutral joint stacking.'}
            {animState === 'REP_COMPLETE' && 'Rep reset: re-establish steady cadence before next repetition.'}
          </p>
        </div>
      )}

      {/* Bottom Bar: Play/Pause, Tempo, Form, Skeleton, Gender */}
      {showControls && (
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto z-10 gap-2">
          {/* Play/Pause & Speed */}
          <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md border border-neutral-800 rounded-2xl px-2 py-1 shadow-lg">
            <button
              onClick={() => setInternalPaused(!internalPaused)}
              className="p-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
              title={internalPaused ? 'Resume Animation' : 'Pause'}
            >
              {internalPaused ? (
                <Play className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Pause className="w-3.5 h-3.5 fill-current" />
              )}
            </button>

            <button
              onClick={cycleSpeed}
              className="px-2 py-1 text-xs font-mono font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition"
              title="Tempo / Speed"
            >
              {internalSpeed}x
            </button>
          </div>

          {/* Form Breakdown & Skeleton Rig Toggle */}
          <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-neutral-800 rounded-2xl p-1 shadow-lg">
            <button
              onClick={() => setShowFormCues(!showFormCues)}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl flex items-center gap-1 transition ${
                showFormCues ? 'bg-orange-500 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
              title="Movement Form Guide"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Form</span>
            </button>

            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={`p-1.5 rounded-xl transition ${
                showSkeleton ? 'bg-cyan-500 text-black font-bold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Skeleton X-Ray Rig"
            >
              <Bone className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setSelectedGender(selectedGender === 'CHAR-M-01' ? 'CHAR-F-01' : 'CHAR-M-01')}
              className="px-2.5 py-1 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition"
              title="Switch Male/Female Character"
            >
              {selectedGender === 'CHAR-M-01' ? 'M ♂' : 'F ♀'}
            </button>
          </div>

          {/* Muscle Highlight Legend */}
          {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
            <div className="hidden sm:flex items-center gap-2.5 bg-black/75 backdrop-blur-md border border-neutral-800 rounded-2xl px-3 py-1.5 text-[11px] shadow-lg">
              {primaryMuscles.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                  <span className="text-neutral-200 font-bold capitalize">
                    {primaryMuscles[0].replace(/(_l|_r)$/, '').replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
