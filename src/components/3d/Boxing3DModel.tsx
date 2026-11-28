import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sounds } from '../../utils/audio';
import { CharacterModelId, AvatarConfiguration } from '../../types';
import {
  LoadedCharacter,
  createCharacterInstance,
  applyExerciseKinematics,
} from './characterLoader';
import { createPunchingBag, PunchingBag } from './punchingBag';
import { PUNCHES } from '../../data/boxingWorkout';
import { Loader2 } from 'lucide-react';
import { createBoxingGlove } from './boxing/boxingThree';
import { MOVES, isBoxingMove } from './boxing/boxingMoves';

// ---------------------------------------------------------------------------
// Auto-performing 3D boxer (same idea as Human3DModel for the other exercises):
//   - you give it a sequence of punches, e.g. [1, 2, 3]
//   - the boxer throws them BY ITSELF in that order (1st, 2nd, 3rd), goes back to
//     guard, and repeats until the drill changes
//   - if useBag is true a heavy bag hangs in front and swings when it is hit
// The camera is fixed (no drag / zoom), like in all the other exercises.
// ---------------------------------------------------------------------------

interface Boxing3DModelProps {
  /** Punch numbers in order. Empty array = guard stance only. */
  sequence: number[];
  useBag: boolean;
  isPaused?: boolean;
  speed?: number;
  characterId?: CharacterModelId;
  avatarConfig?: AvatarConfiguration;
  height?: number | string;
  className?: string;
  onReady?: () => void;
  /** Fired when a punch starts. index = position inside the sequence (0 = 1st punch), -1 = back in guard. */
  onPunchStart?: (index: number, punchNumber: number) => void;
  /** Fired every time the whole sequence has been thrown once. */
  onSequenceComplete?: () => void;
  /** Move Lab: loop one punch / footwork / defence move instead of playing the sequence. */
  move?: string;
  /** Change this number to restart the current move from its first frame. */
  restartKey?: number;
}

const FLOOR_Y = -0.905;
const PUNCH_TIME = 0.8;   // seconds for one punch (out and back)
const PEAK_AT = 0.4;      // fraction of the punch where the fist lands
const START_DELAY = 0.6;  // guard time before the first punch of a drill
const BAG_H = 0.95;
const BAG_R = 0.17;
const BAG_CHAIN = 0.45;
const GLOVE_REACH = 0.19; // how far the glove sticks out past the wrist
const UP = new THREE.Vector3(0, 1, 0);

const smoothStep = (x: number) => x * x * (3 - 2 * x);
// 0 -> 1 fast (punch out), then 1 -> 0 smooth (retract)
const punchShape = (p: number) =>
  p < PEAK_AT
    ? 1 - Math.pow(1 - p / PEAK_AT, 2)
    : 1 - smoothStep((p - PEAK_AT) / (1 - PEAK_AT));

interface Reach { fwd: number; y: number }

