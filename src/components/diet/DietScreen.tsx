import React, { useState } from 'react';
import { 
  UserProfile, 
  DietChatMessage, 
  DailyMealPlan, 
  MealItem, 
  DietaryPreference, 
  FoodBudgetTier, 
  SubscriptionTier 
} from '../../types';
import { INDIAN_MEAL_DATABASE, generateCustomMealPlan } from '../../data/nutrition';
import { 
  Utensils, 
  Sparkles, 
  Send, 
  Check, 
  ShoppingBag, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Flame, 
  Zap, 
  Lock, 
  Plus, 
  RefreshCw,
  Crown
} from 'lucide-react';

interface DietScreenProps {
  userProfile: UserProfile;
  onUpdatePreferences: (prefs: any) => void;
  onOpenUpgradeModal: () => void;
}

export const DietScreen: React.FC<DietScreenProps> = ({
  userProfile,
  onUpdatePreferences,
  onOpenUpgradeModal,
}) => {
  const currentTier: SubscriptionTier = userProfile.subscription?.tier || 'free';
  const isPaid = currentTier === 'pro' || currentTier === 'elite';
  const dailyMessageLimit = isPaid ? 100 : 3;

  const [activeSubTab, setActiveSubTab] = useState<'meal_plan' | 'coach_chat' | 'grocery'>('meal_plan');

  // Nutrition Preferences
  const [dietaryPref, setDietaryPref] = useState<DietaryPreference>(
    userProfile.nutritionPreferences?.dietaryPreference || 'Vegetarian'
  );
  const [foodBudget, setFoodBudget] = useState<FoodBudgetTier>(
    userProfile.nutritionPreferences?.budgetTier || 'Budget-Friendly'
  );
  const [allergiesInput, setAllergiesInput] = useState<string>(
    userProfile.nutritionPreferences?.allergies?.join(', ') || ''
  );

  // Active Meal Plan State
  const [currentMealPlan, setCurrentMealPlan] = useState<DailyMealPlan>(() =>
    generateCustomMealPlan(dietaryPref, foodBudget, userProfile.nutritionPreferences?.allergies)
  );

  // Chat State
  const [messages, setMessages] = useState<DietChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'coach',
      text: `Hello ${userProfile.displayName || 'Athlete'}! I'm your FIT3D Sports Nutrition Coach. I build meals tailored to your goal (${userProfile.goal}), dietary preferences (${dietaryPref}), and Indian food staples. Ask me for high-protein options, pre-workout snacks, or customized grocery lists!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      safetyNotice: 'FIT3D nutrition coaching provides educational fitness recommendations. Consult a clinical dietitian for medical eating therapies or allergies.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [messageCount, setMessageCount] = useState(userProfile.dietMessageCount || 0);

  // Meal Eaten Toggle
  const handleToggleEaten = (mealId: string) => {
    setCurrentMealPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => (m.id === mealId ? { ...m, isEaten: !m.isEaten } : m)),
    }));
  };

  // Generate Fresh Meal Plan
  const handleRegeneratePlan = () => {
    const allergiesList = allergiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const updated = generateCustomMealPlan(dietaryPref, foodBudget, allergiesList);
    setCurrentMealPlan(updated);
    onUpdatePreferences({
      dietaryPreference: dietaryPref,
      budgetTier: foodBudget,
      allergies: allergiesList,
    });
  };

  // Send Chat Message
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    if (messageCount >= dailyMessageLimit) {
      onOpenUpgradeModal();
      return;
    }

    const userText = inputText.trim();
    const newMsg: DietChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setMessageCount((c) => c + 1);

    // AI Sports Dietitian Knowledge Engine Response
    setTimeout(() => {
      let replyText = '';
      let suggestions: MealItem[] | undefined;
      let groceryList: string[] | undefined;
      const lower = userText.toLowerCase();

      if (lower.includes('breakfast')) {
        replyText = `For your goal of ${userProfile.goal}, aim for 20-30g of slow-digesting protein and complex carbs at breakfast to stabilize morning insulin:`;
        suggestions = [INDIAN_MEAL_DATABASE[0], INDIAN_MEAL_DATABASE[2]];
      } else if (lower.includes('pre-workout') || lower.includes('before workout')) {
        replyText = 'Eat 45-60 minutes before your workout: 1 banana with 1 tbsp peanut butter or roasted sattu water. This delivers rapid muscle glycogen without gastrointestinal distress.';
        suggestions = [INDIAN_MEAL_DATABASE[7]];
      } else if (lower.includes('post-workout') || lower.includes('after workout')) {
        replyText = 'Consume within 45 minutes post-workout: 25-30g fast-acting protein with 40g carbs to jumpstart muscle protein synthesis and replenish glycogen stores.';
        suggestions = [INDIAN_MEAL_DATABASE[3]];
      } else if (lower.includes('grocery') || lower.includes('shopping')) {
        replyText = 'Here is your targeted 7-day high-protein Indian fitness grocery checklist:';
        groceryList = [
          'Rolled Oats (1kg)',
          'Soya Chunks / Nutrela (500g)',
          'Low-fat Fresh Paneer or Tofu (500g)',
          'Sprouted Moong Beans (500g)',
          'Roasted Chana Sattu (500g)',
          'Puffed Makhana (250g)',
          'Brown Basmati Rice or Quinoa',
          'Fresh Spinach (Palak) & Radish Greens',
          'Chia Seeds & Roasted Flax Seeds'
        ];
      } else if (lower.includes('protein') || lower.includes('vegetarian')) {
        replyText = 'Top cost-effective Indian vegetarian protein sources: Soya chunks (52g protein/100g), Sattu (20g/100g), Low-fat Paneer (18g/100g), and Sprouted Moong (24g/cooked cup). Combine grains + legumes to ensure all 9 essential amino acids.';
      } else {
        replyText = `Understood! To align with your ${userProfile.goal} plan and ${dietaryPref} preferences: maintain adequate hydration (3-4L water/day), prioritize 1.6-2.0g protein per kg of bodyweight, and minimize refined vegetable oils.`;
      }

      const botReply: DietChatMessage = {
        id: `reply_${Date.now()}`,
        sender: 'coach',
        text: replyText,
        mealSuggestions: suggestions,
        groceryList,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        safetyNotice: 'Personalized nutritional recommendations. Always consult a physician for medical conditions.',
      };
      setMessages((prev) => [...prev, botReply]);
    }, 700);
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-neutral-900 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Utensils className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AI Diet & Sports Nutrition Coach
            </h1>
          </div>
          <p className="text-xs text-neutral-300 max-w-lg">
            Personalized meal plans, protein target tracking, and interactive nutrition guidance calibrated for your 3D training routine.
          </p>
        </div>

        {!isPaid && (
          <button
            onClick={onOpenUpgradeModal}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-orange-500/20 shrink-0 self-start sm:self-auto"
          >
            <Crown className="w-4 h-4" /> Upgrade to Pro Meals
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex rounded-2xl bg-neutral-900 border border-neutral-800 p-1 text-xs">
        <button
          onClick={() => setActiveSubTab('meal_plan')}
          className={`flex-1 py-2 font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'meal_plan'
              ? 'bg-neutral-800 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          Today's Meal Plan
        </button>
        <button
          onClick={() => setActiveSubTab('coach_chat')}
          className={`flex-1 py-2 font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'coach_chat'
              ? 'bg-neutral-800 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          Diet AI Coach ({dailyMessageLimit - messageCount} left)
        </button>
        <button
          onClick={() => setActiveSubTab('grocery')}
          className={`flex-1 py-2 font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'grocery'
              ? 'bg-neutral-800 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-cyan-400" />
          Grocery & Prep
        </button>
      </div>

      {/* SUB-TAB 1: MEAL PLAN CALENDAR & CARDS */}
      {activeSubTab === 'meal_plan' && (
        <div className="space-y-5">
          
          {/* Preferences Quick Bar */}
          <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-neutral-400 font-semibold">Diet Type:</span>
              {(['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'] as DietaryPreference[]).map((pref) => (
                <button
                  key={pref}
                  onClick={() => setDietaryPref(pref)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    dietaryPref === pref
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>

            <button
              onClick={handleRegeneratePlan}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-400" /> Refresh Plan
            </button>
          </div>

          {/* Daily Macros Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800">
              <span className="text-xs text-neutral-400 font-semibold block">Total Calories</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">
                {currentMealPlan.totalCalories} <span className="text-xs text-neutral-500">kcal</span>
              </span>
            </div>
            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800">
              <span className="text-xs text-neutral-400 font-semibold block">Target Protein</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {currentMealPlan.totalProteinG}g
              </span>
            </div>
            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800">
              <span className="text-xs text-neutral-400 font-semibold block">Carbohydrates</span>
              <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
                ~175g
              </span>
            </div>
            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800">
              <span className="text-xs text-neutral-400 font-semibold block">Healthy Fats</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
                ~45g
              </span>
            </div>
          </div>

          {/* Meal Items List */}
          <div className="space-y-3">
            {currentMealPlan.meals.map((meal) => (
              <div
                key={meal.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  meal.isEaten
                    ? 'bg-neutral-900/50 border-neutral-800/60 opacity-70'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-800 text-orange-400 border border-neutral-700">
                        {meal.timeSlot}
                      </span>
                      <h3 className="text-base font-bold text-white">{meal.name}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="font-mono text-white font-bold">{meal.calories} kcal</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-400 font-bold">{meal.proteinG}g Protein</span>
                      <span>•</span>
                      <span>{meal.portionGuide}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleEaten(meal.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto ${
                      meal.isEaten
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {meal.isEaten ? 'Logged Eaten' : 'Mark as Eaten'}
                  </button>
                </div>

                {/* Ingredients & Prep */}
                <div className="mt-4 pt-3 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-neutral-400 block mb-1">Ingredients:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-neutral-300">
                      {meal.ingredients.map((ingr, i) => (
                        <li key={i}>{ingr}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-400 block mb-1">Preparation & Substitution:</span>
                    <p className="text-neutral-300 leading-relaxed">{meal.preparationTip}</p>
                    {meal.substitutions.length > 0 && (
                      <span className="text-[11px] text-neutral-500 block mt-1">
                        Swap: {meal.substitutions.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AI DIET CHAT */}
      {activeSubTab === 'coach_chat' && (
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col h-[560px]">
          {/* Chat Messages Log */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-orange-500 text-white rounded-br-none shadow-md shadow-orange-500/20'
                      : 'bg-neutral-800/90 text-neutral-200 rounded-bl-none border border-neutral-700/60'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Render suggested meals if attached */}
                  {msg.mealSuggestions && (
                    <div className="mt-3 pt-2 border-t border-neutral-700 space-y-2">
                      {msg.mealSuggestions.map((sug) => (
                        <div key={sug.id} className="p-2.5 rounded-xl bg-neutral-900/80 text-[11px] space-y-0.5">
                          <span className="font-bold text-white block">{sug.name}</span>
                          <span className="text-neutral-400">
                            {sug.calories} kcal • {sug.proteinG}g Protein • {sug.portionGuide}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Grocery List if attached */}
                  {msg.groceryList && (
                    <div className="mt-3 pt-2 border-t border-neutral-700 space-y-1">
                      {msg.groceryList.map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-cyan-300">
                          <Check className="w-3 h-3 text-cyan-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.safetyNotice && (
                    <div className="mt-2 text-[10px] text-neutral-400 italic flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{msg.safetyNotice}</span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-neutral-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
          </div>

          {/* Suggested Prompt Chips */}
          <div className="p-2.5 border-t border-neutral-800 flex items-center gap-2 overflow-x-auto text-[11px]">
            {[
              'High-protein breakfast ideas',
              'What should I eat before workout?',
              'Best post-workout vegetarian meals',
              'Generate 7-day grocery list',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => setInputText(chip)}
                className="px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 whitespace-nowrap transition"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <div className="p-3 sm:p-4 border-t border-neutral-800 flex items-center gap-2 bg-neutral-900">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                messageCount >= dailyMessageLimit
                  ? 'Daily free limit reached. Upgrade for unlimited coaching.'
                  : 'Ask about meals, proteins, calories, or recipes...'
              }
              disabled={messageCount >= dailyMessageLimit}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-neutral-800 border border-neutral-700 text-white text-xs focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || messageCount >= dailyMessageLimit}
              className="p-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white shadow-md shadow-orange-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GROCERY CHECKLIST */}
      {activeSubTab === 'grocery' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">7-Day Fitness Pantry Checklist</h3>
              <p className="text-xs text-neutral-400">Essential whole-food staples for steady gains and recovery.</p>
            </div>
            <button
              onClick={() => alert('Grocery checklist copied to clipboard!')}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold"
            >
              Copy Checklist
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { category: 'Proteins & Dairy', items: ['Low-fat Paneer (1kg)', 'Nutrela Soya Chunks (500g)', 'Eggs or Tofu', 'Greek Probiotic Curd (1kg)'] },
              { category: 'Complex Carbs & Grains', items: ['Rolled Oats (1kg)', 'Brown Basmati Rice (1kg)', 'Quinoa or Multigrain Atta', 'Roasted Chana Sattu (500g)'] },
              { category: 'Legumes & Pulses', items: ['Green Moong Dal for Sprouts', 'Kashmiri Rajma (500g)', 'Kabuli Chana (Chickpeas)', 'Yellow Moong Dal'] },
              { category: 'Smart Snacks & Fats', items: ['Puffed Foxnuts / Makhana', 'Chia Seeds & Flaxseeds', 'A2 Cow Ghee (Small jar)', 'Almonds & Walnuts'] }
            ].map((section, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-neutral-800/50 border border-neutral-800 space-y-2">
                <span className="font-bold text-orange-400 block">{section.category}</span>
                <ul className="space-y-1.5 text-neutral-300">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
