import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sounds } from '../../utils/audio';
import {
  LoadedCharacter,
  createCharacterInstance,
  applyExerciseKinematics,
} from './characterLoader';
import { RotateCcw, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface Boxing3DModelProps {
  currentPunch?: number; // 1 to 6
  comboSequence?: number[];
  onPunchComplete?: (punchNumber: number) => void;
  height?: number | string;
  className?: string;
}

export const Boxing3DModel: React.FC<Boxing3DModelProps> = ({
  currentPunch = 0,
  comboSequence = [],
  onPunchComplete,
  height = '100%',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastPunchName, setLastPunchName] = useState<string>('Orthodox Guard');
  const [cameraView, setCameraView] = useState<'3q' | 'front' | 'side'>('3q');
  const [isLoading, setIsLoading] = useState(true);

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    char: LoadedCharacter | null;
    activeStrike: number;
    strikeProgress: number;
    targetCamPos: THREE.Vector3;
    isDragging: boolean;
    prevMousePos: { x: number; y: number };
    reqId: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    char: null,
    activeStrike: 0,
    strikeProgress: 0,
    targetCamPos: new THREE.Vector3(1.15, 0.15, 2.75),
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    reqId: null,
  });

  useEffect(() => {
    if (currentPunch > 0) {
      stateRef.current.activeStrike = currentPunch;
      stateRef.current.strikeProgress = 0;

      const punchNames: Record<number, string> = {
        1: '1: Lead Jab',
        2: '2: Power Cross',
        3: '3: Lead Left Hook',
        4: '4: Rear Right Hook',
        5: '5: Lead Left Uppercut',
        6: '6: Rear Right Uppercut',
      };
      setLastPunchName(punchNames[currentPunch] || 'Strike');

      if (currentPunch === 1) sounds.playPunchImpact('jab');
      else if (currentPunch === 2) sounds.playPunchImpact('cross');
      else if (currentPunch === 3 || currentPunch === 4) sounds.playPunchImpact('hook');
      else sounds.playPunchImpact('uppercut');
    }
  }, [currentPunch]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDisposed = false;
    const width = container.clientWidth || 360;
    const heightPx = container.clientHeight || 440;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0714); // Deep combat crimson/navy

    const camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 100);
    camera.position.set(1.15, 0.15, 2.75);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      console.warn('WebGL context creation failed in Boxing3DModel:', err);
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

    // Dynamic Arena Lighting
    const ambLight = new THREE.AmbientLight(0xffe4e6, 0.85);
    scene.add(ambLight);

    const redSpot = new THREE.SpotLight(0xef4444, 2.5);
    redSpot.position.set(3, 4, 3);
    redSpot.castShadow = true;
    scene.add(redSpot);

    const blueSpot = new THREE.SpotLight(0x38bdf8, 1.8);
    blueSpot.position.set(-3, 3, 2);
    scene.add(blueSpot);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Combat Canvas Platform (Grounded at y = -0.90)
    const ringFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.6, 0.08, 48),
      new THREE.MeshStandardMaterial({ color: 0x181024, roughness: 0.6, metalness: 0.3 })
    );
    ringFloor.position.y = -0.945;
    ringFloor.receiveShadow = true;
    scene.add(ringFloor);

    // Red Inner Target Ring
    const redRing = new THREE.Mesh(
      new THREE.RingGeometry(1.35, 1.40, 48),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    redRing.rotation.x = Math.PI / 2;
    redRing.position.y = -0.903;
    scene.add(redRing);

    stateRef.current.renderer = renderer;
    stateRef.current.scene = scene;
    stateRef.current.camera = camera;

    setIsLoading(true);
    createCharacterInstance('CHAR-M-01')
      .then((char) => {
        if (isDisposed) return;
        scene.add(char.scene);

        // Attach Pro Sparring Gloves to wrists
        const createGlove = () => {
          const g = new THREE.Group();
          const knuckle = new THREE.Mesh(
            new THREE.SphereGeometry(0.085, 16, 16),
            new THREE.MeshStandardMaterial({
              color: 0xdc2626, // Crimson red leather
              roughness: 0.35,
              metalness: 0.20,
            })
          );
          knuckle.scale.set(1.0, 1.25, 0.85);

          const cuff = new THREE.Mesh(
            new THREE.CylinderGeometry(0.065, 0.07, 0.06, 16),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 }) // White wrist tape
          );
          cuff.position.y = -0.06;
          g.add(knuckle, cuff);
          return g;
        };

        const lHand = char.bones.mixamorigLeftHand || char.bones['mixamorig:LeftHand'] || char.bones.handL;
        const rHand = char.bones.mixamorigRightHand || char.bones['mixamorig:RightHand'] || char.bones.handR;

        if (lHand) lHand.add(createGlove());
        if (rHand) rHand.add(createGlove());

        stateRef.current.char = char;
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Boxing character error:', err);
        setIsLoading(false);
      });

    // Orbit Drag
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      stateRef.current.isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      stateRef.current.prevMousePos = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!stateRef.current.isDragging || !stateRef.current.char) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - stateRef.current.prevMousePos.x;
      stateRef.current.char.scene.rotation.y += deltaX * 0.015;
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

    // KINETIC BOXING MOVEMENT LOOP
    let clock = 0;
    const animate = () => {
      clock += 0.035;
      const char = stateRef.current.char;
      const strike = stateRef.current.activeStrike;

      if (char) {
        if (strike > 0) {
          stateRef.current.strikeProgress += 0.14;
          const p = Math.min(1, stateRef.current.strikeProgress);

          const punchAnimMap: Record<number, string> = {
            1: 'box_jab',
            2: 'box_cross',
            3: 'box_left_hook',
            4: 'box_right_hook',
            5: 'box_left_uppercut',
            6: 'box_right_uppercut',
          };
          const punchType = punchAnimMap[strike] || 'box_jab';
          applyExerciseKinematics(char, punchType, Math.sin(p * Math.PI), clock);

          if (p >= 1) {
            stateRef.current.activeStrike = 0;
            stateRef.current.strikeProgress = 0;
            if (onPunchComplete) onPunchComplete(strike);
          }
        } else {
          // Dynamic Orthodox Guard Stance with rhythm bounce
          applyExerciseKinematics(char, 'box_guard', 0, clock);
        }
      }

      camera.position.lerp(stateRef.current.targetCamPos, 0.08);
      camera.lookAt(0, 0.05, 0);

      renderer.render(scene, camera);
      stateRef.current.reqId = requestAnimationFrame(animate);
    };

    stateRef.current.reqId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      if (stateRef.current.reqId) cancelAnimationFrame(stateRef.current.reqId);
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      container.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, []);

  const setViewAngle = (view: '3q' | 'front' | 'side') => {
    setCameraView(view);
    if (view === '3q') stateRef.current.targetCamPos.set(1.15, 0.15, 2.75);
    else if (view === 'front') stateRef.current.targetCamPos.set(0, 0.1, 2.85);
    else stateRef.current.targetCamPos.set(2.85, 0.1, 0.1);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const currentDist = stateRef.current.targetCamPos.length();
    const factor = direction === 'in' ? 0.85 : 1.15;
    const newDist = Math.max(1.7, Math.min(4.2, currentDist * factor));
    stateRef.current.targetCamPos.setLength(newDist);
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-b from-red-950/30 via-neutral-950 to-black ${className}`} style={{ height }}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-2" />
          <span className="text-xs font-mono font-bold text-neutral-300 tracking-wider uppercase">
            Loading Combat Boxer...
          </span>
        </div>
      )}

      {/* Top HUD: Punch Name & Camera Presets */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/40 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-red-200 uppercase">{lastPunchName}</span>
        </div>

        {/* Camera Views & Zoom */}
        <div className="flex items-center gap-1 bg-black/80 border border-neutral-800 backdrop-blur-md p-1 rounded-2xl pointer-events-auto shadow-lg">
          {(['3q', 'front', 'side'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewAngle(v)}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl uppercase transition ${
                cameraView === v ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {v === '3q' ? '3/4 Side' : v}
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
            onClick={() => setViewAngle('3q')}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition"
            title="Reset Angle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Combo Sequence Visualizer */}
      {comboSequence.length > 0 && (
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2 pointer-events-none z-10">
          <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-neutral-800 px-3 py-2 rounded-2xl shadow-xl">
            <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1">Combo:</span>
            {comboSequence.map((num, i) => (
              <span
                key={i}
                className={`w-7 h-7 flex items-center justify-center rounded-xl text-xs font-mono font-black transition-transform ${
                  currentPunch === num
                    ? 'bg-red-500 text-white scale-125 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                    : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                {num}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
