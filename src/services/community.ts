import { db } from '../firebase';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  type Unsubscribe,
} from 'firebase/firestore';
import { UserProfile } from '../types';

// ---------------------------------------------------------------------------
// FIT3D Community (paid feature): posts, likes, comments, follow, online status.
// Everything lives in Firestore (the Firebase project that is already configured
// in firebase-applet-config.json). Access is limited by firestore.rules.
// ---------------------------------------------------------------------------

export const ONLINE_WINDOW_MS = 5 * 60 * 1000; // active in the last 5 min = online
export const HEARTBEAT_MS = 2 * 60 * 1000;
export const MAX_POST_CHARS = 500;
export const MAX_COMMENT_CHARS = 300;

export type PaidTier = 'pro' | 'elite';

export interface PostStats {
  workoutName?: string;
  durationMin?: number;
  calories?: number;
  streak?: number;
  totalWorkouts?: number;
  level?: number;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  authorLevel: number;
  authorTier: PaidTier;
  text: string;
  imageData?: string;
  stats?: PostStats;
  likedBy: string[];
  createdAt: number;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  text: string;
  createdAt: number;
}

export interface CommunityProfile {
  userId: string;
  displayName: string;
  photoURL: string | null;
  level: number;
  xp: number;
  streak: number;
  totalWorkouts: number;
  totalCalories: number;
  tier: PaidTier;
  joinedAt: number;
  lastActiveAt: number;
}

export interface FollowDoc {
  followerId: string;
  followingId: string;
  createdAt: number;
}

type ErrCb = (err: Error) => void;

/** Paid = Pro or Elite with an active, non-expired subscription. */
export function isPaidMember(profile?: UserProfile | null): boolean {
  const s = profile?.subscription;
  if (!s) return false;
  if (s.tier !== 'pro' && s.tier !== 'elite') return false;
  if (s.status !== 'active' && s.status !== 'trialing') return false;
  return !s.expiresAt || new Date(s.expiresAt).getTime() > Date.now();
}

export function isOnline(p?: CommunityProfile | null): boolean {
  return !!p && Date.now() - p.lastActiveAt < ONLINE_WINDOW_MS;
}

export function timeAgo(ms: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ms).toLocaleDateString();
}

// Firestore does not accept `undefined`, so drop those keys.
function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out as T;
}

// ------------------------------- Posts -------------------------------

export function subscribeFeed(
  onData: (posts: CommunityPost[]) => void,
  onError: ErrCb,
  max = 40
): Unsubscribe {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(max));
  return onSnapshot(
    q,
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const data = d.data() as Omit<CommunityPost, 'id'>;
          return { ...data, likedBy: data.likedBy || [], id: d.id };
        })
      ),
    (err) => onError(err)
  );
}

export async function createPost(
  data: Omit<CommunityPost, 'id' | 'likedBy' | 'createdAt'>
): Promise<void> {
  await addDoc(
    collection(db, 'posts'),
    clean({ ...data, likedBy: [] as string[], createdAt: Date.now() })
  );
}

export async function toggleLike(post: CommunityPost, uid: string): Promise<void> {
  const liked = post.likedBy.includes(uid);
  await updateDoc(doc(db, 'posts', post.id), {
    likedBy: liked ? arrayRemove(uid) : arrayUnion(uid),
  });
}

export async function deletePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId));
}

// ------------------------------ Comments ------------------------------

export function subscribeComments(
  postId: string,
  onData: (c: CommunityComment[]) => void,
  onError: ErrCb
): Unsubscribe {
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'), limit(100));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ ...(d.data() as Omit<CommunityComment, 'id'>), id: d.id }))),
    (err) => onError(err)
  );
}

export async function addComment(
  postId: string,
  c: Omit<CommunityComment, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(db, 'posts', postId, 'comments'), clean({ ...c, createdAt: Date.now() }));
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
}

// ------------------------------ Profiles ------------------------------

export function subscribeProfiles(
  onData: (p: CommunityProfile[]) => void,
  onError: ErrCb,
  max = 60
): Unsubscribe {
  const q = query(collection(db, 'profiles'), orderBy('lastActiveAt', 'desc'), limit(max));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data() as CommunityProfile)),
    (err) => onError(err)
  );
}

/** Creates the public profile (join) or refreshes level / streak / last-active (heartbeat). */
export async function upsertProfile(
  uid: string,
  p: UserProfile,
  photoURL: string | null,
  opts: { firstJoin?: boolean } = {}
): Promise<void> {
  const tier: PaidTier = p.subscription?.tier === 'elite' ? 'elite' : 'pro';
  const data: Record<string, unknown> = {
    userId: uid,
    displayName: (p.displayName || 'Athlete').slice(0, 60),
    photoURL: photoURL ?? null,
    level: p.level || 1,
    xp: p.xp || 0,
    streak: p.streak || 0,
    totalWorkouts: p.totalWorkouts || 0,
    totalCalories: p.totalCalories || 0,
    tier,
    lastActiveAt: Date.now(),
  };
  if (opts.firstJoin) data.joinedAt = Date.now();
  await setDoc(doc(db, 'profiles', uid), data, { merge: true });
}

// ------------------------------- Follow -------------------------------

export function subscribeFollowing(uid: string, onData: (ids: string[]) => void, onError: ErrCb): Unsubscribe {
  const q = query(collection(db, 'follows'), where('followerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => (d.data() as FollowDoc).followingId)),
    (err) => onError(err)
  );
}

export function subscribeFollowers(uid: string, onData: (ids: string[]) => void, onError: ErrCb): Unsubscribe {
  const q = query(collection(db, 'follows'), where('followingId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => (d.data() as FollowDoc).followerId)),
    (err) => onError(err)
  );
}

export async function followUser(uid: string, targetId: string): Promise<void> {
  await setDoc(doc(db, 'follows', `${uid}_${targetId}`), {
    followerId: uid,
    followingId: targetId,
    createdAt: Date.now(),
  });
}

export async function unfollowUser(uid: string, targetId: string): Promise<void> {
  await deleteDoc(doc(db, 'follows', `${uid}_${targetId}`));
}

// -------------------------------- Photo --------------------------------

/**
 * Shrinks a photo so it can be stored inside the post document
 * (no Firebase Storage needed). Result stays under ~200 KB.
 */
export function compressImage(file: File, maxSide = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Sirf image file chuno.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Photo read nahi ho payi.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Photo open nahi ho payi.'));
      img.onload = () => {
        let side = maxSide;
        let quality = 0.7;
        for (let attempt = 0; attempt < 6; attempt++) {
          const scale = Math.min(1, side / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Photo process nahi ho payi.'));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const out = canvas.toDataURL('image/jpeg', quality);
          if (out.length <= 200_000) {
            resolve(out);
            return;
          }
          side = Math.round(side * 0.8);
          quality = Math.max(0.4, quality - 0.08);
        }
        reject(new Error('Photo bahut badi hai, koi chhoti photo chuno.'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
