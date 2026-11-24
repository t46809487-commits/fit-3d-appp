import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User as FbUser } from 'firebase/auth';
import {
  Users, Lock, Crown, ImagePlus, X, Send, Loader2, Flame, Dumbbell, LogIn, AlertTriangle, Sparkles,
} from 'lucide-react';
import { UserProfile, WorkoutLog } from '../../types';
import { loginWithGoogle } from '../../firebase';
import {
  CommunityPost,
  CommunityProfile,
  PostStats,
  MAX_POST_CHARS,
  HEARTBEAT_MS,
  isPaidMember,
  isOnline,
  subscribeFeed,
  subscribeProfiles,
  subscribeFollowing,
  subscribeFollowers,
  upsertProfile,
  createPost,
  compressImage,
} from '../../services/community';
import { PostCard, Avatar } from './PostCard';
import { PeopleList } from './PeopleList';

interface CommunityScreenProps {
  userProfile: UserProfile;
  currentUser: FbUser | null;
  workoutLogs: WorkoutLog[];
  onOpenUpgrade: () => void;
}

type SubTab = 'feed' | 'people';
type FeedFilter = 'all' | 'following';

// ----------------------------- small states -----------------------------

const CenterCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="max-w-md mx-auto text-center bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 space-y-4">
    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-orange-600 to-red-500 flex items-center justify-center shadow-lg shadow-orange-600/30">
      {icon}
    </div>
    <h2 className="text-xl font-black text-white">{title}</h2>
    {children}
  </div>
);

const PERKS = [
  'Apni fitness journey posts, photos aur workout stats ke saath share karo',
  'Doosre members ko follow karo, like aur comment karo',
  'Dekho kaun online hai aur kaun streak me aage hai',
];

// ------------------------------- main -------------------------------

