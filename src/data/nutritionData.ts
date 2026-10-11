/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Universal Fitness & Human Performance Platform
 * Nutrition Data Models, Meal Plans & Daily Tracking Utilities
 */

import { AthleteProfile, DietPreference } from '../types/app.ts';
import { FoodCardMeal } from '../pages/NutritionPage.tsx';

export const DIET_MEAL_PLANS: Record<DietPreference, FoodCardMeal[]> = {
  'High Protein Omnivore': [
    {
      id: 'hpo-breakfast',
      category: 'Breakfast',
      title: 'Anabolic Pastured Egg Scramble & Sprouted Toast',
      time: '07:30',
      calories: 740,
      protein: 52,
      carbs: 68,
      fats: 28,
      description:
        'Pasture-raised whole eggs and egg whites folded with baby spinach, sliced Hass avocado, and warm organic sprouted sourdough toast.',
      ingredients: [
        '4 Pastured Eggs + 2 Whites',
        '2 Slices Sprouted Sourdough',
        '1/2 Hass Avocado',
        'Baby Spinach & Celtic Sea Salt',
      ],
    },
    {
      id: 'hpo-lunch',
      category: 'Lunch',
      title: 'Flame-Seared Flank Steak & Sweet Potato Mash',
      time: '12:30',
      calories: 890,
      protein: 64,
      carbs: 92,
      fats: 26,
      description:
        'Grass-fed flank steak served with roasted spiced sweet potatoes, steamed broccoli florets, and cold-pressed extra virgin olive oil.',
      ingredients: [
        '220g Grass-Fed Flank Steak',
        '300g Roasted Sweet Potato',
        'Steamed Broccoli Florets',
        '15ml Extra Virgin Olive Oil',
      ],
    },
    {
      id: 'hpo-dinner',
      category: 'Dinner',
      title: 'Wild King Salmon, Jasmine Rice & Tender Asparagus',
      time: '19:30',
      calories: 840,
      protein: 58,
      carbs: 78,
      fats: 32,
      description:
        'Crisp-skin wild Alaskan king salmon with steamed fragrant jasmine rice and grilled asparagus spears tossed in lemon olive oil.',
      ingredients: [
        '200g Wild King Salmon',
        '180g Jasmine Rice (Cooked)',
        '150g Grilled Asparagus',
        'Lemon & Fresh Garlic',
      ],
    },
    {
      id: 'hpo-snacks',
      category: 'Snacks',
      title: 'Triple-Zero Greek Yogurt & Mixed Forest Berries',
      time: '16:00',
      calories: 380,
      protein: 36,
      carbs: 42,
      fats: 6,
      description:
        'Strained non-fat Greek yogurt folded with raw clover honey, wild blueberries, and crushed raw almonds for sustained recovery.',
      ingredients: [
        '250g Non-Fat Greek Yogurt',
        '100g Wild Blueberries',
        '15g Raw Almonds',
        '1 tsp Raw Honey',
      ],
    },
  ],

  'Plant-Based / Vegan': [
    {
      id: 'pbv-breakfast',
      category: 'Breakfast',
      title: 'Golden Tofu Scramble & Sprouted Ezekiel Toast',
      time: '07:30',
      calories: 680,
      protein: 44,
      carbs: 72,
      fats: 22,
      description:
        'Organic firm tofu scrambled with turmeric, nutritional yeast, baby spinach, roasted bell peppers, and fresh sliced avocado.',
      ingredients: [
        '250g Organic Firm Tofu',
        '2 tbsp Nutritional Yeast',
        '2 Slices Ezekiel Toast',
        '1/2 Avocado & Baby Spinach',
      ],
    },
    {
      id: 'pbv-lunch',
      category: 'Lunch',
      title: 'Crispy Tempeh & Ancient Grain Quinoa Power Bowl',
      time: '12:30',
      calories: 860,
      protein: 56,
      carbs: 98,
      fats: 24,
      description:
        'Marinated roasted tempeh with tri-color quinoa, black beans, shelled edamame, and cold-pressed lemon-tahini dressing.',
      ingredients: [
        '200g Organic Tempeh',
        '200g Cooked Quinoa',
        '100g Shelled Edamame',
        'Tahini & Fresh Lemon Dressing',
      ],
    },
    {
      id: 'pbv-dinner',
      category: 'Dinner',
      title: 'Slow-Simmered Red Lentil Dahl & Brown Basmati',
      time: '19:30',
      calories: 820,
      protein: 48,
      carbs: 110,
      fats: 18,
      description:
        'Nutrient-dense red lentil and chickpea curry with fresh ginger, garam masala, steamed brown basmati rice, and wilted kale.',
      ingredients: [
        '180g Red Lentils & Chickpeas',
        '200g Brown Basmati Rice',
        'Steamed Lacinato Kale',
        'Coconut Milk & Ginger',
      ],
    },
    {
      id: 'pbv-snacks',
      category: 'Snacks',
      title: 'Cold-Pressed Pea Protein & Chia Hemp Seed Pudding',
      time: '16:00',
      calories: 390,
      protein: 38,
      carbs: 38,
      fats: 10,
      description:
        'Cold-pressed pea protein isolate blended with unsweetened almond milk, chia seeds, hemp hearts, and fresh raspberries.',
      ingredients: [
        '1 Scoop Pea Protein Isolate',
        '20g Chia Seeds',
        '15g Hemp Hearts',
        'Almond Milk & Raspberries',
      ],
    },
  ],

  Vegetarian: [
    {
      id: 'veg-breakfast',
      category: 'Breakfast',
      title: 'Cottage Cheese Oat Cakes & Strawberry Compote',
      time: '07:30',
      calories: 710,
      protein: 50,
      carbs: 76,
      fats: 20,
      description:
        'Fluffy high-protein pancakes prepared with whipped cottage cheese, rolled oats, farm egg whites, and warm crushed berries.',
      ingredients: [
        '200g Low-fat Cottage Cheese',
        '80g Rolled Oats',
        '3 Egg Whites',
        'Fresh Strawberries & Cinnamon',
      ],
    },
    {
      id: 'veg-lunch',
      category: 'Lunch',
      title: 'Grilled Halloumi, French Green Lentils & Farro',
      time: '12:30',
      calories: 880,
      protein: 54,
      carbs: 88,
      fats: 32,
      description:
        'Golden grilled halloumi slices layered over simmered green lentils, pearled farro, roasted cherry tomatoes, and herb oil.',
      ingredients: [
        '120g Cypriot Halloumi',
        '180g Cooked French Lentils',
        '100g Pearled Farro',
        'Roasted Cherry Tomatoes & Thyme',
      ],
    },
    {
      id: 'veg-dinner',
      category: 'Dinner',
      title: 'Pan-Roasted Paneer, Saffron Quinoa & Spiced Chickpeas',
      time: '19:30',
      calories: 830,
      protein: 52,
      carbs: 82,
      fats: 30,
      description:
        'Spiced pan-seared paneer cubes with saffron-infused quinoa, roasted garbanzo beans, and steamed baby spinach with ghee.',
      ingredients: [
        '160g Organic Paneer',
        '180g Saffron Quinoa',
        '120g Roasted Chickpeas',
        'Baby Spinach & Grass-Fed Ghee',
      ],
    },
    {
      id: 'veg-snacks',
      category: 'Snacks',
      title: 'Native Whey Isolate & Himalayan Salted Almonds',
      time: '16:00',
      calories: 360,
      protein: 34,
      carbs: 22,
      fats: 14,
      description:
        'Native grass-fed whey isolate shaken with cold water, paired with dry-roasted Himalayan salted almonds and crisp green apple.',
      ingredients: [
        '35g Whey Protein Isolate',
        '25g Dry-Roasted Almonds',
        '1 Crisp Green Apple',
      ],
    },
  ],

  'Ketogenic / Low-Carb': [
    {
      id: 'keto-breakfast',
      category: 'Breakfast',
      title: 'Pastured Eggs, Smoked Salmon & Sliced Hass Avocado',
      time: '07:30',
      calories: 780,
      protein: 48,
      carbs: 8,
      fats: 62,
      description:
        '3 pasture-raised eggs scrambled in grass-fed ghee, wild smoked sockeye salmon, and a whole ripe avocado with sea salt.',
      ingredients: [
        '3 Pastured Eggs (in Ghee)',
        '120g Wild Smoked Salmon',
        '1 Whole Hass Avocado',
        'Sea Salt & Everything Seasoning',
      ],
    },
    {
      id: 'keto-lunch',
      category: 'Lunch',
      title: 'Grass-Fed Ribeye Steak & Herbed Compound Butter',
      time: '12:30',
      calories: 920,
      protein: 68,
      carbs: 6,
      fats: 70,
      description:
        'Pan-seared prime ribeye topped with compound herb butter, served alongside sautéed zucchini medallions in olive oil.',
      ingredients: [
        '250g Prime Ribeye Steak',
        '20g Compound Garlic Butter',
        '200g Sautéed Zucchini in Olive Oil',
      ],
    },
    {
      id: 'keto-dinner',
      category: 'Dinner',
      title: 'Crispy Skin Chicken Thighs & Whipped Cauliflower',
      time: '19:30',
      calories: 820,
      protein: 56,
      carbs: 9,
      fats: 62,
      description:
        'Cast-iron roasted chicken thighs with Kalamata olive tapenade and heavy-cream whipped cauliflower mash.',
      ingredients: [
        '250g Bone-in Chicken Thighs',
        '30g Kalamata Olive Tapenade',
        '200g Whipped Cauliflower Mash',
      ],
    },
    {
      id: 'keto-snacks',
      category: 'Snacks',
      title: 'Raw Macadamia Nuts & Grass-Fed Collagen Brew',
      time: '16:00',
      calories: 420,
      protein: 26,
      carbs: 5,
      fats: 36,
      description:
        'Raw Hawaiian macadamia nuts paired with hot dark roast coffee blended with hydrolyzed collagen peptides and C8 MCT oil.',
      ingredients: [
        '40g Raw Macadamia Nuts',
        '20g Hydrolyzed Collagen Peptides',
        '10ml C8 MCT Oil',
        'Dark Roast Black Coffee',
      ],
    },
  ],

  'Mediterranean / Balanced': [
    {
      id: 'med-breakfast',
      category: 'Breakfast',
      title: 'Poached Eggs, Sourdough & Cold-Pressed Olive Oil',
      time: '07:30',
      calories: 720,
      protein: 42,
      carbs: 65,
      fats: 32,
      description:
        'Soft poached eggs served over artisan sourdough with ripe heirloom tomatoes, wild baby arugula, and extra virgin olive oil.',
      ingredients: [
        '3 Poached Eggs',
        '2 Slices Artisan Sourdough',
        'Heirloom Tomato & Wild Arugula',
        '15ml Cold-Pressed Olive Oil',
      ],
    },
    {
      id: 'med-lunch',
      category: 'Lunch',
      title: 'Grilled Lemon Herb Chicken & Greek Farro Salad',
      time: '12:30',
      calories: 860,
      protein: 62,
      carbs: 84,
      fats: 28,
      description:
        'Oregano-marinated chicken breast served over pearled farro, diced cucumber, Kalamata olives, sheep feta, and mint vinaigrette.',
      ingredients: [
        '220g Chicken Breast',
        '180g Cooked Farro',
        'Cucumber, Olives & 30g Sheep Feta',
        'Oregano Vinaigrette',
      ],
    },
    {
      id: 'med-dinner',
      category: 'Dinner',
      title: 'Pan-Seared Mediterranean Sea Bass & Wild Rice',
      time: '19:30',
      calories: 810,
      protein: 56,
      carbs: 75,
      fats: 30,
      description:
        'Wild Mediterranean branzino fillets sautéed with capers, garlic, steamed wild rice, and braised artichoke hearts.',
      ingredients: [
        '220g Fresh Sea Bass Fillet',
        '180g Steamed Wild Rice',
        '120g Braised Artichokes & Capers',
        'Fresh Lemon & Extra Virgin Olive Oil',
      ],
    },
    {
      id: 'med-snacks',
      category: 'Snacks',
      title: 'Greek Yogurt with Crushed Walnuts & Fresh Figs',
      time: '16:00',
      calories: 360,
      protein: 30,
      carbs: 34,
      fats: 12,
      description:
        'Authentic strained yogurt drizzled with raw wildflower honey, crushed raw walnuts, and sliced Turkish figs.',
      ingredients: [
        '220g Authentic Greek Yogurt',
        '20g Raw Walnuts',
        '2 Fresh Figs',
        '1 tsp Raw Honey',
      ],
    },
  ],
};

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetWaterMl: number;
}

