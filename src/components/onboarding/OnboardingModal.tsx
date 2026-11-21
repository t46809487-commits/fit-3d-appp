import React, { useState } from 'react';
import { FitnessGoal, FitnessLevel, WorkoutLocation, EquipmentType, UserProfile } from '../../types';
import { Flame, Dumbbell, Shield, Trophy, Activity, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: Partial<UserProfile>) => void;
  initialName?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  initialName = 'Athlete',
}) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(initialName);
  const [goal, setGoal] = useState<FitnessGoal>('Fat Loss');
  const [level, setLevel] = useState<FitnessLevel>('Beginner');
  const [location, setLocation] = useState<WorkoutLocation>('Home');
  const [equipment, setEquipment] = useState<EquipmentType>('No Equipment');
  const [time, setTime] = useState<string>('20 min');
  const [target, setTarget] = useState<string>('Full Body');

  // Extended Body & Nutrition Profile
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [characterPresentation, setCharacterPresentation] = useState<'CHAR-M-01' | 'CHAR-F-01'>('CHAR-M-01');
  const [dietaryPref, setDietaryPref] = useState<'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | 'Vegan'>('Vegetarian');
  const [foodBudget, setFoodBudget] = useState<'Budget-Friendly' | 'Moderate' | 'Premium'>('Budget-Friendly');
  const [allergies, setAllergies] = useState<string>('');
  const [trainingDays, setTrainingDays] = useState<number>(4);

  if (!isOpen) return null;

  const totalSteps = 7;

  const handleFinish = () => {
    onComplete({
      displayName: name || 'Athlete',
      goal,
      fitnessLevel: level,
      workoutLocation: location,
      equipment,
      availableTime: time,
      targetBodyParts: [target],
      preferredCharacter: characterPresentation,
      heightCm: Number(heightCm) || 175,
      weightKg: Number(weightKg) || 70,
      trainingDaysPerWeek: trainingDays,
      nutritionPreferences: {
        dietaryPreference: dietaryPref as any,
        budgetTier: foodBudget as any,
        allergies: allergies.split(',').map((s) => s.trim()).filter(Boolean),
        intolerances: [],
        cuisinePreference: ['Indian', 'Continental'],
      },
      onboarded: true,
      streak: 1,
      totalWorkouts: 0,
      totalMinutes: 0,
      totalCalories: 0,
      xp: 150,
      level: 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header & Step progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-neutral-400">
              FIT3D Personalizer
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-neutral-400">
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Step progress bar */}
        <div className="w-full h-1.5 bg-neutral-800 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step 1: Primary Goal */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">What's your primary goal?</h2>
              <p className="text-neutral-400 text-sm mt-1">Select the main outcome you want from your 3D guided training.</p>
            </div>

            <div className="mb-2">
              <label className="text-xs font-semibold text-neutral-400 block mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {[
                { label: 'Fat Loss', icon: Flame, color: 'text-orange-500', desc: 'Calorie burn & lean definition' },
                { label: 'Build Muscle', icon: Dumbbell, color: 'text-blue-500', desc: 'Hypertrophy & strength' },
                { label: 'Build Abs', icon: Shield, color: 'text-cyan-500', desc: 'Core stability & 6-pack cuts' },
                { label: 'Boxing', icon: Trophy, color: 'text-red-500', desc: 'Combat rhythm & agility' },
                { label: 'Mobility', icon: Activity, color: 'text-emerald-500', desc: 'Joint freedom & recovery' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = goal === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => setGoal(item.label as FitnessGoal)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500 shadow-md ring-1 ring-orange-500/50'
                        : 'bg-neutral-800/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl bg-neutral-900 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        {item.label}
                        {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Fitness Level */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">What is your fitness level?</h2>
              <p className="text-neutral-400 text-sm mt-1">This determines rep volume, exercise selection, and rest cadence.</p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { id: 'Beginner', title: 'Beginner', desc: 'Starting out or returning after a break. Focus on form & habits.' },
                { id: 'Intermediate', title: 'Intermediate', desc: 'Regular training 2-4x a week. Comfortable with key movements.' },
                { id: 'Advanced', title: 'Advanced', desc: 'Experienced athlete looking for higher volume and intensity.' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id as FitnessLevel)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    level === l.id
                      ? 'bg-orange-500/15 border-orange-500 ring-1 ring-orange-500/50'
                      : 'bg-neutral-800/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      {l.title}
                      {level === l.id && <Check className="w-4 h-4 text-orange-500" />}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">{l.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Workout Location */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Where do you work out?</h2>
              <p className="text-neutral-400 text-sm mt-1">We optimize routines for your physical environment.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              {[
                { id: 'Home', title: 'Home', desc: 'Bodyweight and minimal compact gear' },
                { id: 'Gym', title: 'Gym', desc: 'Full access to weights and machines' },
                { id: 'Both', title: 'Both / Hybrid', desc: 'Flexible for travel or changing days' },
              ].map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setLocation(loc.id as WorkoutLocation)}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    location === loc.id
                      ? 'bg-orange-500/15 border-orange-500 ring-1 ring-orange-500/50'
                      : 'bg-neutral-800/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      {loc.title}
                      {location === loc.id && <Check className="w-4 h-4 text-orange-500" />}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">{loc.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Equipment */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Available Equipment?</h2>
              <p className="text-neutral-400 text-sm mt-1">Pick your primary gear setup.</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              {[
                'No Equipment',
                'Dumbbells',
                'Barbell',
                'Resistance Band',
                'Cable Machine',
                'Full Gym',
              ].map((eq) => (
                <button
                  key={eq}
                  onClick={() => setEquipment(eq as EquipmentType)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    equipment === eq
                      ? 'bg-orange-500/15 border-orange-500 ring-1 ring-orange-500/50'
                      : 'bg-neutral-800/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-sm font-bold text-white flex items-center justify-between">
                    <span>{eq}</span>
                    {equipment === eq && <Check className="w-4 h-4 text-orange-500" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Workout Time */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Preferred Duration?</h2>
              <p className="text-neutral-400 text-sm mt-1">How many minutes can you dedicate per session?</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {['10 min', '20 min', '30 min', '45 min', '60 min'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    time === t
                      ? 'bg-orange-500 text-white font-black border-orange-500 shadow-md'
                      : 'bg-neutral-800/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-base font-bold">{t}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Target Muscle Focus */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Primary Target Muscle?</h2>
              <p className="text-neutral-400 text-sm mt-1">Which area do you want to prioritize in your plan?</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {[
                'Full Body',
                'Chest',
                'Back',
                'Arms',
                'Shoulders',
                'Abs',
                'Legs',
              ].map((tg) => (
                <button
                  key={tg}
                  onClick={() => setTarget(tg)}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    target === tg
                      ? 'bg-orange-500 text-white font-bold border-orange-500'
                      : 'bg-neutral-800/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-sm font-semibold">{tg}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Body Metrics, 3D Avatar & Nutrition Setup */}
        {step === 7 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Body & Nutrition Calibration</h2>
              <p className="text-neutral-400 mt-1">
                Help us calibrate your 3D avatar deformation, workout volume, and meal planning.
              </p>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-semibold block mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-neutral-400 font-semibold block mb-1">Current Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-bold"
                />
              </div>
            </div>

            {/* 3D Character Presentation */}
            <div>
              <label className="text-neutral-400 font-semibold block mb-1.5">3D Character Presentation</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'CHAR-M-01', label: 'Male Rig (CHAR-M-01)' },
                  { id: 'CHAR-F-01', label: 'Female Rig (CHAR-F-01)' },
                ].map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setCharacterPresentation(char.id as any)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      characterPresentation === char.id
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-neutral-800/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {char.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Preference */}
            <div>
              <label className="text-neutral-400 font-semibold block mb-1.5">Dietary Preference</label>
              <div className="grid grid-cols-2 gap-2">
                {['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDietaryPref(d as any)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold transition ${
                      dietaryPref === d
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-neutral-800/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Allergies */}
            <div>
              <label className="text-neutral-400 font-semibold block mb-1">Food Allergies / Intolerances (Optional)</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Peanuts, Gluten, Lactose (or none)"
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
              />
            </div>
          </div>
        )}

        {/* Action Buttons: Back & Next / Finish */}
        <div className="mt-8 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-neutral-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/25 transition active:scale-95"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-black shadow-lg shadow-orange-500/30 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Generate My Workout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
