# FIT3D — 3D Exercise Guide & Workout Coach

Interactive 3D biomechanics fitness platform built with **React 19**, **TypeScript**, **Three.js**, **Tailwind CSS v4**, **Vite 8**, and **Firebase (Authentication & Cloud Firestore)**.

---

## Architecture & Repository Audit (Important)

Before deploying or importing into external tooling, note the **actual** technology stack present in this codebase:

| Component | Status in Repository | Actual Technology |
| :--- | :--- | :--- |
| **Web Frontend** | **Present (Root `/`)** | React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Three.js (`CHAR-M-01.glb` + procedural rig fallback) |
| **Database & Auth** | **Present (Firebase BaaS)** | Firebase Authentication (Google Sign-In) + Cloud Firestore (`fit3d-db`), governed by `firestore.rules` and `firebase-blueprint.json` |
| **Custom Backend Server** | **Not Used / Not Present** | All persistence & auth communicate directly from the browser to Firebase. (`express`, `dotenv`, `@google/genai`, and `tsx` exist in `package.json` from the base template but are not currently imported or wired to a server entrypoint.) |
| **Native Android App** | **Not Present** | There are **no** Kotlin, Java, Jetpack Compose, `AndroidManifest.xml`, or Gradle files in this repository. Native Android APK/AAB builds cannot be compiled directly from this web repository without either wrapping the web build (TWA / Capacitor) or creating a separate native Kotlin project. |

> The root project structure (`src/`, `public/`, `index.html`, `package.json`) is preserved intact so Vite development, GitHub Actions CI, Hostinger static deployment, and Render Static Site deployment work out of the box without duplicating files.

---

## Key Features Preserved

- **3D Biomechanics Engine (`src/components/3d/`)**:
  - `Human3DModel.tsx` & `Boxing3DModel.tsx`: Interactive Three.js WebGL viewports with camera presets (`3q`, `front`, `side`, `back`), zoom, orbit drag, skeleton X-Ray toggle, and playback speed controls.
  - `characterLoader.ts`: Loads `/public/models/CHAR-M-01.glb` via `GLTFLoader` + `SkeletonUtils.clone`, classifies vertices into anatomical muscle groups, applies primary/secondary muscle highlighting, and executes exercise kinematics.
  - `anatomicalRig.ts`: Connected procedural rigged mesh fallback if GLB loading fails.
- **Exercise Encyclopedia & Guided Workout Player**:
  - `ExploreScreen.tsx`, `ExerciseDetailModal.tsx`, `WorkoutPlayer.tsx`, `src/data/exercises.ts`, `src/data/workouts.ts`.
  - Synthesized Web Audio cues & speech coaching (`src/utils/audio.ts`).
- **3D Boxing Combat Arena (`src/components/boxing/BoxingArena.tsx`)**:
  - Guard stance, jab, cross, hooks, uppercuts, combo tracking, round timer, and impact audio.
- **Personalized Profile, Avatar Customizer, Nutrition & Subscriptions**:
  - 6-step onboarding (`OnboardingModal.tsx`), parametric avatar configuration (`AvatarCustomizerModal.tsx`), Indian & continental meal planning (`DietScreen.tsx`, `src/data/nutrition.ts`), membership tier UI (`SubscriptionModal.tsx`, `src/data/subscriptions.ts`), and Admin Exercise Publisher (`AdminPanel.tsx`).
- **Firebase Persistence (`src/firebase.ts`)**:
  - Real-time Firestore listeners (`onSnapshot`) for `workout_logs`, `favorites`, and global `exercises` in database `fit3d-db`.

---

## Project Structure