export const Boxing3DModel: React.FC<Boxing3DModelProps> = ({
  sequence,
  useBag,
  isPaused = false,
  speed = 1,
  characterId = 'CHAR-M-01',
  avatarConfig,
  height = '100%',
  className = '',
  onReady,
  onPunchStart,
  onSequenceComplete,
  move,
  restartKey = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Latest props for the animation loop (the loop is created only once)
  const propsRef = useRef({ sequence, useBag, isPaused, speed, onReady, onPunchStart, onSequenceComplete, move });
  propsRef.current = { sequence, useBag, isPaused, speed, onReady, onPunchStart, onSequenceComplete, move };

  // Drill playback state
  const playRef = useRef({ cursor: -START_DELAY, lastIdx: -1, impacted: false });
  // Bag state (set after the character is measured)
  const bagRef = useRef<{
    bag: PunchingBag;
    reach: Record<number, Reach>;
    origin: THREE.Vector3;
    forward: THREE.Vector3;
    dist: number;
    y: number;
    initialised: boolean;
  } | null>(null);

  // A new drill (or bag on/off) restarts the sequence from the 1st punch
  const seqKey = sequence.join(',') + '|' + (useBag ? 'bag' : 'air') + '|' + (move ?? '') + '|' + restartKey;
  useEffect(() => {
    playRef.current = { cursor: -START_DELAY, lastIdx: -1, impacted: false };
    bagRef.current?.bag.reset();
  }, [seqKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDisposed = false;
    const width = container.clientWidth || 360;
    const heightPx = container.clientHeight || 440;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0714);

    const camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 100);
    camera.position.set(2.5, 0.4, 2.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      console.warn('WebGL context creation failed in Boxing3DModel:', err);
      setIsLoading(false);
      return;
    }
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);

    // Arena lighting
    scene.add(new THREE.AmbientLight(0xffe4e6, 0.85));
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

    // Training floor
    const ringFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.8, 0.08, 56),
      new THREE.MeshStandardMaterial({ color: 0x181024, roughness: 0.6, metalness: 0.3 })
    );
    ringFloor.position.y = FLOOR_Y - 0.04;
    ringFloor.receiveShadow = true;
    scene.add(ringFloor);

    const redRing = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.56, 56),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    redRing.rotation.x = Math.PI / 2;
    redRing.position.y = FLOOR_Y + 0.003;
    scene.add(redRing);

    let char: LoadedCharacter | null = null;
    const lookAt = new THREE.Vector3(0, 0.05, 0);
    let fitBox: THREE.Box3 | null = null;
    let camDir = new THREE.Vector3(1, 0.15, 1).normalize();

    const getBone = (name: string): THREE.Bone | undefined =>
      char ? char.bones['mixamorig' + name] || char.bones['mixamorig:' + name] : undefined;

    // Put the (fixed) camera far enough away that the whole fit box is visible
    const fitCamera = () => {
      if (!fitBox) return;
      const center = fitBox.getCenter(new THREE.Vector3());
      const corners: THREE.Vector3[] = [];
      for (const x of [fitBox.min.x, fitBox.max.x])
        for (const y of [fitBox.min.y, fitBox.max.y])
          for (const z of [fitBox.min.z, fitBox.max.z]) corners.push(new THREE.Vector3(x, y, z));
      let d = 1.6;
      for (let i = 0; i < 200; i++) {
        camera.position.copy(center).addScaledVector(camDir, d);
        camera.lookAt(center);
        camera.updateMatrixWorld(true);
        const fits = corners.every((c) => {
          const n = c.clone().project(camera);
          return Math.abs(n.x) <= 0.9 && Math.abs(n.y) <= 0.86;
        });
        if (fits) break;
        d *= 1.03;
      }
      lookAt.copy(center);
    };

    setIsLoading(true);
    createCharacterInstance(characterId, avatarConfig)
      .then((c) => {
        if (isDisposed) return;
        char = c;
        scene.add(c.scene);

        // Red boxing gloves on both hands (sized in metres, placed along the hand)
        getBone('LeftHand')?.add(createBoxingGlove(c, 'L'));
        getBone('RightHand')?.add(createBoxingGlove(c, 'R'));

        // ---- Measure the boxer once: which way he faces and how far each punch reaches ----
        applyExerciseKinematics(c, 'box_guard', 0, 0);
        c.scene.updateMatrixWorld(true);
        const origin = (getBone('Hips') as THREE.Object3D).getWorldPosition(new THREE.Vector3());
        const forward = new THREE.Vector3(0, 0, 1)
          .applyQuaternion(c.scene.getWorldQuaternion(new THREE.Quaternion()));
        forward.y = 0;
        forward.normalize();
        const left = new THREE.Vector3().crossVectors(UP, forward).normalize();

        const bodyBox = new THREE.Box3();
        const tmp = new THREE.Vector3();
        const addBones = () => {
          c.scene.updateMatrixWorld(true);
          Object.values(c.bones).forEach((b) => {
            b.getWorldPosition(tmp);
            bodyBox.expandByPoint(tmp);
          });
        };
        addBones();

        const reach: Record<number, Reach> = {};
        for (const n of [1, 2, 3, 4, 5, 6]) {
          let best: Reach | null = null;
          for (const ph of [0.5, 1]) {
            applyExerciseKinematics(c, PUNCHES[n].animationType, ph, 0);
            addBones();
            if (ph === 1) {
              for (const side of ['LeftHand', 'RightHand']) {
                const h = getBone(side);
                if (!h) continue;
                const pos = h.getWorldPosition(new THREE.Vector3());
                const fwd = pos.clone().sub(origin).dot(forward);
                if (!best || fwd > best.fwd) best = { fwd, y: pos.y };
              }
            }
          }
          reach[n] = best ?? { fwd: 0.5, y: 0.1 };
        }
        applyExerciseKinematics(c, 'box_guard', 0, 0);
        c.scene.updateMatrixWorld(true);

        // Punching bag (hangs in front of the boxer, swings along his forward direction)
        const bag = createPunchingBag(left, { height: BAG_H, radius: BAG_R, chain: BAG_CHAIN });
        bag.group.visible = false;
        scene.add(bag.group);
        bagRef.current = { bag, reach, origin, forward, dist: 0.9, y: 0.1, initialised: false };

        // Camera box = body in every punch + the bag at its nearest and farthest position
        const fb = bodyBox.clone();
        const dists = Object.values(reach).map((r) => bagTargetOf(r).dist);
        const ys = Object.values(reach).map((r) => bagTargetOf(r).y);
        for (const dd of [Math.min(...dists), Math.max(...dists)]) {
          const cx = origin.x + forward.x * dd;
          const cz = origin.z + forward.z * dd;
          const top = Math.max(...ys) + BAG_H / 2 + BAG_CHAIN + 0.1;
          const bottom = Math.min(...ys) - BAG_H / 2;
          fb.expandByPoint(new THREE.Vector3(cx - BAG_R - 0.25, bottom, cz - BAG_R - 0.25));
          fb.expandByPoint(new THREE.Vector3(cx + BAG_R + 0.25, top, cz + BAG_R + 0.25));
        }
        fb.expandByScalar(0.12);
        fb.expandByPoint(new THREE.Vector3(origin.x, FLOOR_Y, origin.z));
        fitBox = fb;

        // Camera: from the boxer's left side, a little in front -> he faces the bag
        camDir = new THREE.Vector3()
          .addScaledVector(left, 1.0)
          .addScaledVector(forward, 0.5)
          .addScaledVector(UP, 0.12)
          .normalize();
        fitCamera();

        setIsLoading(false);
        propsRef.current.onReady?.();
      })
      .catch((err) => {
        console.error('Boxing character error:', err);
        setIsLoading(false);
      });

    // Where the bag has to hang so the fist lands on it
    function bagTargetOf(r: Reach) {
      const frontDist = Math.max(r.fwd + GLOVE_REACH - 0.02, 0.5);
      return { dist: frontDist + BAG_R, y: Math.max(-0.15, Math.min(0.3, r.y)) };
    }
    const bagTargetForSequence = (seq: number[]) => {
      const st = bagRef.current;
      if (!st) return { dist: 0.9, y: 0.1 };
      const rs = seq.map((n) => st.reach[n]).filter(Boolean);
      if (!rs.length) return { dist: 0.9, y: 0.1 };
      const fwd = Math.max(...rs.map((r) => r.fwd));
      const y = rs.reduce((a, r) => a + r.y, 0) / rs.length;
      return bagTargetOf({ fwd, y });
    };

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      fitCamera();
    };
    window.addEventListener('resize', handleResize);

    // ---- Animation loop ----
    let last = performance.now();
    let guardClock = 0;
    let reqId = 0;

    const animate = (time: number) => {
      const dt = Math.min((time - last) / 1000, 0.1);
      last = time;
      const p = propsRef.current;
      const play = playRef.current;

      if (char) {
        if (!p.isPaused) {
          guardClock += dt;
          play.cursor += dt * p.speed;
        }

        const seq = p.sequence;
        if (p.move && isBoxingMove(p.move)) {
          // Move Lab: loop one move (punches are thrown out-and-back with a short guard pause)
          const lab = Math.max(0, play.cursor + START_DELAY);
          if (MOVES[p.move].kind === 'punch') {
            const local = (lab % (PUNCH_TIME + 0.6)) / PUNCH_TIME;
            applyExerciseKinematics(char, p.move, local < 1 ? punchShape(local) : 0, guardClock);
          } else {
            applyExerciseKinematics(char, p.move, 0, lab);
          }
        } else if (seq.length === 0 || play.cursor < 0) {
          applyExerciseKinematics(char, 'box_guard', 0, guardClock);
        } else {
          const n = seq.length;
          const resetGap = n === 1 ? 0.3 : 0.7;
          const total = n * PUNCH_TIME + resetGap;

          if (play.cursor >= total) {
            play.cursor -= total;
            play.lastIdx = -1;
            play.impacted = false;
            p.onSequenceComplete?.();
          }

          const idx = Math.floor(play.cursor / PUNCH_TIME);
          if (idx < n) {
            const local = (play.cursor - idx * PUNCH_TIME) / PUNCH_TIME;
            const punch = seq[idx];
            if (idx !== play.lastIdx) {
              play.lastIdx = idx;
              play.impacted = false;
              p.onPunchStart?.(idx, punch);
            }
            if (!play.impacted && local >= PEAK_AT) {
              play.impacted = true;
              sounds.playPunchImpact(PUNCHES[punch].sound);
              if (p.useBag) bagRef.current?.bag.hit(PUNCHES[punch].power);
            }
            applyExerciseKinematics(char, PUNCHES[punch].animationType, punchShape(local), guardClock);
          } else {
            if (play.lastIdx !== n) {
              play.lastIdx = n;
              p.onPunchStart?.(-1, 0);
            }
            applyExerciseKinematics(char, 'box_guard', 0, guardClock);
          }
        }
        char.scene.updateMatrixWorld(true);
      }

      // Bag: slide to the right distance for this drill and swing
      const bs = bagRef.current;
      if (bs) {
        bs.bag.group.visible = p.useBag;
        if (p.useBag) {
          const target = bagTargetForSequence(p.sequence);
          if (!bs.initialised) {
            bs.dist = target.dist;
            bs.y = target.y;
            bs.initialised = true;
          } else {
            const k = Math.min(1, dt * 5);
            bs.dist += (target.dist - bs.dist) * k;
            bs.y += (target.y - bs.y) * k;
          }
          bs.bag.group.position.set(
            bs.origin.x + bs.forward.x * bs.dist,
            bs.y + BAG_H / 2 + BAG_CHAIN,
            bs.origin.z + bs.forward.z * bs.dist
          );
          bs.bag.update(dt);
        }
      }

      camera.lookAt(lookAt);
      renderer.render(scene, camera);
      reqId = requestAnimationFrame(animate);
    };
    reqId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      bagRef.current?.bag.dispose();
      bagRef.current = null;
      renderer.dispose();
    };
  }, [characterId, avatarConfig]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-b from-red-950/30 via-neutral-950 to-black ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full" />

      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-2" />
          <span className="text-xs font-mono font-bold text-neutral-300 tracking-wider uppercase">
            Loading Combat Boxer...
          </span>
        </div>
      )}
    </div>
  );
};
