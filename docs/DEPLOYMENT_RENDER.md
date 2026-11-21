# Render Deployment Guide (FIT3D)

## 1. Service Type

Because FIT3D is a client-side React + Vite + Three.js SPA backed by Firebase Authentication and Cloud Firestore (`fit3d-db`), the accurate Render deployment target is a **Render Static Site** using the included [`render.yaml`](../render.yaml).

> Note: There is no custom Express backend server in this codebase, so a Render Node Web Service / `/health` HTTP server is not required.

---

## 2. Automatic Deployment via `render.yaml` (Blueprint)

1. Push this repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository. Render will automatically detect `render.yaml`:
   - **Service Name**: `fit3d-web`
   - **Runtime**: `static`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `./dist`
   - **Rewrite Rule**: `/*` → `/index.html`
   - **Security & Cache Headers**: Configured for `/models/*.glb` and `X-Content-Type-Options`
5. Click **Apply** to deploy.

---

## 3. Manual Static Site Setup (Alternative)

If creating the service manually in Render without Blueprints:
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `dist`
- **Redirect / Rewrite Rules**:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`

---

## 4. Post-Deployment Firebase Authorization

Once Render assigns your `https://fit3d-web.onrender.com` (or custom domain) URL:
1. Open [Firebase Console](https://console.firebase.google.com/) → Project `key-beacon-9ds98`.
2. Navigate to **Authentication → Settings → Authorized domains**.
3. Add `fit3d-web.onrender.com` (and any custom domain you attach in Render).
4. Verify HTTPS works and test Google Sign-In + Firestore reads/writes.