```text
.
├── .github/workflows/ci.yml      # GitHub Actions: tsc --noEmit + vite build check
├── docs/
│   ├── ARCHITECTURE.md           # System & deployment architecture diagram
│   ├── DATABASE_FIREBASE.md      # Firestore fit3d-db schema, rules & setup
│   ├── DEPLOYMENT_HOSTINGER.md   # Hostinger Shared/Cloud Hosting deployment guide
│   └── DEPLOYMENT_RENDER.md      # Render Static Site deployment guide
├── public/
│   ├── .htaccess                 # Apache/LiteSpeed SPA routing & .glb MIME/cache headers
│   └── models/CHAR-M-01.glb      # Rigged 3D humanoid asset
├── src/
│   ├── components/
│   │   ├── 3d/                   # Three.js engine, GLB loader, procedural fallback rig
│   │   ├── admin/                # AdminPanel for publishing exercises
│   │   ├── boxing/               # BoxingArena combat mode
│   │   ├── common/               # ErrorBoundary
│   │   ├── diet/                 # DietScreen nutrition planner & coach chat
│   │   ├── exercise/             # ExerciseDetailModal
│   │   ├── explore/              # ExploreScreen catalog & muscle filters
│   │   ├── home/                 # HomeScreen dashboard
│   │   ├── navigation/           # BottomNav
│   │   ├── onboarding/           # 6-step OnboardingModal
│   │   ├── profile/              # ProfileScreen, AvatarCustomizerModal, SubscriptionModal
│   │   └── workout/              # WorkoutPlayer guided timer & form cues
│   ├── data/                     # exercises.ts, workouts.ts, nutrition.ts, subscriptions.ts
│   ├── types/index.ts            # TypeScript domain interfaces
│   ├── utils/audio.ts            # Web Audio API sound effects & speech synthesis
│   ├── App.tsx                   # Root state, Auth/Firestore sync, modal orchestration
│   ├── firebase.ts               # Firebase initialization & error wrapper
│   ├── index.css                 # Tailwind CSS v4 entry
│   └── main.tsx                  # React root + ErrorBoundary
├── .env.example                  # Environment variable documentation
├── .gitignore                    # GitHub ignore rules (excludes dist, node_modules, .env*, *.zip)
├── firebase-applet-config.json   # Firebase Web SDK public client configuration
├── firebase-blueprint.json       # Firestore data model blueprint (IR)
├── firestore.rules               # Zero-trust Firestore security rules
├── index.html                    # HTML entry point & meta tags
├── metadata.json                 # App metadata
├── package.json                  # Dependencies & npm scripts
├── render.yaml                   # Render Static Site blueprint
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite + React + Tailwind v4 configuration
```

---

## Local Installation & Running

### Prerequisites
- **Node.js** `>= 20` (tested on Node `22.x`)
- **npm** `>= 10`

### Setup & Commands
```bash
# 1. Install dependencies
npm install

# 2. (Optional) Copy environment reference if using custom tooling
cp .env.example .env

# 3. Start local development server (runs on http://localhost:3000)
npm run dev

# 4. Run TypeScript static typecheck
npm run lint

# 5. Build production static bundle into ./dist
npm run build

# 6. Preview production build locally
npm run preview
```

---

## Deployment Overview

Because FIT3D builds to static HTML/JS/CSS and `.glb` assets (`dist/`) and uses **Firebase BaaS** for authentication and database storage:

1. **Hostinger (Shared or Cloud Hosting)**: Supported directly — no VPS required. Upload the contents of `dist/` (including `dist/.htaccess`) into `public_html/`. See [`docs/DEPLOYMENT_HOSTINGER.md`](./docs/DEPLOYMENT_HOSTINGER.md).
2. **Render (Static Site)**: Supported via `render.yaml` (`npm ci && npm run build`, publish directory `./dist`, SPA rewrite `/* -> /index.html`). See [`docs/DEPLOYMENT_RENDER.md`](./docs/DEPLOYMENT_RENDER.md).
3. **Firebase (`fit3d-db`)**: Add your Hostinger/Render domain to **Firebase Console → Authentication → Settings → Authorized domains** so Google Sign-In popups succeed in production. See [`docs/DATABASE_FIREBASE.md`](./docs/DATABASE_FIREBASE.md).
4. **Android Distribution**: Since no native Kotlin source exists in this repo, to publish on Android you can either:
   - Wrap the live HTTPS deployment (Hostinger/Render) as a **Trusted Web Activity (TWA)** / **PWA** (requires adding a `manifest.webmanifest` + Service Worker and Bubblewrap/Android Studio wrapper), OR
   - Wrap the Vite `dist/` bundle using **Capacitor** (`@capacitor/android`) to generate an Android Studio Gradle project (`APK`/`AAB`), OR
   - Build a separate native Kotlin/Jetpack Compose client connecting to the same Firebase project (`key-beacon-9ds98`, database `fit3d-db`).
