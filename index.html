export type FitnessGoal = 
  | 'Fat Loss'
  | 'Build Muscle'
  | 'Build Abs'
  | 'Arms'
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Legs'
  | 'Boxing'
  | 'Mobility';

export type FitnessLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type WorkoutLocation = 'Home' | 'Gym' | 'Both';

export type EquipmentType = 
  | 'No Equipment'
  | 'Dumbbells'
  | 'Barbell'
  | 'Resistance Band'
  | 'Bench'
  | 'Pull-Up Bar'
  | 'Cable Machine'
  | 'Full Gym';

export type BodyPartCategory = 
  | 'Chest'
  | 'Back'
  | 'Arms'
  | 'Shoulders'
  | 'Abs'
  | 'Legs'
  | 'Full Body'
  | 'Boxing'
  | 'Mobility';

export type CharacterModelId = 'CHAR-M-01' | 'CHAR-F-01';

export type AnimationState = 
  | 'IDLE'
  | 'START_POSITION'
  | 'ECCENTRIC_LOAD'
  | 'PEAK_CONTRACTION'
  | 'CONCENTRIC_RETURN'
  | 'REP_COMPLETE';

// Canonical Muscle IDs per PRD v2.0 Section 7 (with bilateral & unilateral _l / _r support)
export type MuscleName = 
  // CHEST
  | 'upper_chest' | 'upper_chest_l' | 'upper_chest_r'
  | 'mid_chest' | 'mid_chest_l' | 'mid_chest_r'
  | 'lower_chest' | 'lower_chest_l' | 'lower_chest_r'
  // BACK
  | 'lats' | 'lats_l' | 'lats_r'
  | 'traps' | 'traps_l' | 'traps_r'
  | 'rear_back' | 'upper_back'
  | 'lower_back'
  // SHOULDERS
  | 'front_delts' | 'front_delts_l' | 'front_delts_r'
  | 'side_delts' | 'side_delts_l' | 'side_delts_r'
  | 'rear_delts' | 'rear_delts_l' | 'rear_delts_r'
  // ARMS
  | 'biceps' | 'biceps_l' | 'biceps_r'
  | 'triceps' | 'triceps_l' | 'triceps_r'
  | 'forearms' | 'forearms_l' | 'forearms_r'
  // CORE
  | 'rectus_abdominis' | 'abs'
  | 'lower_abs'
  | 'obliques' | 'obliques_l' | 'obliques_r'
  | 'deep_core'
  // LEGS
  | 'glutes' | 'glutes_l' | 'glutes_r'
  | 'quads' | 'quads_l' | 'quads_r'
  | 'hamstrings' | 'hamstrings_l' | 'hamstrings_r'
  | 'calves' | 'calves_l' | 'calves_r';

export interface MovementPhaseCue {
  state: AnimationState;
  normalizedTime: number; // 0.0 to 1.0
  instruction: string;
  breathing: string;
}

export interface Exercise {
  id: string; // Canonical e.g. EX001
  name: string;
  category: BodyPartCategory;
  goals: FitnessGoal[];
  bodyPart: BodyPartCategory;
  difficulty: FitnessLevel;
  equipment: EquipmentType[];
  primaryMuscles: MuscleName[];
  secondaryMuscles: MuscleName[];
  movementPattern: string;
  instructions: string[];
  commonMistakes: string[];
  breathingPattern: string;
  /** Short description shown on the exercise details page. */
  description?: string;
  /** Important safety tips shown on the exercise details page. */
  safetyTips?: string[];
  animationId: string; // e.g. ex_pushup_rep
  animationType: string;
  characterId: CharacterModelId; // CHAR-M-01 or CHAR-F-01
  tempo?: string; // e.g. "2-1-2"
  phaseCues?: MovementPhaseCue[];
  durationSeconds?: number;
  reps: number;
  sets: number;
  restSeconds: number;
  caloriesEstimate: number;
  thumbnail?: string;
  isCustom?: boolean;
  createdBy?: string;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  level: FitnessLevel;
  goal: FitnessGoal;
  category: string;
  caloriesEstimate: number;
  exercises: Exercise[];
  bannerGradient: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  workoutName: string;
  category: string;
  durationSeconds: number;
  caloriesBurned: number;
  exerciseCount: number;
  completedAt: string;
  notes?: string;
}