/**
 * Calculates Mifflin-St Jeor metabolic targets grounded in athlete biometrics
 */
export function calculateNutritionTargets(athlete: AthleteProfile): NutritionTargets {
  const weightKg = athlete.weightKg || 86.4;
  const heightCm = athlete.heightCm || 188;
  const age = athlete.age || 26;
  const activityLevel = athlete.activityLevel || 'Very Active';

  // Basal Metabolic Rate
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);

  // Activity Multiplier
  let activityMultiplier = 1.725;
  switch (activityLevel) {
    case 'Sedentary':
      activityMultiplier = 1.2;
      break;
    case 'Lightly Active':
      activityMultiplier = 1.375;
      break;
    case 'Moderately Active':
      activityMultiplier = 1.55;
      break;
    case 'Very Active':
      activityMultiplier = 1.725;
      break;
    case 'Elite Training':
      activityMultiplier = 1.9;
      break;
  }

  const tdee = Math.round(bmr * activityMultiplier);

  let targetCalories = tdee;
  if (athlete.goals?.includes('Weight loss')) {
    targetCalories = Math.round(tdee - 450);
  } else if (athlete.goals?.includes('Muscle gain')) {
    targetCalories = Math.round(tdee + 350);
  } else if (athlete.goals?.includes('Strength')) {
    targetCalories = Math.round(tdee + 200);
  } else if (athlete.goals?.includes('Endurance')) {
    targetCalories = Math.round(tdee + 250);
  }

  let targetProtein = Math.round(weightKg * 2.0);
  if (
    athlete.goals?.includes('Weight loss') ||
    athlete.goals?.includes('Muscle gain') ||
    athlete.goals?.includes('Strength')
  ) {
    targetProtein = Math.round(weightKg * 2.2);
  }

  const targetWaterMl = Math.round(weightKg * 40 + 600);

  // Remaining calories into carbs & fats
  const proteinCals = targetProtein * 4;
  const remainingCals = Math.max(0, targetCalories - proteinCals);
  const targetFats = Math.round((remainingCals * 0.35) / 9);
  const targetCarbs = Math.round((remainingCals * 0.65) / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
    targetWaterMl,
  };
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getNutritionStorageKey(dateStr?: string): string {
  const d = dateStr || getTodayDateString();
  return `axio_nutrition_log_${d}`;
}

