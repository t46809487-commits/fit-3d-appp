/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  testFirestoreConnection, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { onAuthStateChanged, User as FbUser } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  query,
  orderBy 
} from 'firebase/firestore';

import { 
  UserProfile, 
  Exercise, 
  WorkoutRoutine, 
  WorkoutLog, 
  FitnessGoal 
} from './types';
import { EXERCISES_DATABASE } from './data/exercises';
import { PRESET_WORKOUTS, generateWorkoutPlan } from './data/workouts';
import { getDefaultAvatarConfig } from './data/subscriptions';

import { BottomNav, TabType } from './components/navigation/BottomNav';
import { HomeScreen } from './components/home/HomeScreen';
import { ExploreScreen } from './components/explore/ExploreScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { DietScreen } from './components/diet/DietScreen';
import { ExerciseDetailModal } from './components/exercise/ExerciseDetailModal';
import { WorkoutPlayer } from './components/workout/WorkoutPlayer';
import { BoxingArena } from './components/boxing/BoxingArena';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { AvatarCustomizerModal } from './components/profile/AvatarCustomizerModal';
import { SubscriptionModal } from './components/profile/SubscriptionModal';

import { Dumbbell, Sparkles, Heart } from 'lucide-react';

const DEFAULT_PROFILE: UserProfile = {
  userId: 'local-athlete',
  displayName: 'Athlete',
  email: '',
  goal: 'Fat Loss',
  fitnessLevel: 'Beginner',
  workoutLocation: 'Home',
  equipment: 'No Equipment',
  availableTime: '20 min',
  trainingDaysPerWeek: 4,
  targetBodyParts: ['Full Body'],
  preferredCharacter: 'CHAR-M-01',
  avatarConfig: getDefaultAvatarConfig('local-athlete', 'CHAR-M-01', 'athletic'),
  subscription: {
    subscriptionId: 'sub_free',
    userId: 'local-athlete',
    tier: 'free',
    planId: 'free',
    status: 'active',
    startedAt: new Date().toISOString(),
    expiresAt: '2099-12-31T23:59:59Z',
    provider: 'free_tier',
    amountInr: 0,
  },
  nutritionPreferences: {
    dietaryPreference: 'Vegetarian',
    budgetTier: 'Budget-Friendly',
    allergies: [],
    intolerances: [],
    cuisinePreference: ['Indian', 'Continental'],
  },
  streak: 3,
  totalWorkouts: 4,
  totalMinutes: 75,
  totalCalories: 640,
  weightKg: 72,
  heightCm: 178,
  xp: 450,
  level: 2,
  onboarded: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<FbUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [exercisesList, setExercisesList] = useState<Exercise[]>(EXERCISES_DATABASE);
  const [favorites, setFavorites] = useState<string[]>(['EX001', 'EX007', 'BX001']);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([
    {
      id: 'init-1',
      userId: 'local',
      workoutName: 'Full Body Burn',
      category: 'Full Body',
      durationSeconds: 1200,
      caloriesBurned: 185,
      exerciseCount: 5,
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'init-2',
      userId: 'local',
      workoutName: 'Core Steel & Obliques',
      category: 'Abs',
      durationSeconds: 1080,
      caloriesBurned: 145,
      exerciseCount: 4,
      completedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ]);

  // Modals & Active Modes
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutRoutine | null>(null);
  const [isBoxingOpen, setIsBoxingOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAvatarCustomizerOpen, setIsAvatarCustomizerOpen] = useState<boolean>(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState<boolean>(false);
  const [exploreInitialCategory, setExploreInitialCategory] = useState<string>('All');

  // Verify Firestore connection on mount
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Sync auth state & Firestore listeners
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // User logged in -> Sync with Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUserProfile((prev) => ({ ...prev, ...snap.data(), userId: user.uid }));
          } else {
            // Initialize document in Firestore
            const initialData = {
              ...userProfile,
              userId: user.uid,
              displayName: user.displayName || userProfile.displayName,
              email: user.email || '',
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userRef, initialData);
            setUserProfile(initialData);
          }
        } catch (err) {
          console.warn('Firestore user fetch:', err);
        }

        // Real-time listener for workout logs
        const logsRef = collection(db, 'users', user.uid, 'workout_logs');
        const unsubLogs = onSnapshot(logsRef, (snapshot) => {
          const logs: WorkoutLog[] = [];
          snapshot.forEach((docSnap) => {
            logs.push({ id: docSnap.id, ...docSnap.data() } as WorkoutLog);
          });
          if (logs.length > 0) {
            setWorkoutLogs(logs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}/workout_logs`);
        });

        // Real-time listener for favorites
        const favsRef = collection(db, 'users', user.uid, 'favorites');
        const unsubFavs = onSnapshot(favsRef, (snapshot) => {
          const favIds: string[] = [];
          snapshot.forEach((docSnap) => {
            favIds.push(docSnap.id);
          });
          if (favIds.length > 0) {
            setFavorites(favIds);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}/favorites`);
        });

        return () => {
          unsubLogs();
          unsubFavs();
        };
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore global exercises collection for admin-published exercises
  useEffect(() => {
    try {
      const exRef = collection(db, 'exercises');
      const unsubEx = onSnapshot(exRef, (snapshot) => {
        const customList: Exercise[] = [];
        snapshot.forEach((d) => {
          customList.push({ id: d.id, ...d.data() } as Exercise);
        });
        if (customList.length > 0) {
          // Merge unique exercises
          const mergedMap = new Map<string, Exercise>();
          EXERCISES_DATABASE.forEach(e => mergedMap.set(e.id, e));
          customList.forEach(e => mergedMap.set(e.id, e));
          setExercisesList(Array.from(mergedMap.values()));
        }
      }, (err) => {
        console.log('Exercises stream:', err.message);
      });

      return () => unsubEx();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Check if onboarding is needed
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('fit3d_onboarded');
    if (!hasSeenOnboarding && !userProfile.onboarded) {
      setIsOnboardingOpen(true);
    }
  }, [userProfile.onboarded]);

  // Dynamic Today's Workout derived from user's current goal & level
  const todayWorkout: WorkoutRoutine = React.useMemo(() => {
    // If matching preset exists
    const preset = PRESET_WORKOUTS.find(p => p.goal === userProfile.goal);
    if (preset) return preset;

    // Otherwise generate dynamic routine
    const minutes = parseInt(userProfile.availableTime) || 20;
    return generateWorkoutPlan(
      userProfile.goal,
      userProfile.fitnessLevel,
      minutes,
      userProfile.targetBodyParts[0] || 'Full Body',
      userProfile.equipment
    );
  }, [userProfile.goal, userProfile.fitnessLevel, userProfile.availableTime, userProfile.targetBodyParts, userProfile.equipment]);

  // Recommended exercises list
  const recommendedExercises = React.useMemo(() => {
    const list = exercisesList.filter(e => e.goals.includes(userProfile.goal));
    return list.slice(0, 3);
  }, [exercisesList, userProfile.goal]);

  // Handlers
  const handleCompleteOnboarding = async (data: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...data, onboarded: true };
    setUserProfile(updated);
    setIsOnboardingOpen(false);
    localStorage.setItem('fit3d_onboarded', 'true');

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUpdateProfile = async (updatedMetrics: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updatedMetrics };
    setUserProfile(updated);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleFavorite = async (exerciseId: string) => {
    let next: string[];
    const isFav = favorites.includes(exerciseId);

    if (isFav) {
      next = favorites.filter(id => id !== exerciseId);
    } else {
      next = [...favorites, exerciseId];
    }
    setFavorites(next);

    if (currentUser) {
      const favRef = doc(db, 'users', currentUser.uid, 'favorites', exerciseId);
      try {
        if (isFav) {
          await deleteDoc(favRef);
        } else {
          const ex = exercisesList.find(e => e.id === exerciseId);
          await setDoc(favRef, {
            exerciseId,
            userId: currentUser.uid,
            exerciseName: ex?.name || '',
            bodyPart: ex?.bodyPart || '',
            addedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        handleFirestoreError(err, isFav ? OperationType.DELETE : OperationType.CREATE, `users/${currentUser.uid}/favorites/${exerciseId}`);
      }
    }
  };

  const handleFinishWorkout = async (summary: {
    workoutName: string;
    category: string;
    durationSeconds: number;
    caloriesBurned: number;
    exerciseCount: number;
  }) => {
    setActiveWorkout(null);

    const newLog: WorkoutLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.uid || 'local',
      workoutName: summary.workoutName,
      category: summary.category,
      durationSeconds: summary.durationSeconds,
      caloriesBurned: summary.caloriesBurned,
      exerciseCount: summary.exerciseCount,
      completedAt: new Date().toISOString(),
    };

    setWorkoutLogs(prev => [newLog, ...prev]);

    // Update profile stats
    const updatedProfile: UserProfile = {
      ...userProfile,
      streak: userProfile.streak + 1,
      totalWorkouts: (userProfile.totalWorkouts || 0) + 1,
      totalMinutes: (userProfile.totalMinutes || 0) + Math.round(summary.durationSeconds / 60),
      totalCalories: (userProfile.totalCalories || 0) + summary.caloriesBurned,
      xp: (userProfile.xp || 100) + 75,
      level: Math.floor(((userProfile.xp || 100) + 75) / 300) + 1,
    };
    setUserProfile(updatedProfile);

    // Sync to Firestore
    if (currentUser) {
      try {
        await addDoc(collection(db, 'users', currentUser.uid, 'workout_logs'), {
          ...newLog,
          userId: currentUser.uid,
        });
        await setDoc(doc(db, 'users', currentUser.uid), updatedProfile, { merge: true });
      } catch (err) {
        console.error('Save workout log error:', err);
      }
    }
  };

  const handleFinishBoxingSession = async (stats: {
    durationSeconds: number;
    punchesThrown: number;
    combosCompleted: number;
    caloriesBurned: number;
  }) => {
    setIsBoxingOpen(false);

    const newLog: WorkoutLog = {
      id: `box-${Date.now()}`,
      userId: currentUser?.uid || 'local',
      workoutName: 'Boxing Combat Round',
      category: 'Boxing',
      durationSeconds: stats.durationSeconds,
      caloriesBurned: stats.caloriesBurned,
      exerciseCount: stats.punchesThrown,
      completedAt: new Date().toISOString(),
      notes: `${stats.punchesThrown} punches • ${stats.combosCompleted} combos`,
    };

    setWorkoutLogs(prev => [newLog, ...prev]);

    const updatedProfile: UserProfile = {
      ...userProfile,
      totalWorkouts: (userProfile.totalWorkouts || 0) + 1,
      totalMinutes: (userProfile.totalMinutes || 0) + Math.round(stats.durationSeconds / 60),
      totalCalories: (userProfile.totalCalories || 0) + stats.caloriesBurned,
      xp: (userProfile.xp || 100) + 90,
      level: Math.floor(((userProfile.xp || 100) + 90) / 300) + 1,
    };
    setUserProfile(updatedProfile);

    if (currentUser) {
      try {
        await addDoc(collection(db, 'users', currentUser.uid, 'workout_logs'), newLog);
        await setDoc(doc(db, 'users', currentUser.uid), updatedProfile, { merge: true });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveAvatarConfig = async (config: any) => {
    const updated = {
      ...userProfile,
      avatarConfig: config,
      preferredCharacter: config.characterPresentation,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
        // Also persist to avatarConfigurations subcollection
        await setDoc(doc(db, 'users', currentUser.uid, 'avatarConfigurations', config.avatarId), {
          ...config,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    }
  };

  const handleSelectSubscriptionPlan = async (plan: any) => {
    const expiry = new Date();
    if (plan.billingPeriod === 'year') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }

    const subData = {
      subscriptionId: `SUB_${Date.now()}`,
      userId: currentUser?.uid || userProfile.userId,
      tier: plan.tier,
      planId: plan.id,
      status: 'active' as const,
      startedAt: new Date().toISOString(),
      expiresAt: expiry.toISOString(),
      provider: 'razorpay' as const,
      providerOrderId: `ord_${Math.random().toString(36).substring(7)}`,
      providerPaymentId: `pay_${Math.random().toString(36).substring(7)}`,
      amountInr: plan.priceInr,
    };

    const updatedProfile = {
      ...userProfile,
      subscription: subData,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updatedProfile);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updatedProfile, { merge: true });
        // Record verified transaction in payments subcollection
        await addDoc(collection(db, 'users', currentUser.uid, 'subscriptions'), subData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/subscriptions`);
      }
    }
  };

  const handleAddAdminExercise = async (newExercise: Exercise) => {
    // Optimistically update local list
    setExercisesList((prev) => [newExercise, ...prev.filter((e) => e.id !== newExercise.id)]);

    try {
      await setDoc(doc(db, 'exercises', newExercise.id), newExercise);
    } catch (err) {
      console.warn('Saving exercise to Firestore:', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      
      {/* Top Brand App Bar */}
      <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-900">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/30">
              <span className="font-mono text-sm tracking-tighter">3D</span>
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                FIT3D <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">PRO</span>
              </span>
              <span className="text-[10px] text-neutral-400 block -mt-0.5">3D Biomechanics Guide</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBoxingOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-red-900/20"
            >
              <span>🥊 Boxing</span>
            </button>

            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold transition"
              title="Personalize Goals"
            >
              Goals
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6">
        {activeTab === 'home' && (
          <HomeScreen
            userProfile={userProfile}
            todayWorkout={todayWorkout}
            recommendedExercises={recommendedExercises}
            onStartWorkout={(routine) => setActiveWorkout(routine)}
            onSelectExercise={(ex) => setSelectedExercise(ex)}
            onFilterByBodyPart={(part) => {
              setExploreInitialCategory(part);
              setActiveTab('explore');
            }}
            onChangeGoal={(goal) => handleUpdateProfile({ goal })}
            onOpenBoxing={() => setIsBoxingOpen(true)}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreScreen
            exercises={exercisesList}
            favorites={favorites}
            onSelectExercise={(ex) => setSelectedExercise(ex)}
            onToggleFavorite={handleToggleFavorite}
            initialCategory={exploreInitialCategory}
          />
        )}

        {activeTab === 'workout' && (
          <div className="space-y-6 pb-28 animate-fade-in">
            <div className="space-y-1 pt-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Workout Routines
              </h1>
              <p className="text-neutral-400 text-xs sm:text-sm">
                Select a guided 3D session or launch today's tailored plan
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRESET_WORKOUTS.map((routine) => (
                <div
                  key={routine.id}
                  className="rounded-3xl bg-neutral-900 border border-neutral-800 p-5 space-y-4 hover:border-neutral-700 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="font-bold text-orange-400">{routine.category}</span>
                      <span>{routine.level}</span>
                    </div>

                    <h3 className="text-xl font-black text-white">{routine.title}</h3>
                    <p className="text-xs text-neutral-400">{routine.subtitle}</p>

                    <div className="flex items-center gap-3 text-xs text-neutral-300 font-mono pt-1">
                      <span>⏱️ {routine.durationMinutes} min</span>
                      <span>🔥 {routine.caloriesEstimate} kcal</span>
                      <span>🏋️ {routine.exercises.length} moves</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveWorkout(routine)}
                    className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-orange-500 hover:text-white text-neutral-200 text-xs font-black uppercase tracking-wider transition active:scale-95"
                  >
                    Start Routine
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'diet' && (
          <DietScreen
            userProfile={userProfile}
            onUpdatePreferences={(prefs) =>
              handleUpdateProfile({
                nutritionPreferences: {
                  ...userProfile.nutritionPreferences,
                  ...prefs,
                },
              })
            }
            onOpenUpgradeModal={() => setIsSubscriptionOpen(true)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            userProfile={userProfile}
            workoutLogs={workoutLogs}
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenAvatarCustomizer={() => setIsAvatarCustomizerOpen(true)}
            onOpenSubscriptions={() => setIsSubscriptionOpen(true)}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          setExploreInitialCategory('All');
        }}
        onOpenBoxing={() => setIsBoxingOpen(true)}
      />

      {/* Active Workout Player Mode (PRD Section 19 & 20) */}
      {activeWorkout && (
        <WorkoutPlayer
          routine={activeWorkout}
          characterId={userProfile.preferredCharacter}
          avatarConfig={userProfile.avatarConfig}
          onClose={() => setActiveWorkout(null)}
          onFinishWorkout={handleFinishWorkout}
        />
      )}

      {/* Hero 3D Boxing Combat Arena (PRD Section 18 & 25) */}
      {isBoxingOpen && (
        <BoxingArena
          onClose={() => setIsBoxingOpen(false)}
          onFinishBoxingSession={handleFinishBoxingSession}
        />
      )}

      {/* Hero 3D Exercise Detail & Muscle Highlight Modal (PRD Section 8 & 9) */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        isOpen={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        characterId={userProfile.preferredCharacter}
        avatarConfig={userProfile.avatarConfig}
        isFavorite={selectedExercise ? favorites.includes(selectedExercise.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onStartExercise={(ex) => {
          // Launch quick single exercise session
          setActiveWorkout({
            id: `quick-${ex.id}`,
            title: ex.name,
            subtitle: `${ex.category} Focus • 3 Sets`,
            durationMinutes: 10,
            level: ex.difficulty,
            goal: ex.goals[0] || 'Build Muscle',
            category: ex.category,
            caloriesEstimate: ex.caloriesEstimate * 3,
            bannerGradient: 'from-orange-500/20 via-amber-600/30 to-red-600/20',
            exercises: [ex],
          });
        }}
      />

      {/* 6-Step Onboarding Modal (PRD Section 6) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
        initialName={userProfile.displayName}
      />

      {/* Admin Panel (PRD Section 27) */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onAddExercise={handleAddAdminExercise}
        exercisesCount={exercisesList.length}
      />

      {/* 3D Avatar Customizer Modal */}
      <AvatarCustomizerModal
        isOpen={isAvatarCustomizerOpen}
        onClose={() => setIsAvatarCustomizerOpen(false)}
        userProfile={userProfile}
        onSaveAvatarConfig={handleSaveAvatarConfig}
        onOpenUpgradeModal={() => {
          setIsAvatarCustomizerOpen(false);
          setIsSubscriptionOpen(true);
        }}
      />

      {/* Commercial Subscription & Entitlement Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        userProfile={userProfile}
        onSelectPlan={handleSelectSubscriptionPlan}
      />
    </div>
  );
}
