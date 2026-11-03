import {
  EatenItem,
  MealTemplate,
  NutrientValues,
  NValuesMap,
  PricesMap,
  TemplatesMap,
} from '../types';

export function getMealIngredients(mealData: MealTemplate | undefined): EatenItem[] {
  if (!mealData) return [];
  if (Array.isArray(mealData)) {
    return mealData;
  }
  if (typeof mealData === 'object' && 'ingredients' in mealData && Array.isArray(mealData.ingredients)) {
    return mealData.ingredients;
  }
  return [];
}

export function getMealCategory(mealData: MealTemplate | undefined): string | string[] {
  if (!mealData || Array.isArray(mealData)) return '';
  if (typeof mealData === 'object' && 'category' in mealData && mealData.category) {
    return mealData.category;
  }
  return '';
}

export function mealSupportsCategory(mealData: MealTemplate | undefined, targetCat: string): boolean {
  const mealCat = getMealCategory(mealData);
  if (!mealCat) return true; // compatible with all
  if (Array.isArray(mealCat)) {
    return mealCat.includes(targetCat);
  }
  if (typeof mealCat === 'string') {
    const allowed = mealCat.split(',').map((c) => c.trim().toLowerCase());
    return allowed.includes(targetCat.toLowerCase());
  }
  return true;
}

export function formatMealName(val: unknown): string {
  if (!val) return '-';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    return String(obj.nome || obj.pasto || '-');
  }
  return String(val);
}

export function calculateMealNutrients(
  mealName: string,
  templates: TemplatesMap,
  nvalues: NValuesMap,
  portionMultiplier = 1.0
): NutrientValues {
  const totali: NutrientValues = {
    kcal: 0.0,
    proteine: 0.0,
    carboidrati: 0.0,
    grassi: 0.0,
  };

  if (!mealName || mealName === '-') {
    return totali;
  }

  const ingredients = getMealIngredients(templates[mealName]);
  for (const [food, qty] of ingredients) {
    const info = nvalues[food];
    if (info) {
      const effQty = qty * portionMultiplier;
      totali.kcal += (info.kcal || 0.0) * effQty;
      totali.proteine += (info.proteine || 0.0) * effQty;
      totali.carboidrati += (info.carboidrati || 0.0) * effQty;
      totali.grassi += (info.grassi || 0.0) * effQty;
    }
  }

  return totali;
}

export function calculateMealCost(
  mealName: string,
  templates: TemplatesMap,
  prices: PricesMap,
  portionMultiplier = 1.0
): number | null {
  if (!mealName || mealName === '-') {
    return 0.0;
  }

  const ingredients = getMealIngredients(templates[mealName]);
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  let costo = 0.0;
  for (const [food, qty] of ingredients) {
    const p = prices[food];
    if (p === undefined || p === null || p <= 0.0) {
      return null;
    }
    costo += p * (qty * portionMultiplier);
  }

  return costo;
}

export function calculateEatenNutrients(
  eatenList: EatenItem[],
  nvalues: NValuesMap
): NutrientValues {
  const totali: NutrientValues = {
    kcal: 0.0,
    proteine: 0.0,
    carboidrati: 0.0,
    grassi: 0.0,
  };

  if (!Array.isArray(eatenList)) return totali;

  for (const [food, qty] of eatenList) {
    const info = nvalues[food];
    if (info) {
      totali.kcal += (info.kcal || 0.0) * qty;
      totali.proteine += (info.proteine || 0.0) * qty;
      totali.carboidrati += (info.carboidrati || 0.0) * qty;
      totali.grassi += (info.grassi || 0.0) * qty;
    }
  }

  return totali;
}

export function calculateTodayKcal(todayEaten: EatenItem[], nvalues: NValuesMap): number {
  const nutrients = calculateEatenNutrients(todayEaten, nvalues);
  return Math.round(nutrients.kcal * 10) / 10;
}

export function calculateTodayProteins(todayEaten: EatenItem[], nvalues: NValuesMap): number {
  const nutrients = calculateEatenNutrients(todayEaten, nvalues);
  return Math.round(nutrients.proteine * 10) / 10;
}
