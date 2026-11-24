import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Hanging heavy punching bag (built from simple shapes, no model file needed).
// It hangs from a pivot point, swings like a pendulum when hit() is called and
// slowly settles again. The swing is along the "forward" direction of the boxer.
// ---------------------------------------------------------------------------

export interface PunchingBag {
  /** Root group. Its position is the pivot (where the chain is fixed to the ceiling). */
  group: THREE.Group;
  height: number;
  radius: number;
  chain: number;
  /** Push the bag away from the boxer. strength ~ 0.6 (jab) .. 1.4 (power punch). */
  hit: (strength: number) => void;
  /** Call every frame with the elapsed seconds. */
  update: (dt: number) => void;
  /** Stop all swinging at once (used when a new drill starts). */
  reset: () => void;
  dispose: () => void;
}

export function createPunchingBag(
  /** Horizontal axis the bag swings around (the boxer's "left" direction). */
  swingAxis: THREE.Vector3,
  opts: { height?: number; radius?: number; chain?: number } = {}
): PunchingBag {
  const height = opts.height ?? 0.95;
  const radius = opts.radius ?? 0.17;
  const chain = opts.chain ?? 0.45;

  const group = new THREE.Group();
  const pendulum = new THREE.Group();
  group.add(pendulum);

  const mats: THREE.Material[] = [];
  const geos: THREE.BufferGeometry[] = [];
  const mat = (m: THREE.Material) => { mats.push(m); return m; };
  const geo = <T extends THREE.BufferGeometry>(g: T) => { geos.push(g); return g; };

  const leather = mat(new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45, metalness: 0.1 }));
  const strapMat = mat(new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 }));
  const metal = mat(new THREE.MeshStandardMaterial({ color: 0xb9c0cc, roughness: 0.3, metalness: 0.8 }));

  // Bag body (capsule = cylinder with rounded ends)
  const body = new THREE.Mesh(geo(new THREE.CapsuleGeometry(radius, Math.max(height - radius * 2, 0.1), 8, 20)), leather);
  body.position.y = -(chain + height / 2);
  body.castShadow = true;
  pendulum.add(body);

  // Straps around the bag
  for (const dy of [-0.28, 0, 0.28]) {
    const strap = new THREE.Mesh(geo(new THREE.TorusGeometry(radius + 0.003, 0.012, 8, 28)), strapMat);
    strap.rotation.x = Math.PI / 2;
    strap.position.y = body.position.y + dy * height;
    pendulum.add(strap);
  }

  // Chains (two thin rods from the top of the bag up to the pivot)
  const rodLen = chain + 0.02;
  for (const dx of [-0.07, 0.07]) {
    const rod = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.008, 0.008, rodLen, 8)), metal);
    rod.position.set(dx, -rodLen / 2 + 0.01, 0);
    pendulum.add(rod);
  }
  // Ring on top of the bag
  const topRing = new THREE.Mesh(geo(new THREE.TorusGeometry(0.05, 0.01, 8, 16)), metal);
  topRing.position.y = -chain + 0.01;
  topRing.rotation.y = Math.PI / 2;
  pendulum.add(topRing);

  // Ceiling mount (does not swing)
  const mount = new THREE.Mesh(geo(new THREE.BoxGeometry(0.34, 0.05, 0.12)), mat(new THREE.MeshStandardMaterial({ color: 0x3a3f4b, roughness: 0.5, metalness: 0.5 })));
  mount.position.y = 0.025;
  group.add(mount);

  // Pendulum physics: swing > 0 means the bag moves away from the boxer.
  let swing = 0;
  let vel = 0;
  const OMEGA = 4.6;   // natural frequency (rad/s)
  const DAMP = 1.15;   // damping (1/s)
  const axis = swingAxis.clone().normalize();
  const q = new THREE.Quaternion();

  const apply = () => {
    // Positive rotation about "left" tilts the bottom of the bag backwards, so use -swing.
    q.setFromAxisAngle(axis, -swing);
    pendulum.quaternion.copy(q);
  };

  return {
    group,
    height,
    radius,
    chain,
    hit(strength: number) {
      vel += Math.max(0.2, strength) * 2.3;
    },
    update(dt: number) {
      const step = Math.min(dt, 0.05);
      const sub = 4;
      const h = step / sub;
      for (let i = 0; i < sub; i++) {
        const acc = -OMEGA * OMEGA * swing - 2 * DAMP * vel;
        vel += acc * h;
        swing += vel * h;
      }
      swing = Math.max(-0.6, Math.min(0.6, swing));
      apply();
    },
    reset() {
      swing = 0;
      vel = 0;
      apply();
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      group.clear();
    },
  };
}
