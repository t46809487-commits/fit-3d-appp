import { DailyMealPlan, MealItem, DietaryPreference, FoodBudgetTier } from '../types';

export const INDIAN_MEAL_DATABASE: MealItem[] = [
  // BREAKFAST
  {
    id: 'M_BRK_01',
    name: 'Sprouted Moong & Paneer Salad with Chia Seeds',
    timeSlot: 'breakfast',
    calories: 380,
    proteinG: 24,
    carbsG: 38,
    fatsG: 12,
    ingredients: [
      '1 cup Steamed sprouted green moong beans',
      '60g Low-fat fresh paneer cubes',
      '1/2 Finely chopped cucumber & tomato',
      '1 tsp Chia seeds',
      'Lemon juice, pink salt & chaat masala'
    ],
    portionGuide: '1 medium bowl (approx 250g)',
    preparationTip: 'Steam sprouts for 4 mins to ease digestion. Toss raw vegetables with lemon dressing.',
    substitutions: ['Tofu for vegan', 'Boiled eggs for non-veg']
  },
  {
    id: 'M_BRK_02',
    name: 'Masala Egg Omelette with Multigrain Toast',
    timeSlot: 'breakfast',
    calories: 420,
    proteinG: 26,
    carbsG: 34,
    fatsG: 16,
    ingredients: [
      '3 Whole eggs (or 1 whole + 3 whites)',
      '1/4 cup Chopped onions, green chilies, coriander',
      '2 slices 100% whole wheat or multigrain bread',
      '1 tsp Cold-pressed mustard or olive oil'
    ],
    portionGuide: '1 plate (2 eggs + 2 toasts)',
    preparationTip: 'Whisk eggs vigorously with chopped vegetables before cooking on a non-stick skillet.',
    substitutions: ['Besan chilla with paneer stuffing for vegetarians']
  },
  {
    id: 'M_BRK_03',
    name: 'High-Protein Besan & Oats Chilla with Mint Chutney',
    timeSlot: 'breakfast',
    calories: 350,
    proteinG: 19,
    carbsG: 46,
    fatsG: 9,
    ingredients: [
      '1/2 cup Besan (gram flour)',
      '1/4 cup Powdered rolled oats',
      'Grated carrots, spinach & ginger',
      '1 tbsp Fresh homemade mint-coriander chutney'
    ],
    portionGuide: '2 medium chillas',
    preparationTip: 'Batter should be smooth pancake consistency. Cook both sides golden brown with minimal oil.',
    substitutions: ['Moong dal chilla', 'Sattu buttermilk shake']
  },

  // LUNCH
  {
    id: 'M_LUN_01',
    name: 'Grilled Chicken Breast with Brown Rice & Dal Tadka',
    timeSlot: 'lunch',
    calories: 550,
    proteinG: 44,
    carbsG: 58,
    fatsG: 14,
    ingredients: [
      '150g Marinated skinless chicken breast',
      '3/4 cup Cooked brown basmati rice',
      '1/2 cup Yellow toor dal with cumin tempering',
      'Mixed green salad with cucumber and radish'
    ],
    portionGuide: '1 standard meal plate',
    preparationTip: 'Marinate chicken in curd, turmeric, cumin and garlic for 30 mins before grilling.',
    substitutions: ['Grilled paneer (120g) for vegetarian', 'Soya chunks curry for budget']
  },
  {
    id: 'M_LUN_02',
    name: 'Rajma Masala with Quinoa / Brown Rice & Cucumber Raita',
    timeSlot: 'lunch',
    calories: 490,
    proteinG: 22,
    carbsG: 72,
    fatsG: 11,
    ingredients: [
      '1 cup Slow-cooked Kashmiri rajma in tomato-onion gravy',
      '3/4 cup Steamed quinoa or brown rice',
      '1/2 cup Greek yogurt raita with roasted cumin',
      'Fresh lemon wedge'
    ],
    portionGuide: '1 large bowl rajma + 1 bowl rice',
    preparationTip: 'Soak rajma overnight (8+ hours) to reduce phytates and boost mineral bioavailability.',
    substitutions: ['Chole (Chickpeas)', 'Black eyed peas (Lobia)']
  },
  {
    id: 'M_LUN_03',
    name: 'High-Protein Soya Chunk Pulao with Curd',
    timeSlot: 'lunch',
    calories: 480,
    proteinG: 34,
    carbsG: 62,
    fatsG: 10,
    ingredients: [
      '50g Nutrela soya chunks (boiled & squeezed)',
      '3/4 cup Basmati rice with green peas and beans',
      'Whole spices (cinnamon, cloves, cardamom)',
      '1/2 cup Fresh dahi (curd)'
    ],
    portionGuide: '1 medium plate pulao + raita',
    preparationTip: 'Squeeze all water out of boiled soya chunks before sautéing to absorb spices cleanly.',
    substitutions: ['Paneer pulao', 'Egg biryani']
  },

  // SNACKS
  {
    id: 'M_SNK_01',
    name: 'Roasted Makhana (Foxnuts) & Roasted Chana Mix',
    timeSlot: 'snack',
    calories: 190,
    proteinG: 8,
    carbsG: 28,
    fatsG: 4,
    ingredients: [
      '1.5 cups Puffed makhana roasted in 1/2 tsp ghee',
      '2 tbsp Roasted chana (chickpeas)',
      'Rock salt, turmeric & peri-peri powder'
    ],
    portionGuide: '1 small bowl (approx 45g)',
    preparationTip: 'Roast on low flame until crisp. Store in airtight container.',
    substitutions: ['Mixed nuts (almonds + walnuts)', 'Peanut chaat']
  },
  {
    id: 'M_SNK_02',
    name: 'Sattu Protein Drink (Desi Shaker)',
    timeSlot: 'snack',
    calories: 210,
    proteinG: 14,
    carbsG: 30,
    fatsG: 3,
    ingredients: [
      '3 tbsp Roasted chana sattu powder',
      '300ml Cold water or thin buttermilk',
      'Black salt, roasted cumin powder & fresh mint'
    ],
    portionGuide: '1 tall glass (350ml)',
    preparationTip: 'Stir with whisk to avoid lumps. Natural electrolyte and slow-burning complex carbs.',
    substitutions: ['Whey protein isolate shake', 'Almond milk with chia seeds']
  },

  // DINNER
  {
    id: 'M_DIN_01',
    name: 'Palak Paneer with 2 Multigrain Rotis & Cucumber Slices',
    timeSlot: 'dinner',
    calories: 460,
    proteinG: 23,
    carbsG: 42,
    fatsG: 18,
    ingredients: [
      '100g Fresh paneer cubes',
      '1.5 cups Blanched spinach puree with garlic and ginger',
      '2 Whole wheat / ragi rotis (without ghee)',
      'Raw sliced cucumber and carrots'
    ],
    portionGuide: '1 bowl palak paneer + 2 rotis',
    preparationTip: 'Blanch spinach in boiling water for only 2 mins, then plunge into ice water to preserve vibrant chlorophyll.',
    substitutions: ['Tofu palak for vegan', 'Palak chicken for non-veg']
  },
  {
    id: 'M_DIN_02',
    name: 'Tawa Fish Tikka / Tofu Tikka with Sautéed Veggies',
    timeSlot: 'dinner',
    calories: 410,
    proteinG: 38,
    carbsG: 18,
    fatsG: 14,
    ingredients: [
      '180g Rohu or Basa fish fillets (or 160g firm Tofu)',
      'Tikka marinade: hung curd, ajwain, turmeric, degi mirch',
      '1 cup Bell peppers, zucchini, onions sautéed on high heat',
      'Mint yogurt dip'
    ],
    portionGuide: '1 tawa plate',
    preparationTip: 'Cook fish on medium-high tawa for 3-4 mins per side until flakey and slightly charred.',
    substitutions: ['Paneer tikka', 'Soya chaap (unfried)']
  },
  {
    id: 'M_DIN_03',
    name: 'Yellow Moong Dal Khichdi with Steamed Cauliflower & Ghee',
    timeSlot: 'dinner',
    calories: 390,
    proteinG: 16,
    carbsG: 56,
    fatsG: 9,
    ingredients: [
      '1/2 cup Split yellow moong dal + 1/3 cup Rice',
      'Finely chopped carrots, beans & cauliflower',
      '1 tsp A2 Cow Ghee tempering with hing (asafoetida) & jeera',
      '1 bowl plain probiotic curd'
    ],
    portionGuide: '1 medium bowl (300g)',
    preparationTip: 'Lightest dinner for digestive recovery and restful deep sleep.',
    substitutions: ['Oats khichdi', 'Quinoa dal bowl']
  }
];

