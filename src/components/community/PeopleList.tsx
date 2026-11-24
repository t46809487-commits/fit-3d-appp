import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Trash2, Send, Flame, Dumbbell, Clock, Crown, Loader2 } from 'lucide-react';
import {
  CommunityPost,
  CommunityComment,
  CommunityProfile,
  MAX_COMMENT_CHARS,
  isOnline,
  timeAgo,
  toggleLike,
  deletePost,
  subscribeComments,
  addComment,
  deleteComment,
} from '../../services/community';

// ---------------------------------------------------------------------------
export const Avatar: React.FC<{
  name: string;
  photo?: string | null;
  online?: boolean;
  size?: number;
}> = ({ name, photo, online, size = 40 }) => (
  <div className="relative shrink-0" style={{ width: size, height: size }}>
    {photo ? (
      <img
        src={photo}
        alt={name}
        referrerPolicy="no-referrer"
        className="w-full h-full rounded-full object-cover border border-neutral-800"
      />
    ) : (
      <div
        className="w-full h-full rounded-full bg-gradient-to-tr from-orange-600 to-red-500 flex items-center justify-center font-black text-white"
        style={{ fontSize: size * 0.42 }}
      >
        {(name || '?').trim().charAt(0).toUpperCase()}
      </div>
    )}
    {online && (
      <span
        className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-950"
        title="Online"
      />
    )}
  </div>
);

export const TierBadge: React.FC<{ tier: 'pro' | 'elite' }> = ({ tier }) => (
  <span
    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
      tier === 'elite'
        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
        : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
    }`}
  >
    <Crown className="w-2.5 h-2.5" /> {tier}
  </span>
);

// ---------------------------------------------------------------------------
interface CommentsProps {
  postId: string;
  postAuthorId: string;
  me: { uid: string; name: string; photo: string | null };
}

const Comments: React.FC<CommentsProps> = ({ postId, postAuthorId, me }) => {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = subscribeComments(
      postId,
      (list) => {
        setComments(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [postId]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setError('');
    try {
      await addComment(postId, { authorId: me.uid, authorName: me.name, authorPhoto: me.photo, text: t });
      setText('');
    } catch (e) {
      setError('Comment post nahi ho paya. Dobara try karo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-neutral-800/70 space-y-3">
      {loading && <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />}
      {!loading && comments.length === 0 && (
        <div className="text-xs text-neutral-500">Abhi koi comment nahi. Pehle ban jao!</div>
      )}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2">
          <Avatar name={c.authorName} photo={c.authorPhoto} size={28} />
          <div className="flex-1 min-w-0 bg-neutral-800/60 rounded-2xl px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white truncate">{c.authorName}</span>
              <span className="text-[10px] text-neutral-500 shrink-0">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="text-sm text-neutral-200 break-words whitespace-pre-wrap">{c.text}</p>
          </div>
          {(c.authorId === me.uid || postAuthorId === me.uid) && (
            <button
              onClick={() => deleteComment(postId, c.id).catch(() => setError('Delete nahi hua.'))}
              className="self-center p-1.5 text-neutral-600 hover:text-red-400 transition"
              title="Delete comment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          value={text}
          maxLength={MAX_COMMENT_CHARS}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Comment likho..."
          className="flex-1 min-w-0 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------
interface PostCardProps {
  post: CommunityPost;
  me: { uid: string; name: string; photo: string | null };
  authorProfile?: CommunityProfile;
  isAdmin?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, me, authorProfile, isAdmin }) => {
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);
  const liked = post.likedBy.includes(me.uid);
  const canDelete = post.authorId === me.uid || !!isAdmin;
  const s = post.stats;

  const like = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await toggleLike(post, me.uid);
    } catch (e) {
      console.warn('Like failed', e);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Ye post delete karni hai?')) return;
    try {
      await deletePost(post.id);
    } catch (e) {
      alert('Post delete nahi ho payi.');
    }
  };

  return (
    <article className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-4">
      <header className="flex items-start gap-3">
        <Avatar name={post.authorName} photo={post.authorPhoto} online={isOnline(authorProfile)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm truncate">{post.authorName}</span>
            <TierBadge tier={post.authorTier} />
          </div>
          <div className="text-[11px] text-neutral-500">
            Lv {post.authorLevel} • {timeAgo(post.createdAt)}
          </div>
        </div>
        {canDelete && (
          <button onClick={remove} className="p-1.5 text-neutral-600 hover:text-red-400 transition" title="Delete post">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </header>

      {post.text && <p className="mt-3 text-sm text-neutral-100 whitespace-pre-wrap break-words">{post.text}</p>}

      {s && (
        <div className="mt-3 flex flex-wrap gap-2">
          {s.workoutName && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-300">
              <Dumbbell className="w-3.5 h-3.5" /> {s.workoutName}
            </span>
          )}
          {s.durationMin != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-200">
              <Clock className="w-3.5 h-3.5" /> {s.durationMin} min
            </span>
          )}
          {s.calories != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-200">
              🔥 {s.calories} kcal
            </span>
          )}
          {s.streak != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-200">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> {s.streak} day streak
            </span>
          )}
          {s.totalWorkouts != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-200">
              {s.totalWorkouts} workouts
            </span>
          )}
          {s.level != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-200">
              Level {s.level}
            </span>
          )}
        </div>
      )}

      {post.imageData && (
        <img
          src={post.imageData}
          alt="Post"
          className="mt-3 w-full max-h-96 object-cover rounded-2xl border border-neutral-800"
          loading="lazy"
        />
      )}

      <footer className="mt-3 flex items-center gap-4">
        <button
          onClick={like}
          className={`flex items-center gap-1.5 text-sm font-bold transition active:scale-90 ${
            liked ? 'text-red-500' : 'text-neutral-400 hover:text-red-400'
          }`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} /> {post.likedBy.length}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className={`flex items-center gap-1.5 text-sm font-bold transition ${
            showComments ? 'text-orange-400' : 'text-neutral-400 hover:text-orange-300'
          }`}
        >
          <MessageCircle className="w-5 h-5" /> Comments
        </button>
      </footer>

      {showComments && <Comments postId={post.id} postAuthorId={post.authorId} me={me} />}
    </article>
  );
};
