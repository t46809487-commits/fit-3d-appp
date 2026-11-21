# Firebase & Database Documentation (FIT3D)

## 1. Overview

FIT3D uses **Google Firebase** as its Backend-as-a-Service (BaaS):
- **Project ID**: `key-beacon-9ds98`
- **Firestore Database ID**: `fit3d-db`
- **Authentication Provider**: Firebase Authentication (Google Sign-In via `signInWithPopup`)
- **Configuration File**: `firebase-applet-config.json` (public client SDK config)
- **Security Rules**: `firestore.rules`
- **Schema Blueprint (IR)**: `firebase-blueprint.json`

---

## 2. Firestore Data Model (`fit3d-db`)

| Collection Path | Owner / Access | Purpose |
| :--- | :--- | :--- |
| `/test/connection` | Public read (`allow read: if true`) | Boot-time connectivity check (`getDocFromServer`) |
| `/users/{userId}` | Owner (`request.auth.uid == userId`) or Admin | User profile, fitness goals, streak, XP, nutrition prefs, subscription summary |
| `/users/{userId}/workout_logs/{logId}` | Owner only | Completed workout & boxing combat logs |
| `/users/{userId}/favorites/{exerciseId}` | Owner only | Bookmarked exercises |
| `/users/{userId}/custom_workouts/{workoutId}` | Owner only | User-created routines |
| `/users/{userId}/avatarConfigurations/{avatarId}` | Owner only | Parametric 3D avatar customization settings |
| `/users/{userId}/subscriptions/{subscriptionId}` | Owner read/create; Owner/Admin update; Admin delete | Membership plan records |
| `/users/{userId}/meal_plans/{planId}` | Owner only | Saved meal plans |
| `/exercises/{exerciseId}` | Public read; Authenticated create; Admin or creator update/delete | Global & admin-published 3D exercises |
| `/admins/{adminId}` | Authenticated read; Admin write | Admin registry (alongside primary admin email `kmrsahil9193@gmail.com`) |

---

## 3. Deploying Security Rules Manually

If you move this project to your own Firebase CLI environment:

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Authenticate
firebase login

# Select project
firebase use key-beacon-9ds98

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

---

## 4. Security Notes

1. **Client Config vs Private Secrets**: Keys inside `firebase-applet-config.json` are public Firebase Web API identifiers meant to ship in browser bundles. Actual data protection is enforced server-side by `firestore.rules`.
2. **Never commit service account JSONs or Admin SDK private keys** (`*firebase-adminsdk*.json`) to GitHub.
3. **Authorized Domains**: When deploying to Hostinger, Render, or a custom domain, register the exact hostname under **Firebase Console → Authentication → Settings → Authorized domains**.