export function generateCustomMealPlan(
  dietaryPref: DietaryPreference = 'Vegetarian',
  budget: FoodBudgetTier = 'Budget-Friendly',
  allergies: string[] = [],
  dayName: string = 'Today'
): DailyMealPlan {
  const isVegetarian = dietaryPref === 'Vegetarian' || dietaryPref === 'Jain';
  const isVegan = dietaryPref === 'Vegan';

  // Filter meals adhering strictly to dietary preferences & allergies
  const filterMeal = (meal: MealItem) => {
    if (isVegetarian && (meal.name.includes('Chicken') || meal.name.includes('Fish') || meal.name.includes('Egg'))) {
      return false;
    }
    if (isVegan && (meal.name.includes('Paneer') || meal.name.includes('Curd') || meal.name.includes('Ghee') || meal.name.includes('Egg') || meal.name.includes('Chicken') || meal.name.includes('Fish'))) {
      return false;
    }
    // Check allergy exclusions
    const ingrText = meal.ingredients.join(' ').toLowerCase();
    for (const allergy of allergies) {
      if (ingrText.includes(allergy.toLowerCase())) return false;
    }
    return true;
  };

  const breakfastOptions = INDIAN_MEAL_DATABASE.filter(m => m.timeSlot === 'breakfast' && filterMeal(m));
  const lunchOptions = INDIAN_MEAL_DATABASE.filter(m => m.timeSlot === 'lunch' && filterMeal(m));
  const snackOptions = INDIAN_MEAL_DATABASE.filter(m => m.timeSlot === 'snack' && filterMeal(m));
  const dinnerOptions = INDIAN_MEAL_DATABASE.filter(m => m.timeSlot === 'dinner' && filterMeal(m));

  const breakfast = breakfastOptions[0] || INDIAN_MEAL_DATABASE[0];
  const lunch = lunchOptions[0] || INDIAN_MEAL_DATABASE[4];
  const snack = snackOptions[0] || INDIAN_MEAL_DATABASE[6];
  const dinner = dinnerOptions[0] || INDIAN_MEAL_DATABASE[8];

  const meals = [breakfast, lunch, snack, dinner];
  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProteinG = meals.reduce((acc, m) => acc + m.proteinG, 0);

  return {
    id: `PLAN_${Date.now()}`,
    userId: 'current-user',
    dayOfWeek: dayName,
    date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
    meals,
    totalCalories,
    totalProteinG,
    notes: `${dietaryPref} meal plan with ${budget} Indian staples. Balanced for muscle recovery and steady glycemic energy.`
  };
}
