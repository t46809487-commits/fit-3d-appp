import React, { useState } from 'react';
import { Exercise, MuscleName, BodyPartCategory, FitnessGoal, FitnessLevel, EquipmentType } from '../../types';
import { X, Plus, Trash2, CheckCircle, Shield, Database, Sparkles } from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exercise: Exercise) => Promise<void>;
  exercisesCount: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  onAddExercise,
  exercisesCount,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'exercises' | 'subscriptions'>('exercises');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BodyPartCategory>('Chest');
  const [goal, setGoal] = useState<FitnessGoal>('Build Muscle');
  const [difficulty, setDifficulty] = useState<FitnessLevel>('Beginner');
  const [equipment, setEquipment] = useState<EquipmentType>('No Equipment');
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleName>('mid_chest');
  const [secondaryMuscle, setSecondaryMuscle] = useState<MuscleName>('triceps');
  const [animationType, setAnimationType] = useState('pushup');
  const [instructionsText, setInstructionsText] = useState('1. Form proper stance.\n2. Execute full range of motion.\n3. Return under control.');
  const [commonMistakesText, setCommonMistakesText] = useState('Arching back, rushing repetition.');
  const [breathingText, setBreathingText] = useState('Inhale down, exhale driving up.');
  const [reps, setReps] = useState(12);
  const [sets, setSets] = useState(3);
  const [restSeconds, setRestSeconds] = useState(45);
  const [caloriesEstimate, setCaloriesEstimate] = useState(35);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const newEx: Exercise = {
      id: `CUST_${Date.now()}`,
      name,
      category,
      goals: [goal],
      bodyPart: category,
      difficulty,
      equipment: [equipment],
      primaryMuscles: [primaryMuscle],
      secondaryMuscles: [secondaryMuscle],
      movementPattern: `${category} Kinematics`,
      instructions: instructionsText.split('\n').filter((l) => l.trim().length > 0),
      commonMistakes: commonMistakesText.split('\n').filter((l) => l.trim().length > 0),
      breathingPattern: breathingText,
      animationId: `ex_${animationType}_rep`,
      animationType,
      characterId: 'CHAR-M-01',
      tempo: '2-0-2',
      reps: Number(reps),
      sets: Number(sets),
      restSeconds: Number(restSeconds),
      caloriesEstimate: Number(caloriesEstimate),
      isCustom: true,
    };

    try {
      await onAddExercise(newEx);
      setSuccessMsg(true);
      setName('');
      setTimeout(() => setSuccessMsg(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const muscleList: MuscleName[] = [
    'upper_chest', 'mid_chest', 'lower_chest',
    'lats', 'traps', 'lower_back',
    'biceps', 'triceps', 'forearms',
    'abs', 'obliques', 'lower_abs',
    'quads', 'hamstrings', 'glutes', 'calves',
    'front_delts', 'side_delts', 'rear_delts'
  ];

  const animationList = [
    { id: 'pushup', label: 'Push-Up Kinematics' },
    { id: 'squat', label: 'Squat Biomechanics' },
    { id: 'bicep_curl', label: 'Bicep Curl Flexion' },
    { id: 'overhead_press', label: 'Overhead Press' },
    { id: 'lunges', label: 'Lunge Extension' },
    { id: 'crunch', label: 'Abdominal Crunch' },
    { id: 'box_jab', label: 'Boxing Jab Strike' },
    { id: 'box_cross', label: 'Boxing Cross Power' },
    { id: 'jumping_jacks', label: 'Plyometric Jacks' },
    { id: 'mountain_climber', label: 'Mountain Climber' },
    { id: 'burpee', label: 'Burpee' },
    { id: 'high_knees', label: 'High Knees' },
    { id: 'glute_bridge', label: 'Glute Bridge' },
    { id: 'superman', label: 'Superman Hold' },
    { id: 'tricep_dips', label: 'Bench Tricep Dips' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-base font-black text-white">FIT3D Admin Panel</h2>
              <div className="text-xs text-neutral-400">Database Exercise Publisher (PRD Section 27)</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/50 px-6 pt-2 text-xs">
          <button
            onClick={() => setActiveAdminTab('exercises')}
            className={`pb-3 px-3 font-bold border-b-2 transition ${
              activeAdminTab === 'exercises'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Exercise Catalog ({exercisesCount})
          </button>
          <button
            onClick={() => setActiveAdminTab('subscriptions')}
            className={`pb-3 px-3 font-bold border-b-2 transition ${
              activeAdminTab === 'subscriptions'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Subscription Plans & Pricing
          </button>
        </div>

        {/* Content Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeAdminTab === 'subscriptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Commercial Tier Management</h3>
                  <p className="text-xs text-neutral-400">Configure entitlements, prices in INR, and plan parameters.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  Live Gateway Ready
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Free Starter', price: '₹0', users: 'Default', status: 'Active' },
                  { name: 'FIT3D Pro (Monthly)', price: '₹299/mo', users: 'Most Popular', status: 'Active' },
                  { name: 'FIT3D Pro (Annual)', price: '₹1,999/yr', users: 'Save 44%', status: 'Active' },
                  { name: 'FIT3D Elite (Monthly)', price: '₹599/mo', users: 'Adaptive AI', status: 'Active' },
                  { name: 'FIT3D Elite (Annual)', price: '₹3,999/yr', users: 'All-Access', status: 'Active' }
                ].map((tier, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{tier.name}</span>
                      <span className="text-neutral-400 text-[11px]">{tier.users}</span>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-mono font-bold text-orange-400 text-sm">{tier.price}</span>
                      <button className="px-2.5 py-1 rounded-lg bg-neutral-700 text-neutral-300 hover:text-white font-semibold text-[11px]">
                        Edit Price
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeAdminTab === 'exercises' && (
            <>
              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Exercise successfully added to catalog and synchronized with Firebase!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Exercise Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bulgarian Split Squat"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-neutral-400 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BodyPartCategory)}
                  className="w-full p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
                >
                  {['Chest', 'Back', 'Arms', 'Shoulders', 'Abs', 'Legs', 'Full Body', 'Boxing', 'Mobility'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-400 block mb-1">Primary Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as FitnessGoal)}
                  className="w-full p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
                >
                  {['Build Muscle', 'Fat Loss', 'Build Abs', 'Boxing', 'Mobility'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-400 block mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as FitnessLevel)}
                  className="w-full p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
                >
                  {['Beginner', 'Intermediate', 'Advanced'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-400 block mb-1">Equipment</label>
                <select
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value as EquipmentType)}
                  className="w-full p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
                >
                  {['No Equipment', 'Dumbbells', 'Barbell', 'Resistance Band', 'Cable Machine', 'Full Gym'].map(eq => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Muscle Mapping & 3D Kinematics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-neutral-400 block mb-1">Primary Muscle (Red Glow)</label>
                <select
                  value={primaryMuscle}
                  onChange={(e) => setPrimaryMuscle(e.target.value as MuscleName)}
                  className="w-full p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white capitalize"
                >
                  {muscleList.map(m => (
                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-400 block mb-1">Secondary Muscle (Amber Glow)</label>
                <select
                  value={secondaryMuscle}
                  onChange={(e) => setSecondaryMuscle(e.target.value as MuscleName)}
                  className="w-full p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white capitalize"
                >
                  {muscleList.map(m => (
                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-400 block mb-1">3D Movement Kinematics</label>
                <select
                  value={animationType}
                  onChange={(e) => setAnimationType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
                >
                  {animationList.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sets, Reps, Rest, Calories */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <label className="font-bold text-neutral-400 block mb-1">Sets</label>
                <input
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-400 block mb-1">Reps</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-400 block mb-1">Rest (s)</label>
                <input
                  type="number"
                  value={restSeconds}
                  onChange={(e) => setRestSeconds(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-400 block mb-1">Calories</label>
                <input
                  type="number"
                  value={caloriesEstimate}
                  onChange={(e) => setCaloriesEstimate(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1">Instructions (One per line)</label>
              <textarea
                rows={3}
                value={instructionsText}
                onChange={(e) => setInstructionsText(e.target.value)}
                className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1">Breathing Pattern</label>
              <input
                type="text"
                value={breathingText}
                onChange={(e) => setBreathingText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-lg shadow-purple-600/30 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? 'Publishing...' : 'PUBLISH EXERCISE TO FIREBASE'}
            </button>
          </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
