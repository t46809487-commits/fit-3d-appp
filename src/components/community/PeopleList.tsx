import React, { useState } from 'react';
import { UserPlus, UserCheck, Flame, Dumbbell } from 'lucide-react';
import {
  CommunityProfile,
  isOnline,
  followUser,
  unfollowUser,
} from '../../services/community';
import { Avatar, TierBadge } from './PostCard';

interface PeopleListProps {
  profiles: CommunityProfile[];
  meId: string;
  following: string[];
}

export const PeopleList: React.FC<PeopleListProps> = ({ profiles, meId, following }) => {
  const [busyId, setBusyId] = useState<string | null>(null);

  // online first, then by XP
  const sorted = [...profiles]
    .filter((p) => p.userId !== meId)
    .sort((a, b) => {
      const ao = isOnline(a) ? 1 : 0;
      const bo = isOnline(b) ? 1 : 0;
      return bo - ao || (b.xp || 0) - (a.xp || 0);
    });

  const toggleFollow = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      if (following.includes(id)) await unfollowUser(meId, id);
      else await followUser(meId, id);
    } catch (e) {
      console.warn('Follow failed', e);
    } finally {
      setBusyId(null);
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="text-center text-sm text-neutral-500 py-10">
        Abhi koi aur member join nahi hua. Doston ko invite karo! 🥊
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((p) => {
        const isFollowing = following.includes(p.userId);
        const online = isOnline(p);
        return (
          <div key={p.userId} className="flex items-center gap-3 bg-neutral-900/70 border border-neutral-800 rounded-2xl p-3">
            <Avatar name={p.displayName} photo={p.photoURL} online={online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-white truncate">{p.displayName}</span>
                <TierBadge tier={p.tier} />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                <span>Lv {p.level}</span>
                <span className="inline-flex items-center gap-0.5">
                  <Flame className="w-3 h-3 text-orange-400" /> {p.streak}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Dumbbell className="w-3 h-3" /> {p.totalWorkouts}
                </span>
                <span className={online ? 'text-emerald-400 font-bold' : 'text-neutral-600'}>
                  {online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <button
              onClick={() => toggleFollow(p.userId)}
              disabled={busyId === p.userId}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition active:scale-95 ${
                isFollowing
                  ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  : 'bg-orange-600 text-white hover:bg-orange-500'
              }`}
            >
              {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