export interface BodyMeasurements {
  id: string;
  recordedAt: string;
  weightKg: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  hipCm?: number;
  thighCm?: number;
  notes?: string;
}

export type BodyBuildPreset = 'slim' | 'average' | 'athletic' | 'muscular';

export interface AvatarConfiguration {
  avatarId: string;
  userId: string;
  characterPresentation: CharacterModelId; // CHAR-M-01 or CHAR-F-01
  bodyPreset: BodyBuildPreset;
  heightScale: number; // 0.85 to 1.15
  shoulderProportion: number; // 0.85 to 1.25
  chestProportion: number; // 0.85 to 1.25
  waistProportion: number; // 0.85 to 1.25
  hipProportion: number; // 0.85 to 1.25
  armProportion: number; // 0.85 to 1.30
  legProportion: number; // 0.85 to 1.25
  muscleDefinition: number; // 0 to 1
  skinHue: string; // 'graphite' | 'slate' | 'bronze' | 'midnight'
  customizationVersion: number;
  updatedAt: string;
}

export type SubscriptionPlanId = 'free' | 'pro_monthly' | 'pro_annual' | 'elite_monthly' | 'elite_annual';
export type SubscriptionTier = 'free' | 'pro' | 'elite';
export type SubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'expired' | 'pending';

export interface SubscriptionConfig {
  id: SubscriptionPlanId;
  tier: SubscriptionTier;
  name: string;
  priceInr: number;
  billingPeriod: 'month' | 'year' | 'lifetime';
  description: string;
  features: string[];
  popular?: boolean;
}

export interface UserSubscription {
  subscriptionId: string;
  userId: string;
  tier: SubscriptionTier;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  provider: 'razorpay' | 'system_mock' | 'free_tier';
  providerOrderId?: string;
  providerPaymentId?: string;
  amountInr: number;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  orderId: string;
  paymentId: string;
  amountInr: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded';
  planId: SubscriptionPlanId;
  verifiedAt: string;
  providerReference: string;
}

export type DietaryPreference = 'Vegetarian' | 'Vegan' | 'Non-Vegetarian' | 'Eggetarian' | 'Jain' | 'Keto';
export type FoodBudgetTier = 'Budget-Friendly' | 'Moderate' | 'Premium';

export interface NutritionPreferences {
  dietaryPreference: DietaryPreference;
  allergies: string[];
  intolerances: string[];
  cuisinePreference: string[];
  budgetTier: FoodBudgetTier;
  targetDailyCalories?: number;
  targetProteinGrams?: number;
}

export interface MealItem {
  id: string;
  name: string;
  timeSlot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  ingredients: string[];
  portionGuide: string;
  preparationTip: string;
  substitutions: string[];
  isEaten?: boolean;
}

export interface DailyMealPlan {
  id: string;
  userId: string;
  dayOfWeek: string;
  date: string;
  meals: MealItem[];
  totalCalories: number;
  totalProteinG: number;
  notes?: string;
}

export interface DietChatMessage {
  id: string;
  sender: 'user' | 'coach' | 'system';
  text: string;
  timestamp: string;
  mealSuggestions?: MealItem[];
  groceryList?: string[];
  safetyNotice?: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  age?: number;
  dateOfBirth?: string;
  physiologicalSex?: 'male' | 'female' | 'prefer_not_to_say';
  goal: FitnessGoal;
  fitnessLevel: FitnessLevel;
  workoutLocation: WorkoutLocation;
  equipment: EquipmentType;
  availableTime: string;
  trainingDaysPerWeek?: number;
  targetBodyParts: string[];
  limitations?: string[];
  preferredCharacter: CharacterModelId;
  avatarConfig?: AvatarConfiguration;
  streak: number;
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  weightKg: number;
  heightCm: number;
  targetWeightKg?: number;
  targetTimeframeWeeks?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  hipCm?: number;
  thighCm?: number;
  nutritionPreferences?: NutritionPreferences;
  subscription?: UserSubscription;
  dietMessageCount?: number;
  xp: number;
  level: number;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BoxingCombo {
  id: string;
  name: string;
  sequence: number[]; // e.g. [1, 2, 3, 2]
  description: string;
  difficulty: FitnessLevel;
  targetRounds: number;
  roundTimeSeconds: number;
  calories: number;
}
