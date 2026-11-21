import React, { useState } from 'react';
import { UserProfile, WorkoutLog } from '../../types';
import { loginWithGoogle, logoutUser, auth } from '../../firebase';
import { User as FbUser } from 'firebase/auth';
import { Flame, Clock, Award, Shield, LogIn, LogOut, CheckCircle, Calendar, Dumbbell, Trophy, RefreshCw, Crown, Sparkles } from 'lucide-react';

interface ProfileScreenProps {
  userProfile: UserProfile;
  workoutLogs: WorkoutLog[];
  currentUser: FbUser | null;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenOnboarding: () => void;
  onOpenAdmin: () => void;
  onOpenAvatarCustomizer: () => void;
  onOpenSubscriptions: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  workoutLogs,
  currentUser,
  onUpdateProfile,
  onOpenOnboarding,
  onOpenAdmin,
  onOpenAvatarCustomizer,
  onOpenSubscriptions,
}) => {
  const [isEditingMetrics, setIsEditingMetrics] = useState<boolean>(false);
  const [weight, setWeight] = useState<number>(userProfile.weightKg || 70);
  const [height, setHeight] = useState<number>(userProfile.heightCm || 175);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSaveMetrics = () => {
    onUpdateProfile({
      weightKg: Number(weight),
      heightCm: Number(height),
    });
    setIsEditingMetrics(false);
  };

  const handleAuthAction = async () => {
    if (currentUser) {
      await logoutUser();
    } else {
      setIsSyncing(true);
      await loginWithGoogle();
      setIsSyncing(false);
    }
  };

  const isAdmin = currentUser?.email === 'kmrsahil9193@gmail.com';

  const totalCaloriesSum = workoutLogs.reduce((acc, log) => acc + log.caloriesBurned, 0);
  const totalMinutesSum = Math.round(workoutLogs.reduce((acc, log) => acc + log.durationSeconds, 0) / 60);

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-xl shadow-orange-500/20">
            <div className="w-full h-full rounded-[22px] bg-neutral-900 flex items-center justify-center text-2xl font-black text-white">
              {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {userProfile.displayName || 'Athlete'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                LVL {userProfile.level || 1}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {currentUser?.email || 'Local Athlete • Sync with Google'}
            </p>
          </div>
        </div>

        {/* Auth Button & Membership Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSubscriptions}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5" />
            {userProfile.subscription?.tier ? `${userProfile.subscription.tier.toUpperCase()} Plan` : 'Free Tier'}
          </button>

          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition"
            >
              Admin Panel
            </button>
          )}

          <button
            onClick={handleAuthAction}
            disabled={isSyncing}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
              currentUser
                ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20'
            }`}
          >
            {currentUser ? (
              <>
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                Sign in with Google
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Dashboard (PRD section 21: Progress System) */}
      <div className="space-y-3">
        <div className="text-xs uppercase font-black tracking-wider text-neutral-400 flex items-center justify-between">
          <span>THIS WEEK PROGRESS & STATS</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Firebase Synced
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-orange-500" />
              Workouts
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {workoutLogs.length}
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              Minutes
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {totalMinutesSum}
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Calories
            </div>
            <div className="text-2xl font-black text-orange-400 font-mono">
              {totalCaloriesSum} <span className="text-xs text-neutral-500">kcal</span>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              Streak
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {userProfile.streak} <span className="text-xs text-neutral-500">days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fitness Configuration & Physical Metrics (PRD page 4) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
            Athlete Profile & Training Setup
          </h3>
          <button
            onClick={onOpenOnboarding}
            className="text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            Re-run Questionnaire
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-800">
            <span className="text-neutral-500 block">Current Goal</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{userProfile.goal}</span>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-800">
            <span className="text-neutral-500 block">Fitness Level</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{userProfile.fitnessLevel}</span>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-800">
            <span className="text-neutral-500 block">Location</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{userProfile.workoutLocation}</span>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-800">
            <span className="text-neutral-500 block">Equipment</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{userProfile.equipment}</span>
          </div>
        </div>

        {/* 3D Character Avatar Selection & Personalizer */}
        <div className="pt-2 border-t border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-300 block">3D Biomechanics Avatar</span>
              <span className="text-[11px] text-neutral-500">
                Current: {userProfile.preferredCharacter || 'CHAR-M-01'} • Build: {userProfile.avatarConfig?.bodyPreset || 'Athletic'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[
                { id: 'CHAR-M-01', label: 'Male' },
                { id: 'CHAR-F-01', label: 'Female' },
              ].map((char) => (
                <button
                  key={char.id}
                  onClick={() => onUpdateProfile({ preferredCharacter: char.id as any })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    (userProfile.preferredCharacter || 'CHAR-M-01') === char.id
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {char.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenAvatarCustomizer}
            className="w-full py-2.5 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700/60 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            Customize 3D Body Proportions & Sliders
          </button>
        </div>

        {/* Body Measurements Edit */}
        <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {isEditingMetrics ? (
            <div className="flex items-center gap-3 w-full">
              <div>
                <label className="text-neutral-500 block text-[10px]">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-neutral-500 block text-[10px]">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-bold"
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleSaveMetrics}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-500 text-white font-bold"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingMetrics(false)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-neutral-500">Weight: </span>
                  <span className="font-bold text-white">{userProfile.weightKg || 70} kg</span>
                </div>
                <div>
                  <span className="text-neutral-500">Height: </span>
                  <span className="font-bold text-white">{userProfile.heightCm || 175} cm</span>
                </div>
              </div>

              <button
                onClick={() => setIsEditingMetrics(true)}
                className="text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Edit Measurements
              </button>
            </>
          )}
        </div>
      </div>

      {/* Workout History (PRD page 4 & 27) */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
          Recent Workout History
        </h3>

        {workoutLogs.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs">
            No completed workouts yet. Start a session from the Home tab to log your progress!
          </div>
        ) : (
          <div className="space-y-2.5">
            {workoutLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">{log.workoutName}</div>
                  <div className="text-xs text-neutral-400 flex items-center gap-2">
                    <span>{log.category}</span>
                    <span>•</span>
                    <span>{new Date(log.completedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-orange-400">
                    {Math.round(log.durationSeconds / 60)} min • {log.caloriesBurned} kcal
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {log.exerciseCount} exercises
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
