# FIT3D System & Deployment Architecture

## 1. Deployment Architecture Diagram

```text
+-------------------------------------------------------------------+
|                        USER BROWSER / CLIENT                      |
|  React 19 + TypeScript + Tailwind CSS v4 + Three.js (WebGL)       |
|  - Loads 3D Character GLB (/models/CHAR-M-01.glb)                 |
|  - Procedural Anatomical Rig Fallback (anatomicalRig.ts)          |
|  - Web Audio API Sound & Speech Coaching                          |
+----------------------+-------------------------------+------------+
                       |                               |
          Static Assets|HTTPS                          | HTTPS / WSS
          (HTML/JS/GLB)|                               | (Firebase Web SDK)
                       v                               v
+--------------------------------------+  +-------------------------------+
|       STATIC CDN / WEB HOSTING       |  |    GOOGLE FIREBASE PLATFORM   |
|  Option A: Hostinger Shared/Cloud    |  |  Project: key-beacon-9ds98    |
|   - public_html/ <- dist/            |  |                               |
|   - .htaccess (SPA fallback + .glb)  |  |  1. Firebase Authentication     |
|                                      |  |     - Google OAuth Popup      |
|  Option B: Render Static Site        |  |     - Authorized Domains List |
|   - render.yaml                      |  |                               |
|   - Publish Path: ./dist             |  |  2. Cloud Firestore (fit3d-db)|
|   - Rewrite: /* -> /index.html       |  |     - Enforced by             |
+--------------------------------------+  |       firestore.rules         |
                                          +-------------------------------+
```

---

## 2. Module & File Inventory

### Present Modules
1. **Web Application (`/` root)**
   - **3D Rendering & Biomechanics (`src/components/3d/`)**:
     - `Human3DModel.tsx`: Three.js WebGLRenderer, studio lighting, podium, orbit drag, zoom, skeleton X-Ray helper, and phase loop (`START_POSITION` -> `ECCENTRIC_LOAD` -> `PEAK_CONTRACTION` -> `CONCENTRIC_RETURN` -> `REP_COMPLETE`).
     - `Boxing3DModel.tsx`: Combat stance, jab/cross/hook/uppercut kinematics, impact audio triggers.
     - `characterLoader.ts`: Singleton GLB loader for `/models/CHAR-M-01.glb`, per-instance `SkeletonUtils.clone`, anatomical muscle vertex classification, vertex-color highlighting, and exercise joint kinematics.
     - `anatomicalRig.ts`: Procedural Three.js `SkinnedMesh` fallback rig.
   - **Application Screens & Modals (`src/components/`)**:
     - `HomeScreen.tsx`, `ExploreScreen.tsx`, `ExerciseDetailModal.tsx`, `WorkoutPlayer.tsx`, `BoxingArena.tsx`, `DietScreen.tsx`, `ProfileScreen.tsx`, `AvatarCustomizerModal.tsx`, `SubscriptionModal.tsx`, `OnboardingModal.tsx`, `AdminPanel.tsx`, `BottomNav.tsx`, `ErrorBoundary.tsx`.
   - **Domain Datasets (`src/data/`)**:
     - `exercises.ts`, `workouts.ts`, `nutrition.ts`, `subscriptions.ts`.
   - **Firebase Client Integration (`src/firebase.ts`)**:
     - Initializes Firebase App, `getFirestore(app, 'fit3d-db')`, `getAuth(app)`, `GoogleAuthProvider`, and `testFirestoreConnection()` via `getDocFromServer`.

### Absent Modules (Explicitly Identified — Not Fabricated)
- **`/android-app`**: Not present in this repository. There are no Kotlin, Java, Jetpack Compose, `AndroidManifest.xml`, or Gradle files.
- **`/backend`**: No custom Node.js/Express server is implemented (`server.ts` does not exist). Although `express`, `dotenv`, `tsx`, and `@google/genai` exist in `package.json` from the project template, the live application runs entirely client-side with Firebase Authentication and Cloud Firestore (`fit3d-db`).