export interface StoredDailyNutritionLog {
  date: string;
  consumedMealLog: Record<string, string>;
  consumedMealIds: string[];
  customMeals: FoodCardMeal[];
  waterConsumedMl: number;
  activeDiet: DietPreference;
}

export function getTodayNutritionLog(): StoredDailyNutritionLog {
  const key = getNutritionStorageKey();
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          date: parsed.date || getTodayDateString(),
          consumedMealLog: parsed.consumedMealLog || {},
          consumedMealIds: Array.isArray(parsed.consumedMealIds) ? parsed.consumedMealIds : Object.keys(parsed.consumedMealLog || {}),
          customMeals: Array.isArray(parsed.customMeals) ? parsed.customMeals : [],
          waterConsumedMl: typeof parsed.waterConsumedMl === 'number' ? parsed.waterConsumedMl : 0,
          activeDiet: parsed.activeDiet || 'High Protein Omnivore',
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load daily nutrition log', e);
  }

  return {
    date: getTodayDateString(),
    consumedMealLog: {},
    consumedMealIds: [],
    customMeals: [],
    waterConsumedMl: 0,
    activeDiet: 'High Protein Omnivore',
  };
}

export function saveTodayNutritionLog(log: StoredDailyNutritionLog): boolean {
  const key = getNutritionStorageKey(log.date);
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(log));
      window.dispatchEvent(new CustomEvent('axio-nutrition-updated', { detail: log }));
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to save daily nutrition log', e);
    return false;
  }
}

