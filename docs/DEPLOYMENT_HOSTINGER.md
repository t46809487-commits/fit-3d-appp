# Hostinger Deployment Guide (FIT3D)

## 1. Hosting Plan Requirement

**Recommended Plan: Hostinger Shared Web Hosting (or Cloud Hosting)**  
**VPS Required? No.**

Why: FIT3D compiles via Vite into pure static browser assets (`dist/index.html`, JS/CSS bundles, `dist/models/CHAR-M-01.glb`, and `dist/.htaccess`). All authentication and database operations execute directly against Google Firebase (`fit3d-db`), so no Node.js server process needs to run on Hostinger.

> **Important Note on Android APKs:** Native Android APK/AAB files cannot execute on web hosting servers. Hostinger serves the React + Three.js web application.

---

## 2. Build the Production Bundle Locally

```bash
npm ci
npm run lint
npm run build
```

This generates the production folder `./dist` containing:
- `dist/index.html`
- `dist/assets/*`
- `dist/models/CHAR-M-01.glb`
- `dist/.htaccess` (automatically copied from `public/.htaccess`)

---

## 3. Deploy to Hostinger (`public_html`)

### Option A: File Manager Upload (Fastest)
1. Zip the **contents** of the `dist/` folder (so `index.html` and `.htaccess` are at the top level of the zip, not nested inside a `dist/` subfolder).
2. Log in to **Hostinger hPanel** → **Websites** → **Manage** → **Files** → **File Manager**.
3. Open `public_html/` (clear any default `default.php` placeholder).
4. Upload the zip and extract it directly into `public_html/`.
5. Verify `.htaccess` is visible in `public_html/` (enable "Show hidden files" in File Manager settings if needed).

### Option B: Git / SSH Deployment (If SSH is enabled on your plan)
1. Build `dist/` locally or via CI.
2. Upload via `rsync` or `scp`:
   ```bash
   rsync -avz --delete dist/ user@your-hostinger-ip:~/domains/yourdomain.com/public_html/
   ```

---

## 4. Domain, HTTPS & `.htaccess` Configuration

1. **SSL/HTTPS**: In **Hostinger hPanel → Security → SSL**, install and enable **Force HTTPS** for your domain.
2. **SPA Routing & 3D `.glb` Support**: `public/.htaccess` (copied to `dist/.htaccess`) configures:
   - Fallback of non-file routes to `index.html` (`mod_rewrite`).
   - `model/gltf-binary` MIME type for `.glb` 3D character assets.
   - Browser cache headers for static JS/CSS/GLB files.
3. **Firebase Authorized Domains (Mandatory for Google Sign-In)**:
   - Open [Firebase Console](https://console.firebase.google.com/) → Project `key-beacon-9ds98`.
   - Go to **Authentication → Settings → Authorized domains**.
   - Click **Add domain** and add `yourdomain.com` and `www.yourdomain.com`.
   - Without this step, Google Sign-In (`signInWithPopup`) will be rejected with `auth/unauthorized-domain`.
