import { SubscriptionConfig, AvatarConfiguration, BodyBuildPreset, CharacterModelId } from '../types';

export const SUBSCRIPTION_PLANS: SubscriptionConfig[] = [
  {
    id: 'free',
    tier: 'free',
    name: 'Free Starter',
    priceInr: 0,
    billingPeriod: 'lifetime',
    description: 'Essential 3D fitness tools and standard exercises to jumpstart your athletic habits.',
    features: [
      'Basic onboarding & profile setup',
      'Standard 3D anatomical viewer',
      'Full core exercise demonstration catalog',
      '3D Interactive Boxing Arena (Round 1-3)',
      'Basic workout interval timer',
      'Daily workout recommendation',
      'Up to 3 AI Nutrition Chat questions / day',
      'Basic workout completion history'
    ]
  },
  {
    id: 'pro_monthly',
    tier: 'pro',
    name: 'FIT3D Pro (Monthly)',
    priceInr: 299,
    billingPeriod: 'month',
    popular: true,
    description: 'Personalized 3D body representation, custom workout generator, and weekly diet plans.',
    features: [
      'Parametric 3D Avatar shaping (torso, arms, shoulders, hips, height)',
      'Male (CHAR-M-01) & Female (CHAR-F-01) anatomical rigs',
      'Unlimited personalized AI workout generator based on equipment & limitations',
      'Comprehensive 7-day personalized meal plans with Indian cuisine support',
      'Smart meal substitutions & 1-click weekly grocery lists',
      'Unlimited AI Diet Chat with nutrition safety checks',
      'Deep progress analytics & measurement history tracking',
      'Ad-free uninterrupted workout player'
    ]
  },
  {
    id: 'pro_annual',
    tier: 'pro',
    name: 'FIT3D Pro (Annual)',
    priceInr: 1999,
    billingPeriod: 'year',
    description: 'Save 44% with annual billing. Complete biomechanics and personalized coaching.',
    features: [
      'All Pro Monthly features included',
      'Billed annually at ₹1,999 (~₹166/month)',
      'Priority generation for custom periodization routines',
      'Long-term body transformation before/after comparisons'
    ]
  },
  {
    id: 'elite_monthly',
    tier: 'elite',
    name: 'FIT3D Elite (Monthly)',
    priceInr: 599,
    billingPeriod: 'month',
    description: 'Maximum personalization: adaptive periodization, granular avatar morphs, and elite nutrition tuning.',
    features: [
      'Everything in FIT3D Pro',
      'Advanced mesocycle & deload periodization algorithms',
      'Granular muscle-definition slider & custom skin hues',
      'Dynamic weekly diet-plan auto-revisions based on logged weigh-ins',
      'Micro-nutrient breakdown (Vitamins, Electrolytes & Fiber)',
      'Option to submit progress logs for certified trainer review',
      'Early access to new 3D motion captures and combat strikes'
    ]
  },
  {
    id: 'elite_annual',
    tier: 'elite',
    name: 'FIT3D Elite (Annual)',
    priceInr: 3999,
    billingPeriod: 'year',
    description: 'The premier athletic transformation ecosystem for committed athletes.',
    features: [
      'All Elite Monthly features included',
      'Billed annually at ₹3,999 (~₹333/month)',
      'Save ₹3,189 compared to monthly plan',
      'VIP coach queue & lifetime profile archives'
    ]
  }
];

