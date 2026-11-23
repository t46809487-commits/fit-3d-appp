import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MuscleName, CharacterModelId, AnimationState, AvatarConfiguration } from '../../types';
import {
  LoadedCharacter,
  createCharacterInstance,
  applyExerciseKinematics,
  updateMuscleHighlights,
} from './characterLoader';
import { Bone, RotateCcw, Play, Pause, Zap, Info, ShieldCheck, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

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
  interactive?: boolean;
  onMuscleClick?: (muscle: MuscleName) => void;
  onStateChange?: (state: AnimationState) => void;
}

// ---------------------------------------------------------------------------
// PRD Section 11 - 3D Model States: IDLE -> START -> MOVEMENT -> END -> REVERSE -> REPEAT
// One rep = one full cycle. Cycle length matches the old sine wave (2*PI in animTime units).
// phase: 0 = start posture, 1 = end posture (peak contraction).
// ---------------------------------------------------------------------------
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
  interactive = true,
  onMuscleClick,
  onStateChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<'3q' | 'front' | 'side' | 'back'>('3q');
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
    targetCamPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    isDragging: boolean;
    prevMousePos: { x: number; y: number };
    animTime: number;
    reqId: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    char: null,
    skeletonHelper: null,
    targetCamPos: new THREE.Vector3(1.15, 0.15, 2.75),
    targetLookAt: new THREE.Vector3(0, 0.05, 0),
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
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
    scene.background = new THREE.Color(0xe9ebee);

    // Perspective Camera: 38 deg FOV framing full body with safe margins
    const camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 100);
    camera.position.set(1.15, 0.15, 2.75);

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

    // Light podium with orange accent ring (PRD: one strong accent color)
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.3, 0.08, 40),
      new THREE.MeshStandardMaterial({ color: 0xd3d6da, roughness: 0.8, metalness: 0.0 })
    );
    platform.position.y = -0.945;
    platform.receiveShadow = true;
    scene.add(platform);

    const guideRing = new THREE.Mesh(
      new THREE.RingGeometry(1.16, 1.20, 48),
      new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
    );
    guideRing.rotation.x = Math.PI / 2;
    guideRing.position.y = -0.903;
    scene.add(guideRing);

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

        // Apply initial muscle highlights
        updateMuscleHighlights(char, primaryMuscles, secondaryMuscles);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Character instantiation error:', err);
        setIsLoading(false);
      });

    // Orbit Drag Controls
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      stateRef.current.isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      stateRef.current.prevMousePos = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive || !stateRef.current.isDragging || !stateRef.current.char) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - stateRef.current.prevMousePos.x;
      stateRef.current.char.scene.rotation.y += deltaX * 0.014;
      stateRef.current.prevMousePos = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      stateRef.current.isDragging = false;
    };

    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    container.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentDist = stateRef.current.targetCamPos.length();
      const newDist = Math.max(1.7, Math.min(4.2, currentDist + e.deltaY * 0.0025));
      stateRef.current.targetCamPos.setLength(newDist);
    };
    container.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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
      }

      // Smooth camera interpolation
      camera.position.lerp(stateRef.current.targetCamPos, 0.09);
      camera.lookAt(stateRef.current.targetLookAt);

      renderer.render(scene, camera);
      stateRef.current.reqId = requestAnimationFrame(animate);
    };

    stateRef.current.reqId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      if (stateRef.current.reqId) cancelAnimationFrame(stateRef.current.reqId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      container.removeEventListener('wheel', handleWheel);
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

  // Camera presets
  const setCameraPreset = (view: '3q' | 'front' | 'side' | 'back') => {
    setActiveView(view);
    const char = stateRef.current.char;
    if (char) char.scene.rotation.set(0, 0, 0);

    switch (view) {
      case '3q':
        stateRef.current.targetCamPos.set(1.15, 0.15, 2.75);
        break;
      case 'front':
        stateRef.current.targetCamPos.set(0, 0.1, 2.85);
        break;
      case 'side':
        stateRef.current.targetCamPos.set(2.85, 0.1, 0.1);
        break;
      case 'back':
        stateRef.current.targetCamPos.set(0, 0.1, -2.85);
        break;
    }
  };

  const handleResetCamera = () => {
    setCameraPreset('3q');
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const currentDist = stateRef.current.targetCamPos.length();
    const factor = direction === 'in' ? 0.85 : 1.15;
    const newDist = Math.max(1.7, Math.min(4.2, currentDist * factor));
    stateRef.current.targetCamPos.setLength(newDist);
  };

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
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

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

      {/* Top Right: Camera Presets, Zoom & Reset Camera */}
      {showControls && (
        <div className="absolute top-3 right-3 flex items-center bg-black/75 backdrop-blur-md border border-neutral-800 rounded-2xl p-1 gap-1 z-10 shadow-lg">
          {(['3q', 'front', 'side', 'back'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCameraPreset(view)}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl uppercase transition-all ${
                activeView === view
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              {view === '3q' ? '3/4' : view}
            </button>
          ))}

          <div className="h-4 w-px bg-neutral-800 mx-0.5" />

          <button
            onClick={() => handleZoom('in')}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleZoom('out')}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition"
            title="Reset Camera (Full Body 3/4 Frame)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