export const CommunityScreen: React.FC<CommunityScreenProps> = ({
  userProfile,
  currentUser,
  workoutLogs,
  onOpenUpgrade,
}) => {
  const paid = isPaidMember(userProfile);
  const uid = currentUser?.uid || '';

  const [subTab, setSubTab] = useState<SubTab>('feed');
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  // composer
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [attachStats, setAttachStats] = useState(false);
  const [attachWorkout, setAttachWorkout] = useState(false);
  const [posting, setPosting] = useState(false);
  const [composerError, setComposerError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const myProfile = profiles.find((p) => p.userId === uid);
  const joined = !!myProfile;
  const active = !!currentUser && paid;
  const photoURL = currentUser?.photoURL ?? null;
  // only real, saved workouts (not the demo entries shown to new users)
  const lastWorkout = workoutLogs.find((w) => w.userId !== 'local');

  const onStreamError = (err: Error) => {
    console.warn('Community stream error:', err);
    setError(
      /permission|insufficient/i.test(err.message)
        ? 'permission'
        : err.message
    );
  };

  // Live data (only for logged-in paid members)
  useEffect(() => {
    if (!active) return;
    setError('');
    const unsubs = [
      subscribeFeed((p) => { setPosts(p); setFeedLoaded(true); }, onStreamError),
      subscribeProfiles((p) => { setProfiles(p); setProfilesLoaded(true); }, onStreamError),
      subscribeFollowing(uid, setFollowing, onStreamError),
      subscribeFollowers(uid, setFollowers, onStreamError),
    ];
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, uid]);

  // "Online" heartbeat + keep level / streak fresh on my public profile
  useEffect(() => {
    if (!active || !joined) return;
    const beat = () => upsertProfile(uid, userProfile, photoURL).catch(() => {});
    beat();
    const t = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, joined, uid, userProfile.level, userProfile.streak, userProfile.totalWorkouts]);

  const profileMap = useMemo(() => {
    const m = new Map<string, CommunityProfile>();
    profiles.forEach((p) => m.set(p.userId, p));
    return m;
  }, [profiles]);

  const visiblePosts = useMemo(
    () =>
      filter === 'following'
        ? posts.filter((p) => p.authorId === uid || following.includes(p.authorId))
        : posts,
    [posts, filter, following, uid]
  );

  const onlineCount = profiles.filter((p) => isOnline(p)).length;

  // ----------------------------- gates -----------------------------

  if (!currentUser) {
    return (
      <CenterCard icon={<Users className="w-8 h-8 text-white" />} title="FIT3D Community">
        <ul className="text-left text-sm text-neutral-300 space-y-2">
          {PERKS.map((p) => (
            <li key={p} className="flex gap-2"><Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />{p}</li>
          ))}
        </ul>
        <p className="text-xs text-neutral-500">Community use karne ke liye pehle Google se login karo.</p>
        <button
          onClick={() => loginWithGoogle()}
          className="w-full py-3.5 rounded-2xl bg-white text-neutral-900 font-black flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <LogIn className="w-5 h-5" /> Login with Google
        </button>
      </CenterCard>
    );
  }

  if (!paid) {
    return (
      <CenterCard icon={<Lock className="w-8 h-8 text-white" />} title="Community = Pro feature">
        <ul className="text-left text-sm text-neutral-300 space-y-2">
          {PERKS.map((p) => (
            <li key={p} className="flex gap-2"><Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />{p}</li>
          ))}
        </ul>
        <p className="text-xs text-neutral-500">
          Ye feature FIT3D Pro aur Elite members ke liye hai. Pro sirf ₹299/month se shuru.
        </p>
        <button
          onClick={onOpenUpgrade}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-red-500 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 active:scale-95 transition"
        >
          <Crown className="w-5 h-5" /> Upgrade to Pro
        </button>
      </CenterCard>
    );
  }

  if (error === 'permission') {
    return (
      <CenterCard icon={<AlertTriangle className="w-8 h-8 text-white" />} title="Rules update chahiye">
        <p className="text-sm text-neutral-300">
          Firestore ne access roka. Iska matlab naye <code className="text-orange-300">firestore.rules</code> abhi
          Firebase me publish nahi hue (ya tumhara subscription Firestore me save nahi hua).
        </p>
        <p className="text-xs text-neutral-500">
          Firebase Console → Firestore → database <b>fit3d-db</b> → Rules → nayi rules paste karke Publish karo.
        </p>
      </CenterCard>
    );
  }

  const handleJoin = async () => {
    setJoining(true);
    try {
      await upsertProfile(uid, userProfile, photoURL, { firstJoin: true });
    } catch (e) {
      console.warn(e);
      setError('permission');
    } finally {
      setJoining(false);
    }
  };

  if (profilesLoaded && !joined) {
    return (
      <CenterCard icon={<Users className="w-8 h-8 text-white" />} title="Community join karo">
        <ul className="text-left text-sm text-neutral-300 space-y-2">
          {PERKS.map((p) => (
            <li key={p} className="flex gap-2"><Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />{p}</li>
          ))}
        </ul>
        <p className="text-xs text-neutral-500">
          Join karne par doosre members ko tumhara <b>naam, photo, level, streak aur workout count</b> dikhega.
          Email aur health details public nahi hote.
        </p>
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-red-500 text-white font-black flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition"
        >
          {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />} Join Community
        </button>
      </CenterCard>
    );
  }

  // ---------------------------- composer ----------------------------

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    setComposerError('');
    try {
      setImage(await compressImage(file));
    } catch (e) {
      setComposerError(e instanceof Error ? e.message : 'Photo add nahi ho payi.');
    }
  };

  const canPost = (text.trim().length > 0 || !!image) && !posting;

  const submitPost = async () => {
    if (!canPost) return;
    setPosting(true);
    setComposerError('');

    const stats: PostStats = {};
    if (attachWorkout && lastWorkout) {
      stats.workoutName = lastWorkout.workoutName;
      stats.durationMin = Math.max(1, Math.round(lastWorkout.durationSeconds / 60));
      stats.calories = lastWorkout.caloriesBurned;
    }
    if (attachStats) {
      stats.streak = userProfile.streak;
      stats.totalWorkouts = userProfile.totalWorkouts || 0;
      stats.level = userProfile.level;
    }

    try {
      await createPost({
        authorId: uid,
        authorName: (userProfile.displayName || currentUser.displayName || 'Athlete').slice(0, 60),
        authorPhoto: photoURL,
        authorLevel: userProfile.level || 1,
        authorTier: userProfile.subscription?.tier === 'elite' ? 'elite' : 'pro',
        text: text.trim(),
        ...(image ? { imageData: image } : {}),
        ...(Object.keys(stats).length ? { stats } : {}),
      });
      setText('');
      setImage(null);
      setAttachStats(false);
      setAttachWorkout(false);
    } catch (e) {
      console.warn(e);
      setComposerError('Post nahi ho payi. Internet ya rules check karo.');
    } finally {
      setPosting(false);
    }
  };

  const me = {
    uid,
    name: (userProfile.displayName || currentUser.displayName || 'Athlete').slice(0, 60),
    photo: photoURL,
  };

  // ------------------------------ render ------------------------------

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" /> Community
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            <span className="text-emerald-400 font-bold">● {onlineCount} online</span> • {profiles.length} members •{' '}
            {followers.length} followers • {following.length} following
          </p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2 p-1 bg-neutral-900 rounded-2xl border border-neutral-800">
        {(['feed', 'people'] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
              subTab === t ? 'bg-orange-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t === 'feed' ? 'Feed' : 'People'}
          </button>
        ))}
      </div>

      {error && error !== 'permission' && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{error}</div>
      )}

      {subTab === 'people' ? (
        <PeopleList profiles={profiles} meId={uid} following={following} />
      ) : (
        <>
          {/* Composer */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-4 space-y-3">
            <div className="flex gap-3">
              <Avatar name={me.name} photo={photoURL} online size={40} />
              <textarea
                value={text}
                maxLength={MAX_POST_CHARS}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="Apni fitness journey share karo..."
                className="flex-1 min-w-0 resize-none bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
              />
            </div>

            {image && (
              <div className="relative">
                <img src={image} alt="Preview" className="w-full max-h-64 object-cover rounded-2xl border border-neutral-800" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  pickPhoto(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-1.5 transition"
              >
                <ImagePlus className="w-4 h-4" /> Photo
              </button>
              {lastWorkout && (
                <button
                  onClick={() => setAttachWorkout((v) => !v)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    attachWorkout ? 'bg-orange-600 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                  }`}
                >
                  <Dumbbell className="w-4 h-4" /> Last workout
                </button>
              )}
              <button
                onClick={() => setAttachStats((v) => !v)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  attachStats ? 'bg-orange-600 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                }`}
              >
                <Flame className="w-4 h-4" /> My stats
              </button>
              <span className="ml-auto text-[10px] text-neutral-600">{text.length}/{MAX_POST_CHARS}</span>
              <button
                onClick={submitPost}
                disabled={!canPost}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-500 disabled:opacity-40 text-white text-sm font-black flex items-center gap-1.5 active:scale-95 transition"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
              </button>
            </div>
            {composerError && <div className="text-xs text-red-400">{composerError}</div>}
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'following'] as FeedFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  filter === f
                    ? 'bg-white text-neutral-900'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'Everyone' : 'Following'}
              </button>
            ))}
          </div>

          {/* Feed */}
          {!feedLoaded ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="text-center text-sm text-neutral-500 py-10">
              {filter === 'following'
                ? 'Following ki koi post nahi. People tab se kisi ko follow karo!'
                : 'Abhi koi post nahi. Pehli post tum karo! 💪'}
            </div>
          ) : (
            <div className="space-y-3">
              {visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} me={me} authorProfile={profileMap.get(post.authorId)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