/**
 * Gets all meals for current athlete diet preference
 */
export function getMealsForDiet(diet: DietPreference): FoodCardMeal[] {
  return DIET_MEAL_PLANS[diet] || DIET_MEAL_PLANS['High Protein Omnivore'];
}

/**
 * Marks breakfast as completed for today
 */
export function markBreakfastCompleted(athlete: AthleteProfile): {
  success: boolean;
  alreadyCompleted: boolean;
  mealTitle?: string;
  calories?: number;
  protein?: number;
  timestamp?: string;
} {
  const log = getTodayNutritionLog();
  const diet = athlete.dietPreference || log.activeDiet || 'High Protein Omnivore';
  const meals = getMealsForDiet(diet);
  const breakfast = meals.find((m) => m.category === 'Breakfast');

  if (!breakfast) {
    return { success: false, alreadyCompleted: false };
  }

  if (log.consumedMealLog[breakfast.id]) {
    return {
      success: true,
      alreadyCompleted: true,
      mealTitle: breakfast.title,
      calories: breakfast.calories,
      protein: breakfast.protein,
      timestamp: log.consumedMealLog[breakfast.id],
    };
  }

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const updatedLog: StoredDailyNutritionLog = {
    ...log,
    consumedMealLog: {
      ...log.consumedMealLog,
      [breakfast.id]: nowTime,
    },
    consumedMealIds: Array.from(new Set([...log.consumedMealIds, breakfast.id])),
    activeDiet: diet,
  };

  const saved = saveTodayNutritionLog(updatedLog);
  return {
    success: saved,
    alreadyCompleted: false,
    mealTitle: breakfast.title,
    calories: breakfast.calories,
    protein: breakfast.protein,
    timestamp: nowTime,
  };
}

/**
 * Marks all meals in today's nutrition plan as completed
 */
export function markAllMealsCompleted(athlete: AthleteProfile): {
  success: boolean;
  mealsCount: number;
  totalCalories: number;
  totalProtein: number;
} {
  const log = getTodayNutritionLog();
  const diet = athlete.dietPreference || log.activeDiet || 'High Protein Omnivore';
  const meals = getMealsForDiet(diet);
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newConsumedMap: Record<string, string> = { ...log.consumedMealLog };
  let totalCals = 0;
  let totalProt = 0;

  meals.forEach((m) => {
    if (!newConsumedMap[m.id]) {
      newConsumedMap[m.id] = nowTime;
    }
    totalCals += m.calories;
    totalProt += m.protein;
  });

  const updatedLog: StoredDailyNutritionLog = {
    ...log,
    consumedMealLog: newConsumedMap,
    consumedMealIds: Object.keys(newConsumedMap),
    activeDiet: diet,
  };

  const saved = saveTodayNutritionLog(updatedLog);
  return {
    success: saved,
    mealsCount: meals.length,
    totalCalories: totalCals,
    totalProtein: totalProt,
  };
}