export function getDefaultAvatarConfig(
  userId: string = 'local-athlete',
  gender: CharacterModelId = 'CHAR-M-01',
  preset: BodyBuildPreset = 'athletic'
): AvatarConfiguration {
  const isFemale = gender === 'CHAR-F-01';

  const presetModifiers: Record<BodyBuildPreset, {
    shoulder: number;
    chest: number;
    waist: number;
    hip: number;
    arm: number;
    leg: number;
    definition: number;
  }> = {
    slim: {
      shoulder: 0.94,
      chest: 0.92,
      waist: 0.90,
      hip: 0.92,
      arm: 0.90,
      leg: 0.92,
      definition: 0.35,
    },
    average: {
      shoulder: 1.0,
      chest: 1.0,
      waist: 1.0,
      hip: 1.0,
      arm: 1.0,
      leg: 1.0,
      definition: 0.50,
    },
    athletic: {
      shoulder: isFemale ? 1.02 : 1.08,
      chest: 1.05,
      waist: 0.94,
      hip: isFemale ? 1.08 : 0.98,
      arm: 1.06,
      leg: 1.05,
      definition: 0.75,
    },
    muscular: {
      shoulder: isFemale ? 1.08 : 1.18,
      chest: 1.15,
      waist: 0.96,
      hip: isFemale ? 1.12 : 1.02,
      arm: 1.20,
      leg: 1.14,
      definition: 0.92,
    },
  };

  const mods = presetModifiers[preset];

  return {
    avatarId: `AVT_${userId}_${Date.now()}`,
    userId,
    characterPresentation: gender,
    bodyPreset: preset,
    heightScale: 1.0,
    shoulderProportion: mods.shoulder,
    chestProportion: mods.chest,
    waistProportion: mods.waist,
    hipProportion: mods.hip,
    armProportion: mods.arm,
    legProportion: mods.leg,
    muscleDefinition: mods.definition,
    skinHue: 'graphite',
    customizationVersion: 1,
    updatedAt: new Date().toISOString(),
  };
}

// Compute safe parametric avatar morphs from real measurements (height, weight, waist, chest, arms)
export function computeAvatarFromMeasurements(
  heightCm: number,
  weightKg: number,
  gender: CharacterModelId,
  measurements?: {
    waistCm?: number;
    chestCm?: number;
    armCm?: number;
    hipCm?: number;
    thighCm?: number;
  }
): Partial<AvatarConfiguration> {
  // Height scale normalized against standard 178cm baseline
  const safeHeight = Math.max(140, Math.min(215, heightCm || 178));
  const heightScale = +(safeHeight / 178).toFixed(2);

  // BMI as safe proxy for proportional volume baseline (capped between 16 and 36)
  const heightM = safeHeight / 100;
  const safeWeight = Math.max(40, Math.min(160, weightKg || 70));
  const bmi = safeWeight / (heightM * heightM);

  let preset: BodyBuildPreset = 'average';
  if (bmi < 20) preset = 'slim';
  else if (bmi >= 20 && bmi < 25) preset = 'athletic';
  else if (bmi >= 25 && bmi < 29) preset = 'athletic';
  else preset = 'muscular';

  // Proportional adjustments bounded strictly in [0.85, 1.25] to prevent mesh tearing
  let shoulderProportion = 1.0;
  let chestProportion = 1.0;
  let waistProportion = 1.0;
  let hipProportion = 1.0;
  let armProportion = 1.0;
  let legProportion = 1.0;

  if (measurements?.chestCm) {
    // 95cm is adult baseline
    chestProportion = +(Math.max(0.85, Math.min(1.25, measurements.chestCm / 96))).toFixed(2);
    shoulderProportion = +(Math.max(0.88, Math.min(1.22, 0.95 * chestProportion))).toFixed(2);
  } else {
    chestProportion = +(Math.max(0.90, Math.min(1.20, 0.85 + (bmi / 30) * 0.35))).toFixed(2);
    shoulderProportion = +(Math.max(0.92, Math.min(1.20, 0.90 + (bmi / 30) * 0.30))).toFixed(2);
  }

  if (measurements?.waistCm) {
    waistProportion = +(Math.max(0.85, Math.min(1.28, measurements.waistCm / 82))).toFixed(2);
  } else {
    waistProportion = +(Math.max(0.88, Math.min(1.25, 0.85 + (bmi / 32) * 0.35))).toFixed(2);
  }

  if (measurements?.armCm) {
    armProportion = +(Math.max(0.85, Math.min(1.30, measurements.armCm / 35))).toFixed(2);
  }

  if (measurements?.hipCm) {
    hipProportion = +(Math.max(0.85, Math.min(1.25, measurements.hipCm / 96))).toFixed(2);
  }

  if (measurements?.thighCm) {
    legProportion = +(Math.max(0.85, Math.min(1.25, measurements.thighCm / 56))).toFixed(2);
  }

  return {
    bodyPreset: preset,
    heightScale,
    shoulderProportion,
    chestProportion,
    waistProportion,
    hipProportion,
    armProportion,
    legProportion,
    muscleDefinition: +(Math.max(0.3, Math.min(0.95, 0.4 + (bmi > 22 && bmi < 27 ? 0.35 : 0.15)))).toFixed(2),
  };
}
